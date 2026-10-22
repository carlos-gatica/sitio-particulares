// Supabase Storage por su API REST (sin librerías extra).
// Flujo de subida: el navegador pide una URL firmada a nuestro servidor y sube el archivo
// DIRECTO a Supabase. Así los videos no pasan por Vercel (que limita las peticiones a ~4.5 MB).
// La llave de servicio (service role) vive solo en el servidor y nunca llega al navegador.

const BUCKET = process.env.SUPABASE_BUCKET || 'media';
const LIMITE_BUCKET = 50 * 1024 * 1024; // 50 MB: tope del plan gratuito de Supabase

function config() {
  return {
    url: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

function disponible() {
  const { url, key } = config();
  return Boolean(url && key);
}

function cabeceras(extra) {
  const { key } = config();
  const h = Object.assign({ apikey: key }, extra || {});
  // Las llaves antiguas son JWT (eyJ...) y van también como Bearer; las nuevas (sb_secret_...) solo en apikey.
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
  return h;
}

function prefijoPublico() {
  return `${config().url}/storage/v1/object/public/${BUCKET}/`;
}

function urlPublica(ruta) {
  return prefijoPublico() + ruta;
}

// Devuelve la ruta interna ("servicios/123-abc.jpg") si la URL pertenece a nuestro bucket; si no, null.
function rutaDesdeUrlPublica(url) {
  const prefijo = prefijoPublico();
  if (typeof url !== 'string' || !url.startsWith(prefijo)) return null;
  const ruta = url.slice(prefijo.length);
  return /^[a-z0-9_\-./]+$/.test(ruta) && !ruta.includes('..') ? ruta : null;
}

// Crea el bucket público la primera vez, si todavía no existe.
let bucketListo = false;
async function asegurarBucket() {
  if (bucketListo) return;
  const { url } = config();

  const existe = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers: cabeceras() });
  if (existe.ok) {
    bucketListo = true;
    return;
  }

  const crear = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: cabeceras({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: LIMITE_BUCKET,
      allowed_mime_types: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
      ]
    })
  });

  // 409 = ya existía (carrera entre dos peticiones): también sirve.
  if (crear.ok || crear.status === 409) {
    bucketListo = true;
    return;
  }
  const detalle = await crear.text().catch(() => '');
  throw new Error(`No se pudo crear el bucket "${BUCKET}" (${crear.status}) ${detalle}`);
}

// Pide a Supabase una URL firmada de subida para "ruta". El navegador hace PUT a esa URL.
async function crearUrlSubida(ruta) {
  const { url } = config();

  try {
    await asegurarBucket();
  } catch (err) {
    // Si no pudimos crearlo, igual intentamos firmar: quizá ya existe y solo falló la consulta.
    console.warn('Aviso al preparar el bucket:', err.message);
  }

  const resp = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${ruta}`, {
    method: 'POST',
    headers: cabeceras({ 'Content-Type': 'application/json' }),
    body: '{}'
  });

  if (!resp.ok) {
    const detalle = await resp.text().catch(() => '');
    throw new Error(`Supabase rechazó la URL de subida (${resp.status}) ${detalle}`);
  }

  const datos = await resp.json();
  if (!datos || !datos.url) throw new Error('Supabase no devolvió la URL de subida.');

  // La API devuelve una ruta relativa ("/object/upload/sign/...?token=...").
  return datos.url.startsWith('http') ? datos.url : `${url}/storage/v1${datos.url}`;
}

// Borra archivos del bucket. Es "de mejor esfuerzo": si falla, solo queda un archivo huérfano.
async function borrar(rutas) {
  const lista = (rutas || []).filter(Boolean);
  if (!lista.length || !disponible()) return;

  try {
    const resp = await fetch(`${config().url}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: cabeceras({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: lista })
    });
    if (!resp.ok) console.warn('No se pudieron borrar archivos del bucket:', resp.status);
  } catch (err) {
    console.warn('Error borrando archivos del bucket:', err.message);
  }
}

// Borra un archivo a partir de su URL pública (si es de nuestro bucket).
async function borrarPorUrl(...urls) {
  const rutas = urls.map(rutaDesdeUrlPublica).filter(Boolean);
  await borrar(rutas);
}

module.exports = {
  BUCKET,
  LIMITE_BUCKET,
  disponible,
  prefijoPublico,
  urlPublica,
  rutaDesdeUrlPublica,
  crearUrlSubida,
  borrar,
  borrarPorUrl
};
