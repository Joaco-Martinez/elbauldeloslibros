import type { Tone } from '@/lib/tokens';
import { momentoIds, setCustomMomentos, type MomentoId } from './momentos';
import { setCustomRazones, type Razon } from './razones';

/** Id de la sección (las de abajo, o las creadas desde el panel en /admin/secciones). */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
  /** Color de las tarjetas de los libros de esta sección (igual en todo el sitio). */
  tone: Tone;
}

/** Sección creada o editada desde el panel. Si tiene el id de una de abajo, la reemplaza. */
export interface CustomCategory extends Category {
  /** Posición en el catálogo (menor = más arriba). */
  order: number;
  createdAt: number;
}

/**
 * Secciones base, en el orden del catálogo. Cada una con su color de tarjeta
 * (ni crema ni naranja: se tienen que leer sobre las secciones crema y naranjas del catálogo).
 */
const baseCategories: Category[] = [
  { id: 'desarrollo', label: 'Desarrollo personal', blurb: 'Para empezar el cambio por casa.', tone: 'moss' }, // verde medio: crecer
  { id: 'finanzas', label: 'Finanzas y negocios', blurb: 'Para ordenar la plata y las ideas.', tone: 'mustard' }, // dorado
  { id: 'romance', label: 'Romance', blurb: 'Para suspirar entre capítulos.', tone: 'brick' }, // terracota
  { id: 'filosofia', label: 'Filosofía', blurb: 'Para pensar despacio.', tone: 'beige' }, // papel
  { id: 'espiritualidad', label: 'Espiritualidad', blurb: 'Para volver al presente.', tone: 'forest' }, // verde bosque
  { id: 'thriller', label: 'Thriller y suspenso', blurb: 'Para no poder soltarlo.', tone: 'ink' }, // casi negro
];

/** Ids de las secciones de este archivo (las demás se crearon en el panel). */
export const codeCategoryIds = new Set(baseCategories.map((c) => c.id));

/** Orden en el que aparecen en el catálogo y en los filtros (base + panel; se actualiza adentro). */
export const categories: Category[] = baseCategories.map((c) => ({ ...c }));

/** Orden por defecto de una sección base (para mezclarlas con las del panel). */
export const baseCategoryOrder = (id: string) => baseCategories.findIndex((c) => c.id === id) * 10;

/** Lo único que hay que cargar por libro. */
export interface StockEntry {
  /** También es el slug: /catalogo/<id> y el nombre de la foto en /public/images/libros/<id>.png */
  id: string;
  title: string;
  author?: string;
  category: CategoryId;
  /**
   * Precio FINAL pagando con transferencia, en pesos y sin decimales (lo que cobrás de verdad).
   * El precio de lista (Mercado Pago) se calcula solo: este número + el 10%, redondeado para arriba a $ 100.
   */
  precioTransferencia: number;
  sinopsis: string;
  /** Aparece en "Llená tu biblioteca." en Inicio. */
  destacado?: boolean;
  /**
   * Stock inicial en 0 mientras no se cargue en el panel (/admin/stock).
   * El stock real se maneja desde el panel; esto solo vale si el libro nunca se cargó ahí.
   */
  sinStock?: boolean;
  /** Ruta de una foto con otro nombre (opcional). */
  imagen?: string;
  /** "Tapa blanda", "Tapa dura"… (opcional). Se muestra junto al título en el carrito y los pedidos. */
  formato?: string;
  /** Libros con el mismo `grupo` son ediciones del mismo título: una sola tarjeta y un selector en la página. */
  grupo?: string;
  /** Colores manuales (opcional). Si no, se asignan solos. */
  colorDeTarjeta?: Tone;
  colorDePortada?: Tone;
  colorDeDetalle?: Tone;
}

/** Foto subida desde el panel: se sirve en /api/tapas/<id>-<v>.jpg (lib/catalog.ts). */
export interface UploadedCover {
  /** Cambia con cada foto nueva, así el navegador no muestra la vieja. */
  v: number;
  /** Ancho / alto. */
  ratio: number;
}

/**
 * Libro cargado o editado desde el panel (/admin/libros). Se guarda en la base de datos, no en este archivo.
 * Si tiene el mismo id que uno de la lista de abajo, lo reemplaza (es una edición).
 */
