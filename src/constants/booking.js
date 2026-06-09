/** Duración en minutos según catálogo Aureo Clinique Querétaro */
export const SERVICE_DURATIONS = {
  'Toxina Botulínica (Linurase)': 30,
  'Toxina Botulínica (Botox)': 30,
  'Rellenos Faciales (Fillers)': 60,
  Rinomodelación: 60,
  'Marcaje Mandibular': 60,
  'Armonización Facial & Arabian Face': 90,
  'Masculinización Facial': 120,
  'Bioestimuladores (Sculptra / Ellansé)': 60,
  'Bioregeneradores (Profhilo)': 40,
  'Hilos Tensores Faciales': 60,
  'Fibroblastos Autólogo': 60,
  'Fibroblastos Alogénico': 60,
  NCTF: 45,
  'PDRN de Salmón': 60,
  'AGF Dermal / Capilar': 60,
  'Enzimas 2da Generación': 30,
  'Hollywood Peel (Pico Láser)': 45,
  'Melasma (Pico Segundo)': 45,
  'Eliminación de Microblading': 30,
  'Eliminación de Manchas en Manos': 30,
  'Peeling Químico': 45,
  'Peeling Químico Axilas': 45,
  'Cauterio (Verrugas, Lunares, Puntos Rubí)': 45,
  Bichectomía: 60,
  'Blefaroplastia Superior': 120,
  'Lip Lift': 90,
  'Temporal Lifting (Fox Eyes)': 90,
  'Lifting Facial': 240,
  'Lifting de Cuello (Endolifting / K-Laser)': 120,
  'Pellet de Testosterona': 30,
  'Facial Médico': 60,
  'Células Madre': 90,
  'Células Madre en Diabéticos': 90,
  'Células Madre (Prevención y Longevidad)': 90,
  'Células Madre para Rodilla': 60,
  Ozonoterapia: 45,
  'Suero NAD': 120,
  Glutatión: 45,
  'Ácido Hialurónico en Rodilla': 45,
  'Suero Energy': 60,
  'Suero Detox': 60,
  'Suero Health': 60,
  'Suero C-Max (Vitamina C)': 60,
  Exosomas: 60,
  'Inmunoterapia (NK y Linfocitos)': 60,
  'Células Dendríticas': 60,
  'Eliminación de Tatuajes (Pico Láser)': 45,
  Criolipólisis: 60,
  'Criolipólisis (Paquetes)': 60,
  'Ice Pro Criolipólisis': 90,
  'Valoración médica': 30,
};

export const BOOKING_CONFIG = {
  timezone: 'America/Mexico_City',
  timezoneLabel: 'Hora Ciudad de México (CDMX)',
  slotIntervalMinutes: 15,
  bufferMinutes: 10,
  minAdvanceHours: 4,
  maxAdvanceDays: 90,
  /** Lunes=1 … Domingo=0 */
  schedule: {
    weekday: [
      [10, 14],
      [16, 19],
    ],
    saturday: [[10, 14]],
    sunday: 'by_request',
  },
  scheduleSummary:
    'Lun–Vie 10:00–14:00 y 16:00–19:00 · Sáb 10:00–14:00 · Dom con cita previa',
  /** Anticipo base cuando el servicio no tiene monto propio */
  depositAmountMxn: 250,
  servicesConfig: {},
};

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? '1 hr' : `${h} hrs`;
  return `${h} hr ${m} min`;
}
