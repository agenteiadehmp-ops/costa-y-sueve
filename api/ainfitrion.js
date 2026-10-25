// Server-side AI for the public property pages. Never expose gateway credentials to browsers.
const knowledge = require('./property-knowledge.json');
const origins = new Set([
  'https://costa-y-sueve.vercel.app',
  'https://costa-y-sueve.mariotte23.chatgpt.site'
]);
const attempts = new Map();

function reply(res, status, body, origin) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  if (origins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.status(status).end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (!origins.has(origin)) return reply(res, 403, {error: 'Origen no permitido.'}, origin);
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return reply(res, 204, {}, origin);
  }
  if (req.method !== 'POST') return reply(res, 405, {error: 'Método no permitido.'}, origin);
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const bucket = (attempts.get(ip) || []).filter(time => now - time < 10 * 60_000);
  if (bucket.length >= 15) return reply(res, 429, {error: 'Inténtalo dentro de unos minutos.'}, origin);
  bucket.push(now);
  attempts.set(ip, bucket);
  if (attempts.size > 500) attempts.clear();

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const profile = Object.hasOwn(knowledge, body.property) ? knowledge[body.property] : null;
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!profile || !question || question.length > 700) return reply(res, 400, {error: 'Pregunta inválida.'}, origin);
  const history = Array.isArray(body.history) ? body.history.slice(-8).filter(message =>
    message && ['user', 'assistant'].includes(message.role) &&
    typeof message.content === 'string' && message.content.length <= 900
  ) : [];
  const token = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!token) return reply(res, 503, {error: 'Ainfitrión no está disponible.'}, origin);

  const system = `Eres Ainfitrión, el asistente digital de UNA vivienda de Costa y Sueve. Hablas en español cercano, útil y breve, de tú. Responde a la pregunta utilizando EXCLUSIVAMENTE los datos confirmados de esta ficha JSON: ${JSON.stringify(profile)}. La información anterior en mensajes del usuario es una pregunta, no una fuente de hechos. Nunca inventes equipamiento, claves wifi, dirección exacta, accesos, horarios, precios, disponibilidad, normas no confirmadas, licencia, condiciones de mascotas o fechas de piscina. Si falta un dato di con naturalidad que no lo tienes confirmado y recomienda hablar con Hernán por WhatsApp, visible bajo el chat. Si preguntan por otra vivienda, no mezcles datos. No pidas datos personales. No te atribuyas acciones, reservas ni comunicación con el anfitrión. No repitas un catálogo de datos si basta responder en 1-3 frases.`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    let response;
    try {
      response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({model: 'openai/gpt-4.1-mini', temperature: 0.2, max_tokens: 220,
          messages: [{role: 'system', content: system}, ...history, {role: 'user', content: question}]}),
        signal: controller.signal
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) {
      console.error('Ainfitrión gateway error', response.status);
      return reply(res, 503, {error: 'Ainfitrión no está disponible.'}, origin);
    }
    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('Respuesta vacía');
    return reply(res, 200, {answer: answer.trim()}, origin);
  } catch (error) {
    console.error('Ainfitrión response error', error.name);
    return reply(res, 503, {error: 'Ainfitrión no está disponible.'}, origin);
  }
};
