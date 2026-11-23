/**
 * "4 razones para leer [título]": una por tarjeta, título corto + una o dos líneas.
 * La clave es el id del libro (data/books.ts). Si un libro no tiene razones, la sección no aparece.
 */
export interface Razon {
  titulo: string;
  texto: string;
}

export const razones: Record<string, [Razon, Razon, Razon, Razon]> = {
  // Desarrollo personal
  'habitos-atomicos': [
    { titulo: 'Cambios chicos, resultados enormes', texto: 'Te muestra por qué mejorar un poquito cada día, sumado en el tiempo, transforma tu vida.' },
    { titulo: 'Un método que aplicás mañana', texto: 'Cuatro leyes simples para armar buenos hábitos y desarmar los malos, con ejemplos concretos.' },
    { titulo: 'Empieza por quién querés ser', texto: 'Propone cambiar desde tu identidad, no solo desde las metas. Por eso los cambios duran.' },
    { titulo: 'Se lee rápido y se relee', texto: 'Capítulos cortos y claros, ideales para subrayar y volver cuando perdés el rumbo.' },
  ],
  'la-montana-eres-tu': [
    { titulo: 'Para dejar de sabotearte', texto: 'Te ayuda a reconocer los patrones que te frenan, sin culpa y con compasión.' },
    { titulo: 'Tus emociones tienen algo para decirte', texto: 'Propone escuchar lo que sentís en lugar de taparlo, y usarlo para avanzar.' },
    { titulo: 'Te habla de cerca', texto: 'Un tono cálido y directo, como una charla con alguien que ya pasó por ahí.' },
    { titulo: 'Para los días difíciles', texto: 'Frases que vas a querer subrayar y releer cada vez que lo necesites.' },
  ],
  'la-inteligencia-emocional': [
    { titulo: 'El clásico que cambió la conversación', texto: 'Popularizó una idea clave: manejar las emociones pesa tanto como el coeficiente intelectual.' },
    { titulo: 'Entendé tus reacciones', texto: 'Explica de dónde salen los arranques de enojo o ansiedad y cómo tomar el control.' },
    { titulo: 'Sirve en el trabajo y en casa', texto: 'Empatía, autocontrol y vínculos aplicados a situaciones de todos los días.' },
    { titulo: 'Con base en la ciencia', texto: 'Combina investigación y casos reales para explicar cómo funciona la mente emocional.' },
  ],
  'el-ego-es-el-enemigo': [
    { titulo: 'Los pies sobre la tierra', texto: 'Cómo evitar que el ego te juegue en contra cuando soñás, cuando ganás y cuando perdés.' },
    { titulo: 'Historias reales que enseñan', texto: 'Ejemplos de figuras de la historia, el deporte y los negocios que lo vivieron en carne propia.' },
    { titulo: 'Estoicismo aplicado', texto: 'Ideas de hace dos mil años que siguen funcionando para la vida de hoy.' },
    { titulo: 'Corto y directo', texto: 'Capítulos breves para leer de a uno y pensar el resto del día.' },
  ],
  'el-poder-de-las-palabras': [
    { titulo: 'Conversar te cambia la cabeza', texto: 'Muestra cómo hablar con otros puede transformar tus ideas y tus emociones.' },
    { titulo: 'Ciencia sin tecnicismos', texto: 'Neurociencia rigurosa contada de forma clara y entretenida.' },
    { titulo: 'Mejorá tu diálogo interno', texto: 'Herramientas para hablarte mejor a vos mismo y salir de los loops mentales.' },
    { titulo: 'De un neurocientífico argentino', texto: 'Mariano Sigman, investigador reconocido en todo el mundo, te lo cuenta en tu idioma.' },
  ],

  // Finanzas y negocios
  'como-ganar-amigos': [
    { titulo: 'Un clásico desde 1936', texto: 'Casi un siglo después, sus consejos siguen funcionando igual de bien.' },
    { titulo: 'Aprendé a escuchar de verdad', texto: 'Principios simples para conectar con cualquier persona, en cualquier lugar.' },
    { titulo: 'Convencer sin pelear', texto: 'Cómo persuadir y resolver conflictos sin discutir ni herir a nadie.' },
    { titulo: 'Te sirve en todos lados', texto: 'Ventas, liderazgo, trabajo en equipo, familia y amistades.' },
  ],
  'padre-rico-padre-pobre': [
    { titulo: 'Cambia cómo pensás la plata', texto: 'La diferencia entre trabajar por dinero y hacer que el dinero trabaje para vos.' },
    { titulo: 'Activos y pasivos, fácil', texto: 'Los conceptos básicos de las finanzas personales, explicados sin vueltas.' },
    { titulo: 'Una historia, no un manual', texto: 'Aprendés a través de dos padres con dos formas opuestas de ver el dinero.' },
    { titulo: 'Ideal para arrancar', texto: 'Uno de los libros más recomendados para empezar con la educación financiera.' },
  ],
  'la-psicologia-del-dinero': [
    { titulo: 'La plata es comportamiento', texto: 'Por qué importa más cómo actuás que cuánto sabés de finanzas.' },
    { titulo: 'Historias cortas y memorables', texto: 'Capítulos breves que se leen solos y se quedan con vos.' },
    { titulo: 'Decidí con calma', texto: 'Paciencia, ahorro y una pregunta clave: ¿cuánto es suficiente?' },
    { titulo: 'Para cualquier bolsillo', texto: 'No necesitás saber de economía para aprovecharlo desde la primera página.' },
  ],
  'el-inversor-inteligente': [
    { titulo: 'La biblia de la inversión en valor', texto: 'Warren Buffett lo definió como el mejor libro sobre inversiones que se escribió.' },
    { titulo: 'Margen de seguridad', texto: 'La idea central para invertir protegiéndote de tus propios errores.' },
    { titulo: 'Elegí tu estilo', texto: 'Inversor defensivo o emprendedor: te ayuda a elegir según tu tiempo y tu perfil.' },
    { titulo: 'Pensá a largo plazo', texto: 'Un antídoto contra la especulación, las modas y el pánico del mercado.' },
  ],
  'de-cero-a-uno': [
    { titulo: 'Crear, no copiar', texto: 'Por qué el verdadero valor está en hacer algo que todavía no existe.' },
    { titulo: 'La mirada de un fundador', texto: 'Peter Thiel cofundó PayPal y cuenta lo que aprendió construyendo empresas.' },
    { titulo: 'Preguntas que incomodan', texto: 'Te obliga a pensar distinto sobre emprender, competir y planificar.' },
    { titulo: 'Más allá de las startups', texto: 'Sus ideas sirven para cualquier proyecto que quieras hacer crecer.' },
  ],
  'el-millonario-de-la-puerta-de-al-lado': [
    { titulo: 'Rompe el mito del millonario', texto: 'Muchas personas con patrimonio viven de forma sencilla y sin lujos.' },
    { titulo: 'Basado en investigación', texto: 'Surge de estudiar los hábitos reales de quienes construyeron riqueza.' },
    { titulo: 'Gastá menos de lo que ganás', texto: 'Muestra por qué el ahorro constante pesa más que los ingresos altos.' },
    { titulo: 'Revisá tus hábitos', texto: 'Te invita a mirar tu consumo con otros ojos, sin culpa y con datos.' },
  ],
  'el-hombre-mas-rico-de-babilonia': [
    { titulo: 'Lecciones en forma de parábolas', texto: 'Historias de la antigua Babilonia que enseñan sin aburrir.' },
    { titulo: 'Reglas simples para ahorrar', texto: 'Como guardar siempre una parte de lo que ganás y hacerla crecer.' },
    { titulo: 'Se lee en una tarde', texto: 'Breve, ameno y perfecto para empezar a ordenar tus finanzas.' },
    { titulo: 'Un clásico desde 1926', texto: 'Generaciones lo leyeron y sus consejos siguen vigentes.' },
  ],

  // Romance
  'el-dia-que-dejo-de-nevar-en-alaska': [
    { titulo: 'Segundas oportunidades', texto: 'Una historia sobre animarse a volver a empezar cuando todo parecía perdido.' },
    { titulo: 'Un pueblo que se vuelve personaje', texto: 'El frío, la nieve y la calma de Alaska envuelven cada capítulo.' },
    { titulo: 'Personajes con heridas', texto: 'Dos personas que aprenden a sanar juntas, sin apuros.' },
    { titulo: 'Para no soltarlo', texto: 'Ritmo ágil y emoción a flor de piel: ideal para leer de un tirón.' },
  ],

  // Filosofía
  '50-proverbios-estoicos': [
    { titulo: 'Sabiduría en dosis chicas', texto: 'Un proverbio por vez, para leer en cinco minutos y pensar todo el día.' },
    { titulo: 'La puerta de entrada al estoicismo', texto: 'Una forma simple de acercarte a una de las filosofías más prácticas.' },
    { titulo: 'Para la mesita de luz', texto: 'Abrilo en cualquier página: siempre hay algo para vos.' },
    { titulo: 'Calma en días agitados', texto: 'Te ayuda a enfocarte en lo que depende de vos y soltar el resto.' },
  ],
  'los-cuatro-acuerdos': [
    { titulo: 'Cuatro ideas, una vida más liviana', texto: 'Ser impecable con tus palabras, no tomarte nada personal, no suponer y dar lo mejor.' },
    { titulo: 'Sabiduría ancestral', texto: 'Inspirado en la tradición tolteca, con un mensaje simple y profundo.' },
    { titulo: 'Corto pero transformador', texto: 'Se lee en poco tiempo y te acompaña durante años.' },
    { titulo: 'Ideal para regalar', texto: 'Un libro que todos deberían tener cerca. Y que dan ganas de compartir.' },
  ],
  'el-camino-del-hombre-superior': [
    { titulo: 'Vivir con propósito', texto: 'Una guía para encontrar dirección y sostenerla en el día a día.' },
    { titulo: 'Vínculos más honestos', texto: 'Habla de pareja, deseo y presencia sin vueltas ni rodeos.' },
    { titulo: 'Capítulos breves', texto: 'Ideas cortas y directas para leer de a una y poner en práctica.' },
    { titulo: 'Para releer', texto: 'Cada etapa de la vida le encuentra un sentido nuevo.' },
  ],

  // Espiritualidad
  'el-poder-del-ahora': [
    { titulo: 'Salí del ruido mental', texto: 'Te enseña a dejar de vivir atrapado en el pasado o en el futuro.' },
    { titulo: 'Presencia en lo cotidiano', texto: 'Prácticas simples para estar más presente en lo que hacés.' },
    { titulo: 'Un clásico de la espiritualidad', texto: 'Uno de los libros más leídos sobre conciencia y bienestar interior.' },
    { titulo: 'Formato de preguntas y respuestas', texto: 'Responde las dudas que te van surgiendo mientras lo leés.' },
  ],
  'el-alquimista': [
    { titulo: 'Una fábula para leer de un tirón', texto: 'Breve, luminosa y fácil de leer, aunque no seas de leer mucho.' },
    { titulo: 'Animate a tus sueños', texto: 'Santiago te recuerda que vale la pena salir a buscar lo que querés.' },
    { titulo: 'Leído en todo el mundo', texto: 'Traducido a decenas de idiomas, emociona a lectores de todas las edades.' },
    { titulo: 'El regalo perfecto', texto: 'Un libro que siempre cae bien y que muchos releen cada tanto.' },
  ],
  'el-alquimista-tapa-dura': [
    { titulo: 'Una edición para guardar', texto: 'Tapa dura, más resistente y linda para tener en la biblioteca o regalar.' },
    { titulo: 'Una fábula para leer de un tirón', texto: 'Breve, luminosa y fácil de leer, aunque no seas de leer mucho.' },
    { titulo: 'Animate a tus sueños', texto: 'Santiago te recuerda que vale la pena salir a buscar lo que querés.' },
    { titulo: 'Leído en todo el mundo', texto: 'Traducido a decenas de idiomas, emociona a lectores de todas las edades.' },
  ],
  'el-hombre-en-busca-de-sentido': [
    { titulo: 'Un testimonio real', texto: 'Frankl sobrevivió a los campos de concentración y lo cuenta en primera persona.' },
    { titulo: 'Sentido incluso en lo peor', texto: 'Muestra que siempre podemos elegir cómo enfrentar lo que nos pasa.' },
    { titulo: 'El origen de la logoterapia', texto: 'Presenta la forma de terapia que Frankl creó a partir de su experiencia.' },
    { titulo: 'Breve e inolvidable', texto: 'Pocas páginas que te cambian la forma de ver tus propios problemas.' },
  ],

  // Thriller y suspenso
  'la-paciente-silenciosa': [
    { titulo: 'Te atrapa desde la primera página', texto: 'Una mujer mata a su marido y no vuelve a hablar. ¿Por qué?' },
    { titulo: 'Un final que no ves venir', texto: 'Su giro es de esos que te obligan a releer las últimas páginas.' },
    { titulo: 'Thriller psicológico puro', texto: 'Tensión, obsesión y secretos que se revelan de a poco.' },
    { titulo: 'Capítulos cortos y adictivos', texto: 'El típico "uno más y apago la luz" que termina a las tres de la mañana.' },
  ],
};

/** Razones escritas en el panel (/admin/libros): reemplazan a las de arriba. Las carga data/books.ts. */
let razonesDelPanel: Record<string, [Razon, Razon, Razon, Razon]> = {};
export function setCustomRazones(map: Record<string, [Razon, Razon, Razon, Razon]>) {
  razonesDelPanel = map;
}

export const getRazones = (id: string): [Razon, Razon, Razon, Razon] | undefined => razonesDelPanel[id] ?? razones[id];
