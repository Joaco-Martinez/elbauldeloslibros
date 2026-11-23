import { promises as fs } from 'node:fs';
import path from 'node:path';
import { applyCustomCatalog, type CustomBook, type CustomCatalog, type CustomCategory } from '@/data/books';
import { upstashConfig, upstashPipeline } from '@/lib/upstash';

/**
 * Libros cargados o editados desde el panel (/admin/libros) y sus fotos.
 * - En producción: Upstash Redis (hash "libros": id → JSON; foto en la clave "tapa:<id>").
 * - En la compu: .data/libros.json y .data/tapas/<id>.json.
 * La lista final (código + panel) vive en data/books.ts; acá solo se lee y se guarda.
 */

export interface StoredCover {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Foto en base64. */
  data: string;
}

interface CatalogBackend {
  all(): Promise<CustomBook[]>;
  save(book: CustomBook): Promise<void>;
  remove(id: string): Promise<void>;
  allCategories(): Promise<CustomCategory[]>;
  saveCategory(cat: CustomCategory): Promise<void>;
  removeCategory(id: string): Promise<void>;
  getCover(id: string): Promise<StoredCover | null>;
  saveCover(id: string, cover: StoredCover): Promise<void>;
  removeCover(id: string): Promise<void>;
}

function upstashBackend(cfg: { url: string; token: string }): CatalogBackend {
  const hashValues = async <T>(key: string): Promise<T[]> => {
    const [raw] = await upstashPipeline(cfg, [['HGETALL', key]]);
    const list: T[] = [];
    if (Array.isArray(raw)) {
      for (let i = 1; i < raw.length; i += 2) {
        try {
          list.push(JSON.parse(String(raw[i])) as T);
        } catch {
          // dato roto: se ignora
        }
      }
    }
    return list;
  };
  return {
    all: () => hashValues<CustomBook>('libros'),
    async save(book) {
      await upstashPipeline(cfg, [['HSET', 'libros', book.id, JSON.stringify(book)]]);
    },
    async remove(id) {
      await upstashPipeline(cfg, [['HDEL', 'libros', id]]);
    },
    allCategories: () => hashValues<CustomCategory>('secciones'),
    async saveCategory(cat) {
      await upstashPipeline(cfg, [['HSET', 'secciones', cat.id, JSON.stringify(cat)]]);
    },
    async removeCategory(id) {
      await upstashPipeline(cfg, [['HDEL', 'secciones', id]]);
    },
    async getCover(id) {
      const [raw] = await upstashPipeline(cfg, [['GET', `tapa:${id}`]]);
      return typeof raw === 'string' ? (JSON.parse(raw) as StoredCover) : null;
    },
    async saveCover(id, cover) {
      await upstashPipeline(cfg, [['SET', `tapa:${id}`, JSON.stringify(cover)]]);
    },
    async removeCover(id) {
      await upstashPipeline(cfg, [['DEL', `tapa:${id}`]]);
    },
  };
}

function fileBackend(dir: string): CatalogBackend {
  const file = path.join(dir, 'libros.json');
  const coverFile = (id: string) => path.join(dir, 'tapas', `${id}.json`);
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn);
    queue = run.catch(() => undefined);
    return run;
  };
  const readJson = async <T>(f: string): Promise<T | null> => {
    try {
      return JSON.parse((await fs.readFile(f, 'utf8')).replace(/^﻿/, '')) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  };
  const writeJson = async (f: string, value: unknown) => {
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(`${f}.tmp`, JSON.stringify(value, null, 2), 'utf8');
    await fs.rename(`${f}.tmp`, f);
  };
  const readMap = async () => (await readJson<Record<string, CustomBook>>(file)) ?? {};
  const catFile = path.join(dir, 'secciones.json');
  const readCats = async () => (await readJson<Record<string, CustomCategory>>(catFile)) ?? {};
  return {
    allCategories: () => serial(async () => Object.values(await readCats())),
    saveCategory: (cat) =>
      serial(async () => {
        const map = await readCats();
        map[cat.id] = cat;
        await writeJson(catFile, map);
      }),
    removeCategory: (id) =>
      serial(async () => {
        const map = await readCats();
        delete map[id];
        await writeJson(catFile, map);
      }),
    all: () => serial(async () => Object.values(await readMap())),
    save: (book) =>
      serial(async () => {
        const map = await readMap();
        map[book.id] = book;
        await writeJson(file, map);
      }),
    remove: (id) =>
      serial(async () => {
        const map = await readMap();
        delete map[id];
        await writeJson(file, map);
      }),
    getCover: (id) => readJson<StoredCover>(coverFile(id)),
    saveCover: (id, cover) => writeJson(coverFile(id), cover),
    removeCover: (id) => fs.rm(coverFile(id), { force: true }),
  };
}

const cfg = upstashConfig();
const backend: CatalogBackend = cfg ? upstashBackend(cfg) : fileBackend(path.join(process.cwd(), '.data'));

/** Ids válidos: minúsculas, números y guiones (es la dirección /catalogo/<id>). */
export const BOOK_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let loadedAt = 0;
let current: CustomCatalog = { books: [], categories: [] };
let inflight: Promise<void> | null = null;

/**
 * Trae de la base los libros del panel y los suma al catálogo. Hay que llamarla antes de usar
 * books / getBook() en el servidor. Como mucho una lectura cada 3 segundos por instancia.
 * Si la base falla, la tienda sigue con lo último que tenía (o con los libros del código).
 */
export async function loadCatalog(force = false) {
  if (!force && Date.now() - loadedAt < 3000) return;
  inflight ??= (async () => {
    try {
      const [books, categories] = await Promise.all([backend.all(), backend.allCategories()]);
      current = { books, categories };
      applyCustomCatalog(current);
      loadedAt = Date.now();
    } catch (err) {
      console.error('[catalogo] No se pudieron leer los libros del panel:', err);
    }
  })().finally(() => {
    inflight = null;
  });
  await inflight;
}

/** Lo último que se leyó con loadCatalog (para pasárselo al navegador). */
export const loadedCustomCatalog = () => current;

export async function getCustomBook(id: string) {
  await loadCatalog(true);
  return current.books.find((b) => b.id === id) ?? null;
}

export async function getCustomCategory(id: string) {
  await loadCatalog(true);
  return current.categories.find((c) => c.id === id) ?? null;
}

export async function saveCustomCategory(cat: CustomCategory) {
  await backend.saveCategory(cat);
  await loadCatalog(true);
}

export async function removeCustomCategory(id: string) {
  await backend.removeCategory(id);
  await loadCatalog(true);
}

export async function saveCustomBook(book: CustomBook) {
  await backend.save(book);
  await loadCatalog(true);
}

export async function removeCustomBook(id: string) {
  await backend.remove(id);
  await backend.removeCover(id);
  await loadCatalog(true);
}

export const getUploadedCover = (id: string) => backend.getCover(id);
export const saveUploadedCover = (id: string, cover: StoredCover) => backend.saveCover(id, cover);
export const removeUploadedCover = (id: string) => backend.removeCover(id);
