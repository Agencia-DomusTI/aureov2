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
        summary: 'Relaja temporalmente los músculos de expresión para suavizar las líneas y conservar un aspecto natural.',
        desc: `La toxina botulínica relaja temporalmente los músculos faciales para que no se contraigan y la piel se vea lisa y tersa. Reduce considerablemente las líneas de expresión y conserva el aspecto natural del rostro. Contamos con dos marcas: Botox y Linurase. Incluye una revisión de seguimiento a los 7 días para evaluar que el resultado haya salido según lo esperado.
Zonas de aplicación:
- Frente, entrecejo y periocular
- Sonrisa gingival
- Bruxismo (rechinar y desgastar los dientes)
- Rictus de amargura (expresión de tristeza en la boca)
- Líneas platismales del cuello (efecto Nefertiti)
- Hiperhidrosis (sudoración excesiva en axilas, manos y pies)
Opción Full Face: tratamiento conjunto de frente, entrecejo y periocular; sonrisa gingival; bruxismo; rictus de amargura; y líneas platismales del cuello. No incluye hiperhidrosis.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Toxina Botulínica (Botox)',
        summary: 'Relaja temporalmente los músculos de expresión para suavizar las líneas y conservar un aspecto natural.',
        desc: `La toxina botulínica relaja temporalmente los músculos faciales para que no se contraigan y la piel se vea lisa y tersa. Reduce considerablemente las líneas de expresión y conserva el aspecto natural del rostro. Contamos con dos marcas: Botox y Linurase. Incluye una revisión de seguimiento a los 7 días para evaluar que el resultado haya salido según lo esperado.
Zonas de aplicación:
- Frente, entrecejo y periocular
- Sonrisa gingival
- Bruxismo (rechinar y desgastar los dientes)
- Rictus de amargura (expresión de tristeza en la boca)
- Líneas platismales del cuello (efecto Nefertiti)
- Hiperhidrosis (sudoración excesiva en axilas, manos y pies)
Opción Full Face: tratamiento conjunto de frente, entrecejo y periocular; sonrisa gingival; bruxismo; rictus de amargura; y líneas platismales del cuello. No incluye hiperhidrosis.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        summary: 'Perfila y arma la nariz con ácido hialurónico, sin bisturí y con resultados inmediatos.',
        desc: `La rinomodelación con ácido hialurónico logra una nariz más armónica, perfilada y estética en minutos, sin bisturí y con resultados inmediatos. Permite corregir imperfecciones, levantar la punta o mejorar el perfil sin tiempo de incapacidad. Es un procedimiento realizado exclusivamente por médicos especialistas.
- Valoración médica personalizada
- Técnicas avanzadas y productos de alta calidad
- Resultados naturales en una clínica premium

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Marcaje Mandibular',
        summary: 'Define la mandíbula y el mentón de forma natural con un bioestimulador de colágeno.',
        desc: `El marcaje mandibular se realiza con Radiesse, un bioestimulador que define la mandíbula y el mentón de forma natural, estimula colágeno, mejora la firmeza y logra un perfil elegante y estructurado. El resultado mejora con el tiempo. Cada aplicación se realiza bajo valoración y protocolo médico personalizado. Duración aproximada: 2 años.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Armonización Facial & Arabian Face',
        summary: 'Procedimientos personalizados para equilibrar las proporciones del rostro y realzar tus rasgos.',
        desc: `La armonización facial es un conjunto de procedimientos personalizados que buscan equilibrar las proporciones del rostro, realzar los rasgos naturales y lograr una apariencia fresca y simétrica sin necesidad de cirugía.
- Equilibra proporciones faciales y mejora la simetría
- Resalta los rasgos sin alterar la expresión
- Define pómulos, mandíbula y mentón
Ideal para quienes buscan un rejuvenecimiento global y natural, sin cirugía. Requiere valoración personalizada.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        summary: 'Estimulan la producción natural de colágeno para mejorar la calidad de la piel desde adentro.',
        desc: `Los bioestimuladores como Sculptra y Ellansé no son solo rellenos: son una inversión en la calidad de tu piel. Estimulan la producción natural de colágeno y mejoran la firmeza, la elasticidad y la textura desde adentro, con un rejuvenecimiento progresivo, elegante y natural. No cambian tu rostro, lo regeneran. Trabajamos con protocolos personalizados.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Bioregeneradores (Profhilo)',
        summary: 'Bioremodelación con ácido hialurónico para una piel hidratada, firme y luminosa.',
        desc: `Profhilo no es un relleno convencional. Es una tecnología de bioremodelación con ácido hialurónico que rejuvenece la piel desde adentro, con hidratación profunda, firmeza y luminosidad de aspecto natural. Su fórmula de alta pureza estimula colágeno y elastina, y mejora la calidad de la piel, la flacidez fina y el aspecto cansado del rostro, el cuello y otras zonas corporales. Generalmente se recomiendan 2 sesiones iniciales separadas por aproximadamente 4 semanas.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Hilos Tensores Faciales',
        summary: 'Tratamiento mínimamente invasivo que eleva y redefine el rostro sin cirugía.',
        desc: `Los hilos tensores son un tratamiento mínimamente invasivo para tensar y rejuvenecer el rostro. Elevan y redefinen sin cirugía, con efecto lifting inmediato, y estimulan colágeno para mejorar la firmeza con el tiempo. El resultado es natural y dura de 18 a 24 meses. Los hilos son reabsorbibles y el cuerpo los elimina de forma segura. El procedimiento dura aproximadamente 1 hora y la cantidad de hilos depende de cada paciente.
