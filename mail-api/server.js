// ===================================================================
// Spirit Tech Revolution – API d'envoi du formulaire de contact
// POST /api/contact  →  envoie un e-mail via SMTP vers CONTACT_TO
// GET  /api/health   →  "ok"
// ===================================================================
import http from 'node:http';
import nodemailer from 'nodemailer';

const env = (name, fallback) => {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return v;
};

const PORT = Number(env('PORT', '3000'));
const SMTP_HOST = env('SMTP_HOST');
const SMTP_PORT = Number(env('SMTP_PORT', '465'));
const SMTP_SECURE = env('SMTP_SECURE', SMTP_PORT === 465 ? 'true' : 'false') === 'true';
const SMTP_USER = env('SMTP_USER');
const SMTP_PASS = env('SMTP_PASS');
const MAIL_FROM = env('MAIL_FROM', `Spirit Tech Revolution <${SMTP_USER}>`);
const CONTACT_TO = env('CONTACT_TO', 'contact@spirittechrevolution.com');
const ALLOWED_ORIGINS = env(
  'ALLOWED_ORIGINS',
  'https://www.spirittechrevolution.com,https://spirittechrevolution.com,http://127.0.0.1:5173,http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

transporter
  .verify()
  .then(() => console.log(`[mail-api] SMTP OK (${SMTP_HOST}:${SMTP_PORT})`))
  .catch((err) => console.error(`[mail-api] SMTP KO : ${err.message}`));

// ── Anti-spam : 5 envois / 15 min / IP ────────────────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map();
const isRateLimited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_MAX;
};
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    if (list.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// ── Helpers ───────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const SERVICES = new Set([
  '',
  'Solutions Sur Mesure',
  "Conception d'Expériences",
  'Intégration & Infrastructure',
  'Innovation & Transformation',
  'Support technique',
]);

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ').trim();

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
};

const readBody = (req, limit = 20_000) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('too_large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

// ── Handler /api/contact ──────────────────────────────────────────────
async function handleContact(req, res, cors) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch (err) {
    return send(res, err.status || 400, { ok: false, error: 'Requête invalide.' }, cors);
  }

  // Honeypot : champ caché que seuls les robots remplissent
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return send(res, 200, { ok: true }, cors);
  }

  const name = oneLine(String(data.name ?? '')).slice(0, 120);
  const email = oneLine(String(data.email ?? '')).slice(0, 200);
  const service = oneLine(String(data.service ?? '')).slice(0, 120);
  const message = String(data.message ?? '').trim().slice(0, 5000);

  if (name.length < 2) return send(res, 422, { ok: false, error: 'Merci d\'indiquer votre nom.' }, cors);
  if (!EMAIL_RE.test(email)) return send(res, 422, { ok: false, error: 'Adresse e-mail invalide.' }, cors);
  if (!SERVICES.has(service)) return send(res, 422, { ok: false, error: 'Service inconnu.' }, cors);
  if (message.length < 10) return send(res, 422, { ok: false, error: 'Votre message est trop court.' }, cors);

  if (isRateLimited(clientIp(req))) {
    return send(res, 429, { ok: false, error: 'Trop de messages envoyés. Réessayez plus tard.' }, cors);
  }

  const subject = `[Site] Demande de contact — ${service || 'Général'} — ${name}`;
  const text = `Nom : ${name}\nEmail : ${email}\nService : ${service || 'Général'}\n\nMessage :\n${message}\n`;
  const html = `
    <h2 style="font-family:sans-serif">Nouvelle demande depuis le site</h2>
    <table style="font-family:sans-serif;font-size:14px">
      <tr><td><b>Nom</b></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><b>Email</b></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td><b>Service</b></td><td>${escapeHtml(service || 'Général')}</td></tr>
    </table>
    <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: CONTACT_TO,
      replyTo: { name, address: email },
      subject,
      text,
      html,
    });
    return send(res, 200, { ok: true }, cors);
  } catch (err) {
    console.error(`[mail-api] Échec d'envoi : ${err.message}`);
    return send(res, 502, { ok: false, error: "L'envoi a échoué. Écrivez-nous directement par e-mail." }, cors);
  }
}

// ── Serveur ───────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : {};
  const path = (req.url || '/').split('?')[0];

  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (path === '/api/contact') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...cors,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      return res.end();
    }
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Méthode non autorisée.' }, cors);
    if (origin && !cors['Access-Control-Allow-Origin']) {
      return send(res, 403, { ok: false, error: 'Origine non autorisée.' });
    }
    return handleContact(req, res, cors);
  }

  send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => console.log(`[mail-api] écoute sur :${PORT}`));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
