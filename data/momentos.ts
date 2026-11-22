/**
 * "Para tu momento": en qué momento de la vida conviene cada libro.
 * La idea de la tienda: elegir la próxima lectura por lo que estás viviendo, no por la tapa.
 */
export type MomentoId =
  | 'ansiedad'
  | 'habitos'
  | 'plata'
  | 'invertir'
  | 'emprender'
  | 'trabajo'
  | 'vinculos'
  | 'sentido'
  | 'dificil'
  | 'presente'
  | 'conocerme'
  | 'leer';

/** Texto de cada etiqueta (completa la frase "Para tu momento: …"). */
export const MOMENTOS: Record<MomentoId, string> = {
  ansiedad: 'Bajar la ansiedad',
  habitos: 'Cambiar hábitos',
  plata: 'Ordenar tu plata',
  invertir: 'Empezar a invertir',
  emprender: 'Emprender',
  trabajo: 'Crecer en el trabajo',
  vinculos: 'Mejorar tus vínculos',
  sentido: 'Buscar sentido',
  dificil: 'Atravesar un momento difícil',
  presente: 'Vivir el presente',
  conocerme: 'Conocerte más',
  leer: 'Simplemente leer',
};

/** Momentos de cada libro (por id), del más fuerte al más secundario. */
const momentosPorLibro: Record<string, MomentoId[]> = {
  // Desarrollo personal
  'habitos-atomicos': ['habitos', 'trabajo', 'conocerme'],
  'la-montana-eres-tu': ['conocerme', 'ansiedad', 'habitos'],
  'la-inteligencia-emocional': ['ansiedad', 'vinculos', 'conocerme'],
  'el-ego-es-el-enemigo': ['trabajo', 'emprender', 'conocerme'],
  'el-poder-de-las-palabras': ['vinculos', 'ansiedad', 'conocerme'],

  // Finanzas y negocios
  'como-ganar-amigos': ['vinculos', 'trabajo'],
  'padre-rico-padre-pobre': ['plata', 'invertir', 'emprender'],
  'la-psicologia-del-dinero': ['plata', 'invertir'],
  'el-inversor-inteligente': ['invertir', 'plata'],
  'de-cero-a-uno': ['emprender', 'trabajo'],
  'el-millonario-de-la-puerta-de-al-lado': ['plata', 'habitos'],
  'el-hombre-mas-rico-de-babilonia': ['plata', 'habitos', 'invertir'],

  // Romance
  'el-dia-que-dejo-de-nevar-en-alaska': ['leer', 'dificil'],

  // Filosofía
  '50-proverbios-estoicos': ['ansiedad', 'presente', 'dificil'],
  'los-cuatro-acuerdos': ['vinculos', 'ansiedad', 'conocerme'],
  'el-camino-del-hombre-superior': ['sentido', 'vinculos'],

  // Espiritualidad
  'el-poder-del-ahora': ['ansiedad', 'presente'],
  'el-alquimista': ['sentido', 'leer'],
  'el-hombre-en-busca-de-sentido': ['sentido', 'dificil'],

  // Thriller y suspenso
  'la-paciente-silenciosa': ['leer'],
};

/** Solo los ids, del más fuerte al más secundario (para relacionar libros). */
export const momentoIds = (bookId: string): MomentoId[] => momentosPorLibro[bookId] ?? [];

export const getMomentos = (bookId: string): { id: MomentoId; label: string }[] =>
  (momentosPorLibro[bookId] ?? []).map((id) => ({ id, label: MOMENTOS[id] }));
