import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LineInput } from '@/lib/pricing';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Carritos de quienes completaron email o celular en el checkout pero no compraron.
 * Se guardan igual que los pedidos: Upstash Redis en producción, .data/carts.json en la compu.
 * Se borran solos a los 30 días y en cuanto esa persona confirma el pedido.
 */
export interface AbandonedCart {
  /** Id que genera el navegador del cliente para este checkout. */
  id: string;
  createdAt: string;
  updatedAt: string;
  items: LineInput[];
  nombre: string;
  email: string;
  telefono: string;
  provincia: string;
  /** Cuándo le escribiste (para no escribirle dos veces). */
  contactedAt?: string;
  /** Viene de un pedido que se canceló solo por no pagar en 24 h. */
  fromOrderId?: string;
}

/** Id de carrito fijo para un pedido vencido (así no se duplica si se vuelve a procesar). */
export function cartIdForOrder(orderId: string) {
  const h = createHash('sha256').update(`order:${orderId}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Recién después de esto se considera abandonado (antes puede estar comprando todavía). */
export const ABANDONED_AFTER_MS = 2 * 3_600_000;
/** Se borran solos pasado este tiempo. */
export const KEEP_MS = 30 * 24 * 3_600_000;

export const CART_ID_RE = /^[a-f0-9-]{36}$/;

/** Cuando alguien confirma un pedido, se borran sus carritos guardados (por id de checkout o por email). */
export async function forgetCartsOf(draftId: unknown, email: string) {
  const ids = new Set<string>();
  if (typeof draftId === 'string' && CART_ID_RE.test(draftId)) ids.add(draftId);
  const mail = email.trim().toLowerCase();
  if (mail) for (const c of await cartStore.list()) if (c.email.toLowerCase() === mail) ids.add(c.id);
  for (const id of ids) await cartStore.remove(id);
}

interface CartStore {
  save(cart: AbandonedCart): Promise<void>;
  get(id: string): Promise<AbandonedCart | null>;
  list(): Promise<AbandonedCart[]>;
  remove(id: string): Promise<void>;
}

function upstashStore(cfg: { url: string; token: string }): CartStore {
  const ttl = Math.round(KEEP_MS / 1000);
  return {
    async save(cart) {
      await upstashPipeline(cfg, [
        ['SET', `cart:${cart.id}`, JSON.stringify(cart), 'EX', ttl],
        ['ZADD', 'carts', Date.parse(cart.updatedAt), cart.id],
        ['ZREMRANGEBYSCORE', 'carts', 0, Date.now() - KEEP_MS],
      ]);
    },
    async get(id) {
      const [raw] = await upstashPipeline(cfg, [['GET', `cart:${id}`]]);
      return typeof raw === 'string' ? (JSON.parse(raw) as AbandonedCart) : null;
    },
    async list() {
      const [ids] = await upstashPipeline(cfg, [['ZRANGE', 'carts', 0, 199, 'REV']]);
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const [raws] = await upstashPipeline(cfg, [['MGET', ...ids.map((id) => `cart:${id}`)]]);
      return (raws as (string | null)[]).flatMap((r) => (r ? [JSON.parse(r) as AbandonedCart] : []));
    },
    async remove(id) {
      await upstashPipeline(cfg, [
        ['DEL', `cart:${id}`],
        ['ZREM', 'carts', id],
      ]);
    },
  };
}

function fileStore(file: string): CartStore {
  let queue: Promise<unknown> = Promise.resolve();

  async function readAll(): Promise<Record<string, AbandonedCart>> {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, AbandonedCart>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }

  /** Cambios en fila (para no pisarse) y limpieza de los vencidos en cada escritura. */
  function update(change: (all: Record<string, AbandonedCart>) => void) {
    const run = queue.then(async () => {
      const all = await readAll();
      change(all);
      const limit = Date.now() - KEEP_MS;
      for (const [id, c] of Object.entries(all)) if (Date.parse(c.updatedAt) < limit) delete all[id];
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
      await fs.rename(tmp, file);
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    save: (cart) =>
      update((all) => {
        all[cart.id] = cart;
      }),
    async get(id) {
      return (await readAll())[id] ?? null;
    },
    async list() {
      const limit = Date.now() - KEEP_MS;
      return Object.values(await readAll())
        .filter((c) => Date.parse(c.updatedAt) >= limit)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    remove: (id) =>
      update((all) => {
        delete all[id];
      }),
  };
}

const cfg = upstashConfig();

export const cartStore: CartStore = cfg ? upstashStore(cfg) : fileStore(path.join(process.cwd(), '.data', 'carts.json'));

export { restoreCartUrl } from '@/lib/receipt';
