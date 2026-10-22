// Utilidades para imágenes, videos y links de YouTube.
// También se expone a las vistas EJS como `media` (ver app.js).

const storage = require('./storage');

const IMAGENES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const VIDEOS = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

const MAX_IMAGEN = 10 * 1024 * 1024; // 10 MB (el navegador ya las comprime antes de subir)
const MAX_VIDEO = 50 * 1024 * 1024;  // 50 MB (tope del plan gratuito de Supabase)

function tipoDeMime(mime) {
  if (IMAGENES[mime]) return 'imagen';
  if (VIDEOS[mime]) return 'video';
  return null;
}

function extensionDeMime(mime) {
  return IMAGENES[mime] || VIDEOS[mime] || null;
}

// Extrae el ID de un link de YouTube (watch, youtu.be, shorts, embed, live). Devuelve null si no es válido.
function ytId(entrada) {
  if (typeof entrada !== 'string') return null;
  const texto = entrada.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto;

  let u;
  try {
    u = new URL(texto);
  } catch (err) {
    return null;
  }

  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;

  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }

  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

function ytEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function ytMiniatura(entrada) {
  const id = ytId(entrada);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

// Convierte un título en un texto apto para URL: "Pintura & Fachadas" -> "pintura-fachadas".
function slugify(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

// Valida lo que envía el formulario del admin (JSON con la lista de medios subidos).
// Solo acepta archivos de NUESTRO bucket o links de YouTube; descarta todo lo demás.
function validarMedios(json, maximo) {
  let lista;
  try {
    lista = JSON.parse(json);
  } catch (err) {
    return null; // formato inválido
  }
  if (!Array.isArray(lista)) return null;

  const salida = [];
  for (const item of lista.slice(0, maximo || 20)) {
    if (!item || typeof item !== 'object') continue;

    if (item.tipo === 'youtube') {
      const id = ytId(String(item.url || ''));
      if (id) salida.push({ url: ytEmbed(id), tipo: 'youtube' });
    } else if (item.tipo === 'imagen' || item.tipo === 'video') {
      const ruta = storage.rutaDesdeUrlPublica(String(item.url || ''));
      if (!ruta) continue;
      const ext = ruta.split('.').pop();
      const permitidas = item.tipo === 'imagen' ? Object.values(IMAGENES) : Object.values(VIDEOS);
      if (permitidas.includes(ext)) salida.push({ url: String(item.url), tipo: item.tipo });
    }
  }
  return salida;
}

module.exports = {
  MAX_IMAGEN,
  MAX_VIDEO,
  tipoDeMime,
  extensionDeMime,
  ytId,
  ytEmbed,
  ytMiniatura,
  slugify,
  validarMedios
};
