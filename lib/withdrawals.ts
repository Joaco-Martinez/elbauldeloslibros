import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Pedidos de arrepentimiento (botón de arrepentimiento, Res. SCI 424/2020).
 * Se guardan igual que los pedidos: Upstash Redis en producción, .data/arrepentimientos.json en la compu.
 */
export interface Withdrawal {
  /** Código que se le informa al cliente (ej. ARR-7K2Q-9MXD). */
  code: string;
  createdAt: string;
  nombre: string;
  email: string;
  telefono: string;
  /** Número de pedido que escribió el cliente (puede venir vacío o mal escrito). */
  pedido: string;
  /** Si el número coincide con un pedido real del mismo email. */
  orderId?: string;
  motivo: string;
  /** Cuándo lo diste por resuelto desde el panel. */
  resolvedAt?: string;
}

/** Código fácil de dictar: sin 0/O ni 1/I. */
export function newWithdrawalCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => abc[b % abc.length]).join('');
  return `ARR-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export const WITHDRAWAL_CODE_RE = /^ARR-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

interface WithdrawalStore {
  save(w: Withdrawal): Promise<void>;
  get(code: string): Promise<Withdrawal | null>;
  list(): Promise<Withdrawal[]>;
}

function upstashStore(cfg: { url: string; token: string }): WithdrawalStore {
  return {
    async save(w) {
      await upstashPipeline(cfg, [
        ['SET', `withdrawal:${w.code}`, JSON.stringify(w)],
        ['ZADD', 'withdrawals', Date.parse(w.createdAt), w.code],
      ]);
    },
    async get(code) {
      const [raw] = await upstashPipeline(cfg, [['GET', `withdrawal:${code}`]]);
      return typeof raw === 'string' ? (JSON.parse(raw) as Withdrawal) : null;
    },
    async list() {
      const [codes] = await upstashPipeline(cfg, [['ZRANGE', 'withdrawals', 0, 199, 'REV']]);
      if (!Array.isArray(codes) || codes.length === 0) return [];
      const [raws] = await upstashPipeline(cfg, [['MGET', ...codes.map((c) => `withdrawal:${c}`)]]);
      return (raws as (string | null)[]).flatMap((r) => (r ? [JSON.parse(r) as Withdrawal] : []));
    },
  };
}

function fileStore(file: string): WithdrawalStore {
  let queue: Promise<unknown> = Promise.resolve();
  async function readAll(): Promise<Record<string, Withdrawal>> {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, Withdrawal>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }
  return {
    save(w) {
      const run = queue.then(async () => {
        const all = await readAll();
        all[w.code] = w;
        await fs.mkdir(path.dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
        await fs.rename(tmp, file);
      });
      queue = run.catch(() => undefined);
      return run;
    },
    async get(code) {
      return (await readAll())[code] ?? null;
    },
    async list() {
      return Object.values(await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}

const cfg = upstashConfig();

export const withdrawalStore: WithdrawalStore = cfg
  ? upstashStore(cfg)
  : fileStore(path.join(process.cwd(), '.data', 'arrepentimientos.json'));
