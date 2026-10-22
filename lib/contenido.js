// Consultas de contenido: servicios, banner y portafolio.
// Las páginas públicas usan versiones "tolerantes": si la base de datos falla, el sitio sigue
// mostrando los servicios del catálogo original (config/servicios.js) en vez de caerse.

const { pool } = require('../db/pool');
const serviciosIniciales = require('../config/servicios');

// Convierte la fila de la BD al formato que esperan las vistas.
// En la BD el texto va en una sola columna: párrafos separados por línea en blanco, ítems uno por línea.
function armarServicio(fila) {
  return Object.assign({}, fila, {
    parrafos: String(fila.descripcion || '').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean),
    lista: String(fila.incluye || '').split('\n').map(t => t.trim()).filter(Boolean)
  });
}

function servicioEstatico(s) {
  return armarServicio({
    id: null,
    slug: s.slug,
    titulo: s.titulo,
    resumen: s.resumen,
    descripcion: s.descripcion.join('\n\n'),
    incluye: s.incluye.join('\n'),
    icono: s.icono,
    media_url: null,
    media_tipo: null,
    activo: true
  });
}

async function serviciosActivos() {
  try {
    const { rows } = await pool.query('SELECT * FROM servicios WHERE activo = TRUE ORDER BY orden, id');
    return rows.map(armarServicio);
  } catch (err) {
    console.error('No se pudieron leer los servicios (se usa el catálogo original):', err.message);
    return serviciosIniciales.map(servicioEstatico);
  }
}

async function servicioPorSlug(slug) {
  try {
    const { rows } = await pool.query('SELECT * FROM servicios WHERE slug = $1 AND activo = TRUE', [slug]);
    return rows[0] ? armarServicio(rows[0]) : null;
  } catch (err) {
    console.error('No se pudo leer el servicio (se usa el catálogo original):', err.message);
    const s = serviciosIniciales.find(x => x.slug === slug);
    return s ? servicioEstatico(s) : null;
  }
}

async function slidesActivos() {
  try {
    const { rows } = await pool.query('SELECT * FROM banner_slides WHERE activo = TRUE ORDER BY orden, id');
    return rows;
  } catch (err) {
    console.error('No se pudo leer el banner:', err.message);
    return [];
  }
}

async function portafolioDe(servicioId) {
  if (!servicioId) return [];
  try {
    const { rows } = await pool.query('SELECT * FROM portafolio_items WHERE servicio_id = $1 ORDER BY orden, id', [servicioId]);
    return rows;
  } catch (err) {
    console.error('No se pudo leer el portafolio:', err.message);
    return [];
  }
}

module.exports = { armarServicio, serviciosActivos, servicioPorSlug, slidesActivos, portafolioDe };
