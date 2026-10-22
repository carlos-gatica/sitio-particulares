// Sesión del panel admin con cookie firmada (HMAC). No usa memoria del servidor,
// así funciona en Vercel (serverless), donde cada petición puede caer en otra instancia.

const crypto = require('crypto');

const COOKIE = 'admin_sesion';
const DURACION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function secreto() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // Sin SESSION_SECRET se deriva de las credenciales del admin (cambiar la clave cierra las sesiones).
  return crypto
    .createHash('sha256')
    .update(`sesion|${process.env.ADMIN_USER || ''}|${process.env.ADMIN_PASSWORD || ''}`)
    .digest('hex');
}

function firmar(texto) {
  return crypto.createHmac('sha256', secreto()).update(texto).digest('base64url');
}

function crearToken(usuario) {
  const payload = Buffer.from(JSON.stringify({ u: usuario, e: Date.now() + DURACION_MS })).toString('base64url');
  return `${payload}.${firmar(payload)}`;
}

function leerToken(token) {
  if (!token || typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [payload, firma] = partes;

  const a = Buffer.from(firma);
  const b = Buffer.from(firmar(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!datos.e || datos.e < Date.now()) return null;
    return datos;
  } catch (err) {
    return null;
  }
}

function leerCookies(cabecera) {
  const salida = {};
  (cabecera || '').split(';').forEach(par => {
    const i = par.indexOf('=');
    if (i < 0) return;
    const nombre = par.slice(0, i).trim();
    const valor = par.slice(i + 1).trim();
    if (nombre) salida[nombre] = decodeURIComponent(valor);
  });
  return salida;
}

function sesionDe(req) {
  return leerToken(leerCookies(req.headers.cookie)[COOKIE]);
}

function esHttps(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function iniciarSesion(req, res, usuario) {
  const partes = [
    `${COOKIE}=${encodeURIComponent(crearToken(usuario))}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(DURACION_MS / 1000)}`
  ];
  if (esHttps(req)) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

function cerrarSesion(req, res) {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (esHttps(req)) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

// Comparación de texto en tiempo constante (evita filtrar información por tiempos de respuesta).
function iguales(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function credencialesValidas(usuario, clave) {
  const u = process.env.ADMIN_USER;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false; // si no están configuradas, nadie entra
  const okUsuario = iguales(usuario || '', u);
  const okClave = iguales(clave || '', p);
  return okUsuario && okClave;
}

module.exports = { sesionDe, iniciarSesion, cerrarSesion, credencialesValidas };
