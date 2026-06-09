import { BOOKING_CONFIG } from './booking';
import { CLINICS } from './clinics';
import { getAllBookableServices } from '../utils/bookableServices';

function buildServicesList() {
  const services = getAllBookableServices();
  const byCategory = new Map();
  services.forEach((s) => {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category).push(`- ${s.name} (${s.durationLabel}) · ${s.price}`);
  });
  return [...byCategory.entries()]
    .map(([cat, items]) => `${cat}:\n${items.join('\n')}`)
    .join('\n\n');
}

export const CHAT_WELCOME =
  '¡Hola! Soy el asistente de Áureo Clinique. Puedo ayudarte con tratamientos, precios orientativos, horarios y cómo agendar tu cita. ¿En qué te apoyo?';

export const CHAT_QUICK_ACTIONS = [
  { id: 'book', label: 'Agendar cita', message: 'Quiero agendar una cita' },
  { id: 'services', label: 'Tratamientos', message: '¿Qué tratamientos ofrecen?' },
  { id: 'hours', label: 'Horarios', message: '¿Cuáles son sus horarios?' },
  { id: 'locations', label: 'Ubicaciones', message: '¿Dónde están ubicados?' },
];

export function buildChatSystemPrompt() {
  const { qro, gdl } = CLINICS;
  return `Eres el asistente virtual de Áureo Clinique, clínica de medicina estética y bienestar en Querétaro y Zapopan, México.
Responde SIEMPRE en español, con tono cálido, profesional y conciso (máximo 3 párrafos cortos).
No inventes precios ni tratamientos que no estén en la lista. Si no sabes algo, invita a agendar valoración o contactar por WhatsApp.

## Sucursales
- Querétaro: ${qro.address}. Tel: ${qro.phone}. Email: ${qro.email}
- Zapopan: ${gdl.address}. Tel: ${gdl.phone}

## Horarios (hora Ciudad de México)
${BOOKING_CONFIG.scheduleSummary}

## Reservas en línea
- Querétaro: calendario en el sitio web, sección Contacto. Anticipo de $250 MXN (o según tratamiento) al confirmar.
- Zapopan: agendar por WhatsApp al ${gdl.phone}, no hay calendario en línea en el sitio.
- Valoración médica: sin costo inicial; duración según tratamiento.

## Tratamientos y precios orientativos
${buildServicesList()}

## Instrucciones
- Si quieren agendar en Querétaro, indícales que usen el calendario del sitio (sección Contacto) o que puedes guiarlos.
- Si quieren Zapopan, recomienda WhatsApp.
- Para dudas médicas específicas, sugiere valoración presencial.
- No des diagnósticos ni recomendaciones médicas definitivas.
- Puedes mencionar que tras confirmar cita recibirán mensaje por WhatsApp.`;
}
