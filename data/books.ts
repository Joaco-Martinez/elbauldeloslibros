import type { Tone } from '@/lib/tokens';
import { momentoIds } from './momentos';

export type CategoryId = 'desarrollo' | 'finanzas' | 'romance' | 'filosofia' | 'espiritualidad' | 'thriller';

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

/** Orden en el que aparecen en el catálogo y en los filtros. */
export const categories: Category[] = [
  { id: 'desarrollo', label: 'Desarrollo personal', blurb: 'Para empezar el cambio por casa.' },
  { id: 'finanzas', label: 'Finanzas y negocios', blurb: 'Para ordenar la plata y las ideas.' },
  { id: 'romance', label: 'Romance', blurb: 'Para suspirar entre capítulos.' },
  { id: 'filosofia', label: 'Filosofía', blurb: 'Para pensar despacio.' },
  { id: 'espiritualidad', label: 'Espiritualidad', blurb: 'Para volver al presente.' },
  { id: 'thriller', label: 'Thriller y suspenso', blurb: 'Para no poder soltarlo.' },
];

/** Lo único que hay que cargar por libro. */
interface StockEntry {
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
  /** Colores manuales (opcional). Si no, se asignan solos. */
  colorDeTarjeta?: Tone;
  colorDePortada?: Tone;
  colorDeDetalle?: Tone;
}

export interface Book extends StockEntry {
  /** Precio de lista (Mercado Pago). Pagando con transferencia se paga `precioTransferencia`. */
  price: number;
  colorDeTarjeta: Tone;
  colorDePortada: Tone;
  colorDeDetalle: Tone;
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
// Colores automáticos: cada género tiene su color de tarjeta, igual en todo el sitio.
// (Ni crema ni naranja: se tienen que leer sobre las secciones crema y naranjas del catálogo,
//  que alternan según qué géneros tengan stock.)
// ---------------------------------------------------------------------------
export const CATEGORY_TONE: Record<CategoryId, Tone> = {
  desarrollo: 'moss', // verde medio: crecer
  finanzas: 'mustard', // dorado
  romance: 'brick', // terracota
  filosofia: 'beige', // papel
  espiritualidad: 'forest', // verde bosque
  thriller: 'ink', // casi negro
};

/** Color de portada (solo para libros sin foto) según el color de la tarjeta; rota dentro del género. */
const COVERS_BY_CARD: Partial<Record<Tone, Tone[]>> = {
  moss: ['mustard', 'cream', 'rust'],
  mustard: ['forest', 'rust'],
  brick: ['mustard', 'leaf', 'cream'],
  beige: ['rust', 'forest', 'leaf'],
  forest: ['orange', 'mustard', 'rust'],
  ink: ['rust', 'mustard', 'cream'],
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

// Todos los títulos del catálogo. Cuáles se muestran depende del stock (lib/stock.ts, panel /admin/stock).
const indexInCategory = new Map<string, number>();
for (const c of categories) {
  stock.filter((b) => b.category === c.id).forEach((b, i) => indexInCategory.set(b.id, i));
}

export const books: Book[] = stock.map((entry) => {
  const i = indexInCategory.get(entry.id) ?? 0;
  const card = entry.colorDeTarjeta ?? CATEGORY_TONE[entry.category];
  const covers = COVERS_BY_CARD[card] ?? ['rust'];
  const cover = entry.colorDePortada ?? covers[i % covers.length];
  return {
    ...entry,
    price: listPrice(entry.precioTransferencia),
    colorDeTarjeta: card,
    colorDePortada: cover,
    colorDeDetalle: entry.colorDeDetalle ?? ACCENT_BY_COVER[cover] ?? 'mustard',
  };
});

// Las funciones de listado reciben la lista a usar: en las páginas, solo los libros con stock.
/** Ya no se usa en el Inicio (ahí van los más vendidos del mes, lib/monthlyPicks.ts). */
export const featuredBooks = (list: Book[] = books) => list.filter((b) => b.destacado);

export const booksInCategory = (category: CategoryId, list: Book[] = books) => list.filter((b) => b.category === category);

export const getBook = (id: string) => books.find((b) => b.id === id);

export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id)!;

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
