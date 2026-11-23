import { promises as fs } from 'node:fs';
import path from 'node:path';
import { books, getBook, type Book } from '@/data/books';
import { loadCatalog } from '@/lib/catalog';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Stock por libro, editable desde /admin/stock.
 * - Un número (0 o más): unidades disponibles. Con 0 el libro no aparece en la web.
 * - Sin número ("sin controlar"): se vende sin límite. Si el libro tiene `sinStock: true` en books.ts, cuenta como 0.
 */
type StockMap = Record<string, number>;

interface StockBackend {
  all(): Promise<StockMap>;
  set(id: string, units: number): Promise<void>;
  /** Suma (o resta) unidades y devuelve el nuevo valor. */
  incr(id: string, delta: number): Promise<number>;
}

function upstashBackend(cfg: { url: string; token: string }): StockBackend {
  return {
    async all() {
      const [raw] = await upstashPipeline(cfg, [['HGETALL', 'stock']]);
      const map: StockMap = {};
      if (Array.isArray(raw)) for (let i = 0; i + 1 < raw.length; i += 2) map[String(raw[i])] = Number(raw[i + 1]);
      return map;
    },
    async set(id, units) {
      await upstashPipeline(cfg, [['HSET', 'stock', id, units]]);
    },
    async incr(id, delta) {
      const [value] = await upstashPipeline(cfg, [['HINCRBY', 'stock', id, delta]]);
      return Number(value);
    },
  };
}

function fileBackend(file: string): StockBackend {
  let queue: Promise<unknown> = Promise.resolve();
  const read = async (): Promise<StockMap> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as StockMap;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  };
  const write = async (map: StockMap) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(`${file}.tmp`, JSON.stringify(map, null, 2), 'utf8');
    await fs.rename(`${file}.tmp`, file);
  };
  // Todo en fila: leer y escribir nunca se pisan.
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn);
    queue = run.catch(() => undefined);
    return run;
  };
  return {
    all: () => serial(read),
    set: (id, units) =>
      serial(async () => {
        const map = await read();
        map[id] = units;
        await write(map);
      }),
    incr: (id, delta) =>
      serial(async () => {
        const map = await read();
        map[id] = (map[id] ?? 0) + delta;
        await write(map);
        return map[id];
      }),
  };
}

const cfg = upstashConfig();
const backend: StockBackend = cfg ? upstashBackend(cfg) : fileBackend(path.join(process.cwd(), '.data', 'stock.json'));

/** null = sin controlar (sin límite). */
export type Units = number | null;

const effective = (book: Book, map: StockMap): Units => (book.id in map ? map[book.id] : book.sinStock ? 0 : null);

/** Stock de todos los libros del catálogo. */
export async function getStockMap(): Promise<Record<string, Units>> {
  // Libros cargados en el panel: se suman al catálogo antes de armar el mapa.
  const [map] = await Promise.all([backend.all(), loadCatalog()]);
  return Object.fromEntries(books.map((b) => [b.id, effective(b, map)]));
}

export const isAvailable = (units: Units | undefined) => units === null || units === undefined || units > 0;

/** Libros que hoy se pueden mostrar y vender. */
export async function getAvailableBooks(): Promise<Book[]> {
  const stock = await getStockMap();
  return books.filter((b) => isAvailable(stock[b.id]));
}

export async function setStock(id: string, units: number) {
  await loadCatalog();
  if (!getBook(id)) throw new Error('Libro inexistente');
  await backend.set(id, Math.max(0, Math.floor(units)));
}

/** Suma o resta desde el panel (nunca baja de 0). Si el libro estaba sin controlar, arranca desde 0. */
export async function adjustStock(id: string, delta: number) {
  await loadCatalog();
  const book = getBook(id);
  if (!book) throw new Error('Libro inexistente');
  const map = await backend.all();
  const current = effective(book, map) ?? 0;
  await backend.set(id, Math.max(0, current + delta));
}

type ReserveResult = { ok: true; reserved: { id: string; qty: number }[] } | { ok: false; error: string };

/**
 * Descuenta las unidades de un pedido. Si algún libro no alcanza, no descuenta nada.
 * Devuelve qué se descontó (para devolverlo si el pedido se cancela).
 */
export async function reserveStock(lines: { id: string; qty: number; title: string }[]): Promise<ReserveResult> {
  const [map] = await Promise.all([backend.all(), loadCatalog()]);
  const reserved: { id: string; qty: number }[] = [];

  const rollback = async () => {
    for (const r of reserved) await backend.incr(r.id, r.qty);
  };

  for (const line of lines) {
    const book = getBook(line.id);
    if (!book) continue;
    const units = effective(book, map);
    if (units === null) continue; // sin controlar: no se descuenta
    if (!(line.id in map)) {
      // sinStock en el código y nunca cargado en el panel: 0 unidades
      await rollback();
      return { ok: false, error: `${line.title} se quedó sin stock.` };
    }
    const after = await backend.incr(line.id, -line.qty);
    if (after < 0) {
      await backend.incr(line.id, line.qty);
      await rollback();
      const left = after + line.qty;
      return {
        ok: false,
        error: left <= 0 ? `${line.title} se quedó sin stock.` : `De ${line.title} solo quedan ${left}. Ajustá la cantidad en el carrito.`,
      };
    }
    reserved.push({ id: line.id, qty: line.qty });
  }
  return { ok: true, reserved };
}

/** Devuelve al stock lo que había descontado un pedido. */
export async function releaseStock(reserved: { id: string; qty: number }[] | undefined) {
  for (const r of reserved ?? []) await backend.incr(r.id, r.qty);
}
