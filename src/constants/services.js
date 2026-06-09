const IMAGES = [
  '/multimedia/a.jpg',
  '/multimedia/b.jpg',
  '/multimedia/c.jpg',
  '/multimedia/d.jpg',
  '/multimedia/e.jpg',
  '/multimedia/f.jpg',
  '/multimedia/g.jpg',
  '/multimedia/h.jpg',
  '/multimedia/i.jpg',
  '/multimedia/j.jpg',
  '/multimedia/k.jpg',
  '/multimedia/l.jpg',
  '/multimedia/m.jpg',
];

let imageIndex = 0;
function img() {
  const src = IMAGES[imageIndex % IMAGES.length];
  imageIndex += 1;
  return src;
}

export const servicesData = {
  estetica: {
    title: 'Medicina Estética',
    items: [
      {
        name: 'Toxina Botulínica (Linurase)',
        price: 'Desde $3,500 por zona',
        desc: 'Relaja temporalmente los músculos faciales para suavizar líneas de expresión con aspecto natural. Incluye unidades necesarias y revisión a los 7 días con retoque sin costo. Aplicaciones: frente, entrecejo y periocular; sonrisa gingival; bruxismo; rictus de amargura; líneas platismales (efecto Nefertiti); hiperhidrosis (axilas, manos y pies).',
        img: img(),
      },
      {
        name: 'Toxina Botulínica (Botox)',
        price: '$5,500',
        desc: 'Aplicación de toxina botulínica tipo Botox para suavizar líneas de expresión, tratar bruxismo o hiperhidrosis. Duración aproximada: 30 min.',
        img: img(),
      },
      {
        name: 'Rellenos Faciales (Fillers)',
        price: 'Según valoración médica',
        desc: 'Ácido hialurónico para volumen en labios, pómulos, mentón, ojeras, surcos nasogenianos, líneas de marioneta y código de barras. Opciones: relleno de pómulo, ojeras (Juvederm) $8,190, surco nasogeniano, líneas de marioneta, código de barras, labios (Natural, Brazilian, Mini-Russian o Russian Lips) y Full Face. El número de jeringas depende de la valoración médica.',
        img: img(),
      },
      {
        name: 'Rinomodelación',
        price: '$6,825 (Stylage)',
        desc: 'Nariz más armónica, perfilada y estética en minutos, sin bisturí y con resultados inmediatos. Procedimiento seguro con ácido hialurónico, realizado por médicos especialistas. Ideal para corregir imperfecciones, levantar la punta o mejorar el perfil sin incapacidad.',
        img: img(),
      },
      {
        name: 'Marcaje Mandibular',
        price: '$5,500 (My Filler)',
        desc: 'Definición del contorno inferior del rostro mediante relleno de ácido hialurónico. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Armonización Facial & Arabian Face',
        price: 'Según valoración',
        desc: 'Conjunto de procedimientos para equilibrar proporciones del rostro, mejorar simetría, definir contornos y rejuvenecer con resultados naturales.',
        img: img(),
      },
      {
        name: 'Masculinización Facial',
        price: 'Según valoración',
        desc: 'Protocolo personalizado para definir y masculinizar rasgos faciales. Duración aproximada: 2 hrs. Requiere valoración médica previa.',
        img: img(),
      },
      {
        name: 'Bioestimuladores (Sculptra / Ellansé)',
        price: 'Sculptra $12,600 · Ellansé $13,125',
        desc: 'Tratamientos inyectables que activan la producción natural de colágeno para firmeza y rejuvenecimiento progresivo. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Bioregeneradores (Profhilo)',
        price: '$7,350',
        desc: 'Hidratación profunda y firmeza mediante bioregeneradores de última generación. Duración aproximada: 40 min.',
        img: img(),
      },
      {
        name: 'Hilos Tensores Faciales',
        price: '$1,400 por hilo',
        desc: 'Colocación de hilos biocompatibles para elevar, tensar la piel y estimular colágeno. Lifting mecánico inmediato. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Fibroblastos Autólogo',
        price: '$26,250',
        desc: 'Estimulación celular para producir colágeno y elastina de forma natural. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Fibroblastos Alogénico',
        price: '$8,400',
        desc: 'Tratamiento regenerativo con fibroblastos alogénicos para mejorar la calidad y firmeza de la piel. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'NCTF',
        price: '$2,625 sesión · Paquete 3 sesiones $7,000',
        desc: 'Cóctel biorevitalizante con vitaminas y minerales para contorno de ojos y rejuvenecimiento. Duración aproximada: 45 min.',
        img: img(),
      },
      {
        name: 'PDRN de Salmón',
        price: '$4,200 sesión · Paquete 2 sesiones $7,500',
        desc: 'Tratamiento regenerador basado en ADN de salmón para mejorar textura, luminosidad y calidad de la piel. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'AGF Dermal / Capilar',
        price: '$3,150 sesión · Paquete 3 sesiones $8,000',
        desc: 'Factores de crecimiento biomiméticos para regeneración facial o estimulación biotecnológica del cabello. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Enzimas 2da Generación',
        price: '$5,775',
        desc: 'Tratamiento inyectable lipolítico para reducción de adiposidad localizada en zona facial. Duración aproximada: 30 min.',
        img: img(),
      },
      {
        name: 'Hollywood Peel (Pico Láser)',
        price: '$4,000 sesión · Paquete 3 sesiones $10,000',
        desc: 'Glow inmediato, limpieza profunda, reducción de poros, mejora de acné y estimulación de colágeno con tecnología pico láser.',
        img: img(),
      },
      {
        name: 'Melasma (Pico Segundo)',
        price: '$4,500 sesión · Paquete 4 sesiones $14,000',
        desc: 'Tratamiento médico del melasma con tecnología Pico Segundo de alta precisión. Fragmenta la melanina sin exceso de calor. Incluye valoración personalizada, protocolos combinados y cuidado de la barrera cutánea.',
        img: img(),
      },
      {
        name: 'Eliminación de Microblading',
        price: '$1,800 sesión · Paquete 3 sesiones $4,500',
        desc: 'Eliminación de pigmento de cejas con pico láser de alta precisión. Resultados progresivos, menor daño a la piel. Realizado por médicos certificados.',
        img: img(),
      },
      {
        name: 'Eliminación de Manchas en Manos',
        price: '$3,000 sesión · Paquete 5 sesiones $10,000',
        desc: 'Tratamiento con láser picosegundo. Frecuencia: 1 sesión por mes. Requiere valoración previa.',
        img: img(),
      },
      {
        name: 'Peeling Químico',
        price: 'Superficial $1,260 · Medio $5,250',
        desc: 'Renovación cutánea mediante sustancias químicas controladas. Peeling superficial o medio según valoración. Duración aproximada: 45 min.',
        img: img(),
      },
      {
        name: 'Peeling Químico Axilas',
        price: '$1,500 por sesión',
        desc: 'Tratamiento para despigmentar axilas. Por sesión, según protocolo médico.',
        img: img(),
      },
      {
        name: 'Cauterio (Verrugas, Lunares, Puntos Rubí)',
        price: 'Según valoración',
        desc: 'Tratamiento médico de verrugas, lunares y puntos rubí. Duración aproximada: 45 min.',
        img: img(),
      },
      {
        name: 'Bichectomía',
        price: '$7,000',
        desc: 'Eliminación de las bolsas de Bichat para afinar el rostro. Duración aproximada: 1 hr.',
        img: img(),
      },
      {
        name: 'Blefaroplastia Superior',
        price: '$17,000',
        desc: 'Cirugía ambulatoria para rejuvenecer los párpados superiores. Duración aproximada: 2 hrs.',
        img: img(),
      },
      {
        name: 'Lip Lift',
        price: '$15,750',
        desc: 'Elevación sutil del labio superior para armonizar el rostro. Duración aproximada: 1.5 hrs.',
        img: img(),
      },
      {
        name: 'Temporal Lifting (Fox Eyes)',
        price: '$15,750',
        desc: 'Elevación de la mirada y cejas para un look más rejuvenecido. Duración aproximada: 1.5 hrs.',
        img: img(),
      },
      {
        name: 'Lifting Facial',
        price: '$36,750',
        desc: 'Procedimiento de rejuvenecimiento facial integral. Duración aproximada: 4 hrs.',
        img: img(),
      },
      {
        name: 'Lifting de Cuello (Endolifting / K-Laser)',
        price: '$26,250',
        desc: 'Tratamiento de papada y flacidez de cuello con tecnología endolifting. Duración aproximada: 2 hrs.',
        img: img(),
      },
      {
        name: 'Pellet de Testosterona',
        price: '$8,000',
        desc: 'Implante subcutáneo que libera testosterona de forma continua por 4 a 6 meses.',
        img: img(),
      },
      {
        name: 'Facial Médico',
        price: 'Según valoración',
        desc: 'Limpieza profunda y aplicación de activos de grado clínico sin uso de máquinas de succión.',
        img: img(),
      },
    ],
  },
  regenerativa: {
    title: 'Medicina Regenerativa',
    items: [
      {
        name: 'Células Madre',
        price: '25M $30,000 · 50M $48,000 · 100M $85,000',
        desc: 'Regeneración celular, efecto antinflamatorio, mejora inmunológica y circulatoria, apoyo en neuropatías, cicatrización, metabolismo, recuperación funcional y antienvejecimiento. Requiere valoración personalizada.',
        img: img(),
      },
      {
        name: 'Células Madre en Diabéticos',
        price: '25M $30,000 · 50M $48,000 · 100M $85,000',
        desc: 'Protocolo especializado para pacientes diabéticos. Requiere química de 45 elementos y hemoglobina glucosilada previas a la valoración.',
        img: img(),
      },
      {
        name: 'Células Madre (Prevención y Longevidad)',
        price: '25M $30,000 · 50M $48,000 · 100M $85,000',
        desc: 'Retrasa el envejecimiento, mejora energía y rendimiento, previene enfermedades. Indicado también en autoinmunes, dolor crónico, lesiones y fatiga.',
        img: img(),
      },
      {
        name: 'Células Madre para Rodilla',
        price: '25M $30,000 · 50M $48,000 · 100M $85,000',
        desc: 'Grado I: 50 millones cada 3 meses (3 aplicaciones). Grado II: 75 millones cada 3 meses (3 aplicaciones). Requiere valoración ortopédica previa.',
        img: img(),
      },
      {
        name: 'Ozonoterapia',
        price: '$700 por pie · Paquete 10 sesiones $6,000',
        desc: 'Ozonoterapia embolsada para cicatrización de heridas y pie diabético. También disponible por vía intravenosa (autohemoterapia), rectal o vaginal. Ayuda en cicatrización y lesiones.',
        img: img(),
      },
      {
        name: 'Suero NAD',
        price: '$4,000',
        desc: 'Duración: 2 horas. Reparación de ADN, antienvejecimiento, aumento de energía, producción de colágeno, protección cerebral, mejora del sueño. Apoyo en Alzheimer, Parkinson, diabetes, circulación y neurotransmisores.',
        img: img(),
      },
      {
        name: 'Glutatión',
        price: '$2,200',
        desc: 'Antioxidante que protege células, refuerza el sistema inmune y desintoxica el hígado.',
        img: img(),
      },
      {
        name: 'Ácido Hialurónico en Rodilla',
        price: '$13,000',
        desc: 'Lubricación intraarticular para reducir dolor, mejorar movilidad y posiblemente evitar cirugía.',
        img: img(),
      },
      {
        name: 'Suero Energy',
        price: '$2,000',
        desc: 'Elimina fatiga, hidrata y funciona como tratamiento antiresaca.',
        img: img(),
      },
      {
        name: 'Suero Detox',
        price: '$1,365',
        desc: 'Desintoxicación, apoyo emocional y reparación hepática.',
        img: img(),
      },
      {
        name: 'Suero Health',
        price: '$1,785',
        desc: 'Mejora la circulación y ayuda a eliminar metales pesados.',
        img: img(),
      },
      {
        name: 'Suero C-Max (Vitamina C)',
        price: '12 g $1,470 · 15 g $1,785 · 20 g $2,310 · 25 g $2,835',
        desc: 'Refuerzo inmunológico, cicatrización, acción antioxidante y apoyo en enfermedades. Beneficios: hidratación, iluminación, firmeza y reparación de piel.',
        img: img(),
      },
      {
        name: 'Exosomas',
        price: 'Según valoración',
        desc: 'Mensajeros biológicos para regeneración de piel y folículo piloso.',
        img: img(),
      },
      {
        name: 'Inmunoterapia (NK y Linfocitos)',
        price: 'Según valoración',
        desc: 'Terapia inmunológica con células Natural Killer y linfocitos para defensa celular, regeneración y regulación de procesos inflamatorios.',
        img: img(),
      },
      {
        name: 'Células Dendríticas',
        price: 'Según valoración',
        desc: 'Tratamiento para fortalecer la respuesta defensiva del organismo.',
        img: img(),
      },
    ],
  },
  wellness: {
    title: 'Corporal y Láser',
    items: [
      {
        name: 'Eliminación de Tatuajes (Pico Láser)',
        price: 'Pequeño $5,000 · Mediano $7,500 · Grande $10,000 · Extra grande $15,000 (paquete 5 sesiones)',
        desc: 'Eliminación de tatuajes con pico láser. Todos los paquetes incluyen garantía de eliminación. Tamaños: pequeño (1–5 cm), mediano (6–9 cm), grande (10–20 cm), extra grande (20+ cm).',
        img: img(),
      },
      {
        name: 'Criolipólisis',
        price: 'Desde $1,200 por sesión',
        desc: 'Tratamiento no invasivo que elimina grasa localizada mediante enfriamiento controlado. Sin agujas ni recuperación. Zonas: brazos, abdomen, espalda baja, bajo del glúteo y papada. Requiere valoración previa.',
        img: img(),
      },
      {
        name: 'Criolipólisis (Paquetes)',
        price: '2 manerales: $1,200/sesión · 3x $3,000 | 3 manerales: $1,600/sesión · 3x $4,500 | 4 manerales: $2,400/sesión · 3x $6,000',
        desc: 'Paquetes de criolipólisis según número de manerales. Tecnología premium, protocolos personalizados y resultados naturales.',
        img: img(),
      },
      {
        name: 'Ice Pro Criolipólisis',
        price: 'Zona pequeña $5,900 · Mediana $8,100 · Grande $11,400 (paquete 3 sesiones)',
        desc: 'Elimina grasa resistente, reduce celulitis y esculpe el cuerpo. Temperatura -10 °C a 10 °C, 4 manerales, vacío ajustable, control térmico constante, pantalla táctil y tecnología de calor. Incluye báscula. Sin agujas ni recuperación.',
        img: img(),
      },
    ],
  },
};

export const SERVICE_PROMOTIONS = [
  { product: 'Hilos', promo: '10% de descuento' },
  { product: 'Eliminación de tatuajes', promo: '50% de descuento' },
  { product: 'Hollywood Peel', promo: '$2,000' },
  { product: 'Rinomodelación', promo: '$5,500' },
  { product: 'NAD (3 sesiones)', promo: '$10,000' },
  { product: 'Endolifting facial / papada', promo: '$27,000' },
  { product: 'Bichectomía', promo: '$7,000' },
  { product: 'Blefaroplastia superior', promo: '$17,000' },
];
