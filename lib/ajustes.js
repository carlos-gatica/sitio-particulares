// Ajustes editables desde el admin (textos del inicio, WhatsApp, redes sociales).
// Se guardan en la tabla `ajustes` y se cachean 30 segundos para no consultar en cada página.

const { pool } = require('../db/pool');

const PREDETERMINADOS = {
  hero_titulo: 'Arreglamos lo que tu casa necesita, bien hecho y sin vueltas.',
  hero_subtitulo: 'Pintura, gasfitería, electricidad y remodelaciones para particulares. Pides una cotización, te contactamos, coordinamos visita.',
  whatsapp: '56989566273',
  whatsapp_mensaje: 'Hola, quiero cotizar un trabajo',
  instagram: '',
  facebook: ''
};

// Estos pueden quedar vacíos a propósito (vacío = no mostrar el ícono).
const PUEDEN_ESTAR_VACIOS = ['instagram', 'facebook'];

let cache = { datos: null, hasta: 0 };

async function obtener() {
  if (cache.datos && Date.now() < cache.hasta) return cache.datos;

  const datos = Object.assign({}, PREDETERMINADOS);
  try {
    const { rows } = await pool.query('SELECT clave, valor FROM ajustes WHERE clave = ANY($1)', [Object.keys(PREDETERMINADOS)]);
    rows.forEach(r => {
      if (r.valor !== '' || PUEDEN_ESTAR_VACIOS.includes(r.clave)) datos[r.clave] = r.valor;
    });
  } catch (err) {
    console.error('No se pudieron leer los ajustes (se usan los predeterminados):', err.message);
    return datos; // sin cachear, para reintentar pronto
  }

  cache = { datos, hasta: Date.now() + 30 * 1000 };
  return datos;
}

async function guardar(valores) {
  for (const clave of Object.keys(PREDETERMINADOS)) {
    if (!(clave in valores)) continue;
    await pool.query(
      `INSERT INTO ajustes (clave, valor) VALUES ($1, $2)
       ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
      [clave, valores[clave]]
    );
  }
  cache = { datos: null, hasta: 0 }; // los cambios se ven de inmediato
}

module.exports = { PREDETERMINADOS, obtener, guardar };
