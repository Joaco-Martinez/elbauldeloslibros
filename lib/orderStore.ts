import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Order } from '@/lib/orderTypes';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Dónde se guardan los pedidos.
 * - Con UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: en Upstash Redis (para producción, ej. Vercel).
 * - Sin eso: en .data/orders.json (solo para desarrollo o un servidor con disco propio).
 */
interface OrderStore {
  save(order: Order): Promise<void>;
  get(id: string): Promise<Order | null>;
  list(limit?: number): Promise<Order[]>;
}

function upstashStore(cfg: { url: string; token: string }): OrderStore {
  return {
    async save(order) {
      await upstashPipeline(cfg, [
        ['SET', `order:${order.id}`, JSON.stringify(order)],
        ['ZADD', 'orders', Date.parse(order.createdAt), order.id],
      ]);
    },
    async get(id) {
      const [raw] = await upstashPipeline(cfg, [['GET', `order:${id}`]]);
      return typeof raw === 'string' ? (JSON.parse(raw) as Order) : null;
    },
    async list(limit = 200) {
      const [ids] = await upstashPipeline(cfg, [['ZRANGE', 'orders', 0, limit - 1, 'REV']]);
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const [raws] = await upstashPipeline(cfg, [['MGET', ...ids.map((id) => `order:${id}`)]]);
      return (raws as (string | null)[]).flatMap((r) => (r ? [JSON.parse(r) as Order] : []));
    },
  };
}

function fileStore(file: string): OrderStore {
  let queue: Promise<unknown> = Promise.resolve();

  async function readAll(): Promise<Record<string, Order>> {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, Order>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }

  return {
    save(order) {
      // Escrituras en fila para no pisar cambios simultáneos.
      const run = queue.then(async () => {
        const all = await readAll();
        all[order.id] = order;
        await fs.mkdir(path.dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
        await fs.rename(tmp, file);
      });
      queue = run.catch(() => undefined);
      return run;
    },
    async get(id) {
      return (await readAll())[id] ?? null;
    },
    async list(limit = 200) {
      return Object.values(await readAll())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
  };
}

const cfg = upstashConfig();

export const orderStore: OrderStore = cfg ? upstashStore(cfg) : fileStore(path.join(process.cwd(), '.data', 'orders.json'));