Zonas de aplicación: óvalo facial, mejillas, cejas y papada.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        summary: 'Biorevitalizador que mejora la calidad de la piel.',
        desc: `Biorevitalizador que mejora la calidad de la piel.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'PDRN de Salmón',
        summary: 'Tratamiento regenerador con polinucleótidos de salmón.',
        desc: `Tratamiento regenerador con polinucleótidos de salmón.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'AGF Dermal / Capilar',
        summary: 'Tratamiento con factores de crecimiento autólogos, para piel y cabello.',
        desc: `Tratamiento con factores de crecimiento autólogos, para piel y cabello.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        summary: 'Combina carbón activado médico y láser de picosegundo para renovar e iluminar la piel.',
        desc: `El Hollywood Peel combina carbón activado médico y tecnología de láser de picosegundo para renovar, iluminar y perfeccionar la piel. Logra una limpieza profunda de poros, estimulación de colágeno y una textura visiblemente más refinada desde la primera sesión.
- Ilumina la piel
- Reduce poros dilatados
- Mejora manchas y tono irregular
- Estimula la producción de colágeno
- Ayuda a controlar grasa y acné
- Deja la piel más firme, suave y refinada
Realizado por médicos especialistas con títulos, certificaciones y cédulas profesionales.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Melasma (Pico Segundo)',
        summary: 'Tecnología de picosegundo de alta precisión para tratar el melasma.',
        desc: `Tratamiento con tecnología de picosegundo de alta precisión para tratar el melasma sin dañar la piel. Requiere valoración médica.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Eliminación de Microblading',
        summary: 'Eliminación de maquillaje permanente en cejas con pico láser.',
        desc: `También conocido como eliminación de tatuaje en ceja, maquillaje permanente en cejas o micropigmentación. Usa tecnología de pico láser para lograr resultados progresivos y naturales. No se realiza eliminación de delineado de ojos por seguridad médica.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Eliminación de Manchas en Manos',
        summary: 'Picosegundo de alta precisión para manchas de pigmentación.',
        desc: `Tratamiento con tecnología de picosegundo de alta precisión para manchas de pigmentación en manos y cara. Frecuencia: 1 sesión por mes. Requiere valoración previa.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        img: '/multimedia/g.jpg',
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
        summary: 'Terapia de medicina regenerativa con enfoque preventivo y de longevidad.',
        desc: `Terapia de medicina regenerativa que se administra por vía capilar o intravenosa. La concentración y el plan se definen en la valoración médica.
