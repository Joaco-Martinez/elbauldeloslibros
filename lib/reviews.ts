import { promises as fs } from 'node:fs';
import path from 'node:path';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/*
 * Opiniones de compradores (una por pedido): reseña de cada libro, experiencia con la tienda y sugerencias.
 * - Las reseñas de libros se publican solo cuando las aprobás en el panel (marca "Compra verificada").
 * - La experiencia con la tienda se muestra solo si el cliente dio permiso y la aprobás.
 * - Las sugerencias son privadas.
 * Se guardan igual que los pedidos: Upstash Redis en producción, .data/opiniones.json en la compu.
 */

export type ReviewStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface BookReview {
  bookId: string;
  title: string;
  rating: number;
  text: string;
  status: ReviewStatus;
}

export interface Feedback {
  orderId: string;
  createdAt: string;
  /** Nombre de pila y ciudad: lo único que se muestra en público. */
  nombre: string;
  ciudad: string;
  books: BookReview[];
  store: { rating: number; text: string; allowPublish: boolean; status: ReviewStatus };
  /** "¿Qué mejorarías?" (privado). */
  suggestion: string;
}

interface FeedbackStore {
  save(f: Feedback): Promise<void>;
  get(orderId: string): Promise<Feedback | null>;
  list(): Promise<Feedback[]>;
}

function upstashStore(cfg: { url: string; token: string }): FeedbackStore {
  return {
    async save(f) {
      await upstashPipeline(cfg, [
        ['SET', `feedback:${f.orderId}`, JSON.stringify(f)],
        ['ZADD', 'feedback', Date.parse(f.createdAt), f.orderId],
      ]);
    },
    async get(orderId) {
      const [raw] = await upstashPipeline(cfg, [['GET', `feedback:${orderId}`]]);
      return typeof raw === 'string' ? (JSON.parse(raw) as Feedback) : null;
    },
    async list() {
      const [ids] = await upstashPipeline(cfg, [['ZRANGE', 'feedback', 0, 499, 'REV']]);
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const [raws] = await upstashPipeline(cfg, [['MGET', ...ids.map((id) => `feedback:${id}`)]]);
      return (raws as (string | null)[]).flatMap((r) => (r ? [JSON.parse(r) as Feedback] : []));
    },
  };
}

function fileStore(file: string): FeedbackStore {
  let queue: Promise<unknown> = Promise.resolve();
  async function readAll(): Promise<Record<string, Feedback>> {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, Feedback>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }
  return {
    save(f) {
      const run = queue.then(async () => {
        const all = await readAll();
        all[f.orderId] = f;
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(`${file}.tmp`, JSON.stringify(all, null, 2), 'utf8');
        await fs.rename(`${file}.tmp`, file);
      });
      queue = run.catch(() => undefined);
      return run;
    },
    async get(orderId) {
      return (await readAll())[orderId] ?? null;
    },
    async list() {
      return Object.values(await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}

const cfg = upstashConfig();

export const feedbackStore: FeedbackStore = cfg ? upstashStore(cfg) : fileStore(path.join(process.cwd(), '.data', 'opiniones.json'));

export interface PublicReview {
  rating: number;
  text: string;
  nombre: string;
  ciudad: string;
  createdAt: string;
}

/** Reseñas aprobadas de un libro (las más nuevas primero) y el promedio. */
export async function bookReviews(bookId: string): Promise<{ reviews: PublicReview[]; average: number | null }> {
  const all = await feedbackStore.list().catch(() => [] as Feedback[]);
  const reviews = all.flatMap((f) =>
    f.books
      .filter((b) => b.bookId === bookId && b.status === 'aprobada')
      .map((b) => ({ rating: b.rating, text: b.text, nombre: f.nombre, ciudad: f.ciudad, createdAt: f.createdAt })),
  );
  const average = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null;
  return { reviews, average };
}

/** Opiniones de la tienda que se pueden mostrar (con permiso del cliente y aprobadas). */
export async function storeTestimonials(): Promise<PublicReview[]> {
  const all = await feedbackStore.list().catch(() => [] as Feedback[]);
  return all
    .filter((f) => f.store.allowPublish && f.store.status === 'aprobada' && f.store.text)
    .map((f) => ({ rating: f.store.rating, text: f.store.text, nombre: f.nombre, ciudad: f.ciudad, createdAt: f.createdAt }));
}