export interface CustomBook extends StockEntry {
  momentos?: MomentoId[];
  razones?: [Razon, Razon, Razon, Razon];
  tapa?: UploadedCover;
  createdAt: number;
  updatedAt: number;
}

export interface Book extends StockEntry {
  /** Precio de lista (Mercado Pago). Pagando con transferencia se paga `precioTransferencia`. */
  price: number;
  colorDeTarjeta: Tone;
  colorDePortada: Tone;
  colorDeDetalle: Tone;
  tapa?: UploadedCover;
  /** codigo = solo en este archivo · editado = de este archivo, cambiado en el panel · panel = agregado en el panel. */
  origen: 'codigo' | 'editado' | 'panel';
  /**
   * Solo en las listas de la tienda (oneCardPerTitle): formatos disponibles de este título, del más barato al más caro.
   * Si hay más de uno, la tarjeta dice "Desde".
   */
  ediciones?: string[];
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------
const stock: StockEntry[] = [
  // Desarrollo personal
  {
    id: 'habitos-atomicos',
    title: 'Hábitos atómicos',
    author: 'James Clear',
    category: 'desarrollo',
    precioTransferencia: 15000,
    destacado: true,
    sinopsis:
      'Pequeños cambios, resultados enormes: un método práctico para armar buenos hábitos, dejar los malos y mejorar un poco cada día.',
  },
  {
    id: 'la-montana-eres-tu',
    title: 'La montaña eres tú',
    author: 'Brianna Wiest',
    category: 'desarrollo',
    precioTransferencia: 16000,
    sinStock: true,
    sinopsis:
      'Sobre cómo dejar de sabotearte: entender lo que te frena por dentro y convertirlo en impulso.',
  },
  {
    id: 'la-inteligencia-emocional',
    title: 'La inteligencia emocional',
    author: 'Daniel Goleman',
    category: 'desarrollo',
    precioTransferencia: 19000,
    sinopsis:
      'El clásico que explicó por qué manejar las emociones importa tanto como el coeficiente intelectual, en el trabajo y en la vida.',
  },
  {
    id: 'el-ego-es-el-enemigo',
    title: 'El ego es el enemigo',
    author: 'Ryan Holiday',
    category: 'desarrollo',
    precioTransferencia: 16000,
    sinopsis:
      'Con historias reales y filosofía estoica, una invitación a mantener los pies en la tierra cuando aspirás, cuando ganás y cuando perdés.',
  },
  {
    id: 'el-poder-de-las-palabras',
    title: 'El poder de las palabras',
    author: 'Mariano Sigman',
    category: 'desarrollo',
    precioTransferencia: 18000,
    sinopsis:
      'Cómo la conversación, con otros y con uno mismo, puede cambiar la forma en que pensamos y sentimos. Neurociencia contada simple.',
  },

  // Finanzas y negocios
  {
    id: 'como-ganar-amigos',
    title: 'Cómo ganar amigos e influir sobre las personas',
    author: 'Dale Carnegie',
    category: 'finanzas',
    precioTransferencia: 12000,
    sinopsis:
      'El libro que enseñó a generaciones a escuchar, conectar y convencer sin pelear. Consejos simples que siguen funcionando.',
  },
  {
    id: 'padre-rico-padre-pobre',
    title: 'Padre rico, padre pobre',
    author: 'Robert T. Kiyosaki',
    category: 'finanzas',
    precioTransferencia: 16000,
    destacado: true,
    sinopsis:
      'Dos padres, dos maneras de pensar la plata. Una introducción clara a la educación financiera, los activos y los pasivos.',
  },
  {
    id: 'la-psicologia-del-dinero',
    title: 'La psicología del dinero',
    author: 'Morgan Housel',
    category: 'finanzas',
    precioTransferencia: 15000,
    sinopsis:
      'Historias cortas sobre por qué las decisiones con la plata dependen más del comportamiento que de las fórmulas.',
  },
  {
    id: 'el-inversor-inteligente',
    title: 'El inversor inteligente',
    author: 'Benjamin Graham',
    category: 'finanzas',
    precioTransferencia: 22000,
    sinopsis:
      'La obra de referencia de la inversión en valor: invertir con criterio, paciencia y margen de seguridad.',
  },
  {
    id: 'de-cero-a-uno',
    title: 'De cero a uno',
    author: 'Peter Thiel con Blake Masters',
    category: 'finanzas',
    precioTransferencia: 16000,
    sinopsis:
      'Ideas sobre startups y sobre cómo construir el futuro: crear algo nuevo en lugar de copiar lo que ya existe.',
  },
  {
    id: 'el-millonario-de-la-puerta-de-al-lado',
    title: 'El millonario de la puerta de al lado',
    author: 'Thomas J. Stanley y William D. Danko',
    category: 'finanzas',
    precioTransferencia: 17000,
    sinopsis:
      'Cómo viven de verdad muchas personas que hicieron fortuna: gastan menos de lo que ganan y ahorran con constancia.',
  },
  {
    id: 'el-hombre-mas-rico-de-babilonia',
    title: 'El hombre más rico de Babilonia',
    author: 'George S. Clason',
    category: 'finanzas',
    precioTransferencia: 16000,
    sinopsis:
      'Parábolas de la antigua Babilonia con lecciones simples para ahorrar, invertir y hacer crecer el dinero.',
  },

  // Romance
  {
    id: 'el-dia-que-dejo-de-nevar-en-alaska',
    title: 'El día que dejó de nevar en Alaska',
    author: 'Alice Kellen',
    category: 'romance',
    precioTransferencia: 18000,
    sinopsis:
      'Una chica que escapa de su pasado llega a un pueblo perdido de Alaska. Una historia de amor, heridas y segundas oportunidades.',
  },

  // Filosofía
  {
    id: '50-proverbios-estoicos',
    title: '50 proverbios estoicos para una buena vida',
    author: 'Luis León',
    category: 'filosofia',
    precioTransferencia: 15000,
    sinopsis: 'Una selección de enseñanzas de la tradición estoica para leer de a una y llevar al día a día.',
  },
  {
    id: 'los-cuatro-acuerdos',
    title: 'Los cuatro acuerdos',
    author: 'Don Miguel Ruiz',
    category: 'filosofia',
    precioTransferencia: 15000,
    sinopsis:
      'Cuatro acuerdos simples, inspirados en la sabiduría tolteca, para vivir con más libertad y menos sufrimiento.',
  },
  {
    id: 'el-camino-del-hombre-superior',
    title: 'El camino del hombre superior',
    author: 'David Deida',
    category: 'filosofia',
    precioTransferencia: 15000,
    sinopsis: 'Una guía sobre propósito, vínculos y deseo para hombres que quieren vivir con más presencia.',
  },

  // Espiritualidad
  {
    id: 'el-poder-del-ahora',
    title: 'El poder del ahora',
    author: 'Eckhart Tolle',
    category: 'espiritualidad',
    precioTransferencia: 16000,
    sinopsis:
      'Una invitación a salir del ruido de la mente y vivir en el presente. Uno de los libros de espiritualidad más leídos.',
  },
  {
    id: 'el-alquimista',
    title: 'El alquimista',
    author: 'Paulo Coelho',
    category: 'espiritualidad',
    precioTransferencia: 15000,
    formato: 'Tapa blanda',
    grupo: 'el-alquimista',
    sinopsis:
      'Santiago, un joven pastor andaluz, cruza el desierto detrás de un sueño. Una fábula sobre animarse a seguir tu propio camino.',
  },
  {
    // Misma obra, otra edición: se muestra como un solo libro con selector (ver `grupo`).
    id: 'el-alquimista-tapa-dura',
    title: 'El alquimista',
    author: 'Paulo Coelho',
    category: 'espiritualidad',
    precioTransferencia: 17500,
    formato: 'Tapa dura',
    grupo: 'el-alquimista',
    // Mismo diseño de tapa que la blanda: la diferencia se ve en el libro 3D (más grueso, cartón, lomo redondeado).
    imagen: '/images/libros/el-alquimista.jpg',
    sinopsis:
      'Santiago, un joven pastor andaluz, cruza el desierto detrás de un sueño. Una fábula sobre animarse a seguir tu propio camino.',
  },
  {
    id: 'el-hombre-en-busca-de-sentido',
    title: 'El hombre en busca de sentido',
    author: 'Viktor E. Frankl',
    category: 'espiritualidad',
    precioTransferencia: 12000,
    destacado: true,
    sinopsis:
      'Frankl cuenta su experiencia en los campos de concentración y cómo encontrar sentido incluso en el sufrimiento.',
  },

  // Thriller y suspenso
  {
    id: 'la-paciente-silenciosa',
    title: 'La paciente silenciosa',
    author: 'Alex Michaelides',
    category: 'thriller',
    precioTransferencia: 17000,
    destacado: true,
    sinopsis:
      'Alicia Berenson mata a su marido y no vuelve a decir una palabra. Un psicoterapeuta se obsesiona con hacerla hablar.',
  },
];

// ---------------------------------------------------------------------------
// Colores automáticos: cada sección tiene su color de tarjeta (Category.tone), igual en todo el sitio.
// ---------------------------------------------------------------------------

/** Colores que se pueden elegir para una sección (ni crema ni naranja: son los fondos del catálogo). */
export const SECTION_TONES: { tone: Tone; label: string }[] = [
  { tone: 'moss', label: 'Verde' },
  { tone: 'forest', label: 'Verde bosque' },
  { tone: 'leaf', label: 'Verde oliva' },
  { tone: 'mustard', label: 'Mostaza' },
  { tone: 'brick', label: 'Terracota' },
  { tone: 'rust', label: 'Óxido' },
  { tone: 'leather', label: 'Cuero' },
  { tone: 'beige', label: 'Papel' },
  { tone: 'ink', label: 'Negro' },
];

/** Color de tarjeta de una sección. */
export const categoryTone = (id: CategoryId): Tone => categories.find((c) => c.id === id)?.tone ?? 'moss';

/** Color de portada (solo para libros sin foto) según el color de la tarjeta; rota dentro del género. */
const COVERS_BY_CARD: Partial<Record<Tone, Tone[]>> = {
  moss: ['mustard', 'cream', 'rust'],
  mustard: ['forest', 'rust'],
  brick: ['mustard', 'leaf', 'cream'],
  beige: ['rust', 'forest', 'leaf'],
  forest: ['orange', 'mustard', 'rust'],
  ink: ['rust', 'mustard', 'cream'],
  rust: ['mustard', 'cream', 'forest'],
  leaf: ['mustard', 'cream', 'rust'],
  leather: ['mustard', 'cream', 'orange'],
};

const ACCENT_BY_COVER: Partial<Record<Tone, Tone>> = {
  rust: 'mustard',
  forest: 'mustard',
  leaf: 'mustard',
  orange: 'cream',
  mustard: 'forest',
  cream: 'rust',
};

/**
 * Precio de lista a partir del precio con transferencia: que el 10% de descuento deje exactamente
 * el precio con transferencia. Se redondea para arriba a $ 100 (ej.: 15.000 → 16.700).
 */
// (transfer * 10 / 9 en vez de / 0.9: evita que 18.000 dé 20.100 por un error de redondeo de la computadora).
export const listPrice = (transfer: number) => Math.ceil((transfer * 10) / 9 / 100) * 100;

type Entry = StockEntry & { tapa?: UploadedCover; origen: Book['origen'] };

function buildBooks(entries: Entry[]): Book[] {
  const indexInCategory = new Map<string, number>();
  for (const c of categories) {
    entries.filter((b) => b.category === c.id).forEach((b, i) => indexInCategory.set(b.id, i));
  }
  return entries.map((entry) => {
    const i = indexInCategory.get(entry.id) ?? 0;
    const card = entry.colorDeTarjeta ?? categoryTone(entry.category);
    const covers = COVERS_BY_CARD[card] ?? ['rust'];
    const cover = entry.colorDePortada ?? covers[i % covers.length];
    return {
      ...entry,
      // Todos los libros son tapa blanda salvo que se indique otra cosa.
      formato: entry.formato || 'Tapa blanda',
      price: listPrice(entry.precioTransferencia),
      colorDeTarjeta: card,
      colorDePortada: cover,
      colorDeDetalle: entry.colorDeDetalle ?? ACCENT_BY_COVER[cover] ?? 'mustard',
    };
  });
}

/** Ids de los libros de este archivo (los demás se agregaron desde el panel). */
export const codeBookIds = new Set(stock.map((b) => b.id));

/** Datos originales de un libro de este archivo (para "volver a los datos originales"). */
export const codeBook = (id: string) => stock.find((b) => b.id === id);

/**
 * Todos los títulos del catálogo: los de este archivo + los cargados en el panel.
 * Cuáles se muestran depende del stock (lib/stock.ts, panel /admin/stock).
 * Es la misma lista siempre (se actualiza adentro), así getBook() sirve en el servidor y en el navegador.
 */
export const books: Book[] = buildBooks(stock.map((e) => ({ ...e, origen: 'codigo' })));

/** Lo cargado en el panel: libros y secciones. */
export interface CustomCatalog {
  books: CustomBook[];
  categories: CustomCategory[];
}

let appliedKey = '';

/**
 * Suma a las listas los libros y secciones cargados/editados en el panel. En el servidor lo llama lib/catalog.ts
 * (después de leer la base); en el navegador, el carrito (con lo que le pasa el layout).
 */
export function applyCustomCatalog(custom: CustomCatalog) {
  const key = JSON.stringify(custom);
  if (key === appliedKey) return;
  appliedKey = key;

  // Secciones: base (o su versión editada) + las nuevas, ordenadas.
  const catById = new Map(custom.categories.map((c) => [c.id, c]));
  const merged = [
    ...baseCategories.map((c) => {
      const edit = catById.get(c.id);
      return { cat: edit ? pickCategory(edit) : { ...c }, order: edit?.order ?? baseCategoryOrder(c.id), createdAt: 0 };
    }),
    ...custom.categories
      .filter((c) => !codeCategoryIds.has(c.id))
      .map((c) => ({ cat: pickCategory(c), order: c.order, createdAt: c.createdAt })),
  ].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  categories.splice(0, categories.length, ...merged.map((m) => m.cat));

  // Libros.
  const byId = new Map(custom.books.map((c) => [c.id, c]));
  const fromCode: Entry[] = stock.map((e) => {
    const edit = byId.get(e.id);
    return edit ? { ...stripMeta(edit), origen: 'editado' } : { ...e, origen: 'codigo' };
  });
  const added: Entry[] = custom.books
    .filter((c) => !codeBookIds.has(c.id))
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((c) => ({ ...stripMeta(c), origen: 'panel' }));
  books.splice(0, books.length, ...buildBooks([...fromCode, ...added]));
  setCustomMomentos(Object.fromEntries(custom.books.filter((c) => c.momentos?.length).map((c) => [c.id, c.momentos!])));
  setCustomRazones(Object.fromEntries(custom.books.filter((c) => c.razones?.length === 4).map((c) => [c.id, c.razones!])));
}

const pickCategory = ({ id, label, blurb, tone }: Category): Category => ({ id, label, blurb, tone });

function stripMeta({ momentos: _m, razones: _r, createdAt: _c, updatedAt: _u, ...entry }: CustomBook) {
  return entry;
}

// Las funciones de listado reciben la lista a usar: en las páginas, solo los libros con stock.
/** Ya no se usa en el Inicio (ahí van los más vendidos del mes, lib/monthlyPicks.ts). */
export const featuredBooks = (list: Book[] = books) => list.filter((b) => b.destacado);

export const booksInCategory = (category: CategoryId, list: Book[] = books) => list.filter((b) => b.category === category);

export const getBook = (id: string) => books.find((b) => b.id === id);

/** Sección de un libro. Si la borraron, una genérica (el libro igual se muestra). */
export const getCategory = (id: CategoryId): Category =>
  categories.find((c) => c.id === id) ?? { id, label: 'Libros', blurb: '', tone: 'moss' };

// ---------------------------------------------------------------------------
// Ediciones (tapa blanda / tapa dura…): cada una es un libro con su id, precio y stock,
// unidas por `grupo`. En la tienda se ven como un solo título.
// ---------------------------------------------------------------------------

/**
 * "Hábitos atómicos (tapa dura)": para carrito, checkout y pedidos.
 * Solo si el título tiene varias ediciones o no es tapa blanda (la tapa blanda sola no hace falta aclararla).
 */
export const fullTitle = (book: Pick<Book, 'title' | 'formato' | 'grupo'>) =>
  book.formato && (book.grupo || book.formato !== 'Tapa blanda') ? `${book.title} (${book.formato.toLowerCase()})` : book.title;

/** Ediciones del mismo título dentro de `list` (incluye al libro), de la más barata a la más cara. */
export function editionsOf(book: Book, list: Book[] = books): Book[] {
  if (!book.grupo) return [book];
  return list.filter((b) => b.grupo === book.grupo).sort((a, b) => a.precioTransferencia - b.precioTransferencia);
}

/**
 * Una sola tarjeta por título: de cada grupo queda la edición más barata (con `ediciones` = formatos disponibles).
 * Mantiene el orden de la lista (en el lugar de la primera edición que aparece).
 */
export function oneCardPerTitle(list: Book[]): Book[] {
  const seen = new Set<string>();
  const out: Book[] = [];
  for (const b of list) {
    if (!b.grupo) {
      out.push(b);
      continue;
    }
    if (seen.has(b.grupo)) continue;
    seen.add(b.grupo);
    const eds = editionsOf(b, list);
    out.push(eds.length > 1 ? { ...eds[0], ediciones: eds.map((e) => e.formato ?? 'Otra edición') } : eds[0]);
  }
  return out;
}

/** Para detectar el mismo título cargado dos veces: sin tildes, mayúsculas ni signos. */
export const normalizeTitle = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();

/** Primero los de la misma categoría, después el resto. */
/** Géneros cercanos (de ida y vuelta): suman al relacionar libros. Los que no están, no se cruzan. */
const NEARBY_GENRES: [CategoryId, CategoryId, number][] = [
  ['desarrollo', 'filosofia', 2],
  ['desarrollo', 'espiritualidad', 2],
  ['filosofia', 'espiritualidad', 2],
  ['desarrollo', 'finanzas', 1.5],
  ['romance', 'thriller', 2], // ficción
];

const genreAffinity = (a: CategoryId, b: CategoryId) =>
  a === b ? 3 : (NEARBY_GENRES.find(([x, y]) => (x === a && y === b) || (x === b && y === a))?.[2] ?? 0);

/**
 * Qué tan relacionado está un libro con otro:
 * - momentos en común ("Bajar la ansiedad", "Ordenar tu plata"…): cuenta más si es de los principales de los dos;
 *   "Simplemente leer" cuenta poco porque es muy general.
 * - mismo género o género cercano.
 * Con 0, no tienen nada que ver.
 */
export function relatedness(a: Book, b: Book) {
  const ma = momentoIds(a.id);
  const mb = momentoIds(b.id);
  let score = 0;
  ma.forEach((m, i) => {
    const j = mb.indexOf(m);
    if (j === -1) return;
    const weight = (3 - Math.min(i, 2)) + (3 - Math.min(j, 2)); // 2 a 6 según qué tan principal es en cada uno
    score += m === 'leer' ? weight * 0.25 : weight;
  });
  const genre = genreAffinity(a.category, b.category);
  // Género cercano solo, sin ningún momento en común, no alcanza (ej. El alquimista y Hábitos atómicos).
  if (score === 0 && a.category !== b.category) return 0;
  // Un momento en común sin género cercano (ej. finanzas y filosofía por "vínculos") cuenta, pero menos.
  return genre === 0 ? score * 0.5 : score + genre;
}

/** "Seguí leyendo": los más relacionados. Si hay menos de `count` que tengan que ver, devuelve menos. */
export function relatedBooks(book: Book, count = 4, list: Book[] = books) {
  return list
    .filter((b) => b.id !== book.id)
    .map((b) => ({ b, score: relatedness(book, b) }))
    .filter(({ score }) => score >= 2)
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map(({ b }) => b);
}

/** "de James Clear", o vacío si no hay autor cargado. */
export const byline = (book: Book) => (book.author ? `de ${book.author}` : '');