Enfoque preventivo y de longevidad:
- Puede ayudar a retrasar el envejecimiento celular
- Preservar la función de órganos y articulaciones
- Mejorar energía, claridad mental y rendimiento físico
Cuando la salud ya se ha visto comprometida: enfermedades inflamatorias y autoinmunes, desgaste articular y dolor crónico, recuperación de lesiones, fatiga persistente.
La diferencia Áureo Clinique: procedimientos realizados por médicos especialistas certificados, protocolos personalizados de medicina regenerativa, estándares médicos de alto nivel, discreción y enfoque integral. Requiere valoración personalizada.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        summary: 'Apoyo en cicatrización, pie diabético y lesiones.',
        desc: `Ayuda en cicatrización, pie diabético y lesiones. Disponible en versión intravenosa, embolsada y articular (rodilla, hombro o cadera).

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Suero NAD',
        price: '$4,000',
        desc: 'Duración: 2 horas. Reparación de ADN, antienvejecimiento, aumento de energía, producción de colágeno, protección cerebral, mejora del sueño. Apoyo en Alzheimer, Parkinson, diabetes, circulación y neurotransmisores.',
        img: img(),
      },
      {
        name: 'Suero Quelación',
        price: 'Según valoración',
        desc: 'Protocolo intravenoso para eliminación de metales pesados. Duración de la primera cita: 4 horas.',
        img: img(),
      },
      {
        name: 'Suero Neuro Hormonal',
        price: 'Según valoración',
        desc: 'Suero neuro hormonal para mujeres. Duración de la primera cita: 1 hora 30 min.',
        img: img(),
      },
      {
        name: 'Glutatión',
        price: '$2,200',
        desc: 'Antioxidante que protege células, refuerza el sistema inmune y desintoxica el hígado. Duración: 1 hora.',
        img: img(),
      },
      {
        name: 'Ácido Hialurónico en Rodilla',
        summary: 'Infiltración que ayuda a reducir el dolor y mejorar la movilidad.',
        desc: `Infiltración de ácido hialurónico que ayuda a reducir el dolor y mejorar la movilidad. Ideal para pacientes con gonartrosis y desgaste articular. Duración aproximada: 1 año por aplicación. Antes de agendar se requieren radiografías o resonancia magnética de la rodilla.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        desc: 'Desintoxicación, apoyo emocional y reparación hepática. Protocolo por droga: duración de la primera cita 3 horas.',
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
        name: 'Pellet de Testosterona',
        summary: 'Terapia de liberación prolongada para mantener niveles hormonales estables.',
        desc: `Implante subcutáneo de liberación prolongada para mantener niveles hormonales estables en pacientes con indicación médica. Duración del efecto: 6 meses. Beneficios posibles: más energía y vitalidad; mayor deseo sexual; mejor recuperación física y apoyo en el mantenimiento de la masa muscular; mayor claridad mental y concentración; mejor sensación de bienestar. Requiere valoración médica integral y estudios previos (perfil hormonal masculino y antígeno prostático). Incluye seguimiento médico.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
        name: 'Depilación Láser',
        summary: 'Depilación con tecnología de diodo médico, para todo el cuerpo, en mujeres y hombres.',
        desc: `Depilación láser con tecnología de diodo médico (cuatridiodo, 4 diodos), realizada por personal médico especializado. Sin tiempo de recuperación y con resultados visibles desde las primeras sesiones.
Zonas: abdomen, axilas, bigote, bikini, brazos, cara, dedos, espalda, media cara, media pierna, nuca, oídos, patilla, pecho (hombre), piernas completas y cuerpo completo.
Se recomiendan de 6 a 8 sesiones para depilación y de 8 a 12 para rejuvenecimiento, con citas cada 5 semanas aproximadamente. Hay opciones de paquete por zona y combos de 3 zonas, 5 zonas y cuerpo completo.
Preparación: rasurarse un día antes con rastrillo, no usar cremas el día de la cita y, en axilas, no usar desodorante.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Eliminación de Tatuajes (Pico Láser)',
        summary: 'El láser de picosegundo fragmenta la tinta para que tu cuerpo la elimine de forma natural.',
        desc: `El láser de picosegundo fragmenta la tinta en partículas microscópicas y el cuerpo las elimina de forma natural, sesión tras sesión. El número de sesiones depende de la potencia aplicada, que se define en la valoración médica según el tipo de piel y las características del tatuaje.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
        img: img(),
      },
      {
        name: 'Criolipólisis',
        summary: 'Elimina grasa localizada mediante enfriamiento controlado, sin cirugía ni agujas.',
        desc: `Tratamiento avanzado no invasivo que elimina grasa localizada mediante enfriamiento controlado, destruyendo las células grasas para que el cuerpo las elimine de forma natural. Sin cirugía, sin agujas y sin tiempo de recuperación. Zonas: abdomen, flancos, espalda alta y baja, brazos, muslos, entrepierna, bajo del glúteo, rodillas y rollito axilar. Utilizamos tecnología de alta gama y protocolos personalizados. No todos los pacientes son candidatos, por eso se requiere valoración previa. También disponible con tecnología ICE PRO.

Sujeto a valoración médica previa. Los resultados pueden variar en cada paciente.`,
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
      {
        name: 'Hidrofacial',
        price: 'Según valoración',
        desc: 'Limpieza profunda, extracción e hidratación con hidrodermabrasión. Duración de la primera cita: 45 min. Las sesiones siguientes las agenda la clínica.',
        img: img(),
      },
    ],
  },
};

export const SERVICE_PROMOTIONS = [];
