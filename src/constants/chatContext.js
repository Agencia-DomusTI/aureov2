import { BOOKING_CONFIG, SERVICE_DURATIONS, formatDuration } from './booking';
import { CLINICS } from './clinics';
import { SERVICE_PROMOTIONS, servicesData } from './services';

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function shortDesc(desc, max = 100) {
  const clean = desc.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/** Catálogo oficial — única fuente de verdad del asistente */
export function buildOfficialCatalog() {
  const items = [];
  Object.values(servicesData).forEach((category) => {
    category.items.forEach((item) => {
      const duration = SERVICE_DURATIONS[item.name];
      items.push({
        name: item.name,
        category: category.title,
        price: item.price,
        duration: duration ? formatDuration(duration) : null,
        desc: shortDesc(item.desc, 140),
        keywords: normalize(`${item.name} ${item.price} ${item.desc} ${category.title}`),
      });
    });
  });
  items.unshift({
    name: 'Valoración médica',
    category: 'Consulta',
    price: 'Sin costo inicial · según tratamiento',
    duration: formatDuration(SERVICE_DURATIONS['Valoración médica']),
    desc: 'Primera consulta para definir el tratamiento ideal. Requerida en varios protocolos.',
    keywords: normalize('valoracion consulta primera cita'),
  });
  return items;
}

const CATALOG = buildOfficialCatalog();

const CATEGORY_INDEX = [...new Set(CATALOG.map((s) => s.category))].map((cat) => {
  const names = CATALOG.filter((s) => s.category === cat).map((s) => s.name);
  return `${cat} (${names.length}): ${names.join(', ')}`;
}).join('\n');

function findRelevantServices(query, limit = 5) {
  const q = normalize(query);
  if (!q || q.length < 2) return [];

  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = CATALOG.map((item) => {
    let score = 0;
    const nameNorm = normalize(item.name);
    if (nameNorm.includes(q) || q.includes(nameNorm.split('(')[0].trim())) score += 30;
    for (const t of terms) {
      if (item.keywords.includes(t)) score += t.length;
    }
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

function formatServiceBlock(s) {
  const dur = s.duration ? ` · ${s.duration}` : '';
  return `• ${s.name} — ${s.price}${dur}\n  ${s.desc}`;
}

function buildPromotionsBlock() {
  if (!SERVICE_PROMOTIONS?.length) return 'Sin promociones activas registradas.';
  return SERVICE_PROMOTIONS.map((p) => `• ${p.product}: ${p.promo}`).join('\n');
}

export const CHAT_WELCOME =
  '¡Hola! Soy el asistente de Áureo Clinique. Con gusto te oriento sobre tratamientos, precios y citas. ¿Qué te gustaría saber?';

export const CHAT_QUICK_ACTIONS = [
  { id: 'book', label: 'Agendar cita', message: 'Quiero agendar una cita en Querétaro' },
  { id: 'services', label: 'Tratamientos', message: '¿Qué áreas de tratamiento manejan?' },
  { id: 'hours', label: 'Horarios', message: '¿Cuál es su horario?' },
  { id: 'locations', label: 'Ubicaciones', message: '¿Dónde están sus clínicas?' },
];

export function buildChatSystemPrompt(userMessage = '') {
  const { qro, gdl } = CLINICS;
  const relevant = findRelevantServices(userMessage);
  const relevantBlock = relevant.length
    ? relevant.map(formatServiceBlock).join('\n')
    : '(Usa solo el índice de categorías; no listes todo el catálogo salvo que lo pidan.)';

  return `IDENTIDAD
Eres el asistente virtual oficial de Áureo Clinique — medicina estética y regenerativa en Querétaro y Zapopan.
Personalidad: cálida, elegante y profesional, como la recepción de una clínica boutique. Tutea con respeto.
Marca: resultados naturales, atención médica personalizada, Dr. Demetrio Quintero (+11 años de experiencia).

REGLAS ESTRICTAS (obligatorias)
1. Respuestas CORTAS: máximo 3 oraciones o 60 palabras. Sin párrafos largos ni listas enormes.
2. SOLO usa información del CATÁLOGO y datos de esta guía. NUNCA inventes precios, tratamientos, promociones ni resultados.
3. Si no encuentras un dato en el catálogo, di: "No tengo ese dato en nuestro catálogo; te recomiendo una valoración médica" — no adivines.
4. No des diagnósticos ni garantices resultados. Para dudas médicas: valoración presencial.
5. No menciones otros doctores, clínicas ni competencia.
6. No uses markdown pesado; texto simple y directo.
7. Si preguntan por algo que no ofrecemos, dilo con amabilidad y sugiere alternativa del catálogo si aplica.
8. Promociones: SOLO las listadas en PROMOCIONES. No inventes descuentos.

CÓMO RESPONDER
- Pregunta general de tratamientos → menciona 3–4 categorías, no enumeres todo.
- Pregunta por un tratamiento específico → usa SERVICIOS RELACIONADOS + precio exacto del catálogo.
- Agendar Querétaro → calendario en sección Contacto del sitio; anticipo base $250 MXN (puede variar por tratamiento; visible al elegir servicio). WhatsApp Querétaro: ${qro.phoneWaDisplay}.
- Agendar Zapopan → WhatsApp ${gdl.phoneWaDisplay}.
- Valoración médica → sin costo inicial.

SUCURSALES
• Querétaro: ${qro.address} · Llamadas ${qro.phone} · WhatsApp ${qro.phoneWaDisplay}
• Zapopan: ${gdl.address} · ${gdl.phone}
• Email: ${qro.email}

HORARIOS (CDMX): ${BOOKING_CONFIG.scheduleSummary}

PROMOCIONES VIGENTES
${buildPromotionsBlock()}

ÍNDICE DE CATEGORÍAS Y TRATAMIENTOS (nombres oficiales)
${CATEGORY_INDEX}

SERVICIOS RELACIONADOS A ESTA PREGUNTA
${relevantBlock}`;
}
