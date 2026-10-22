const { Pool } = require('pg');
const serviciosIniciales = require('../config/servicios');

// Supabase exige SSL. Solo se desactiva si la base está en tu propio computador (pruebas locales).
const esLocal = /@(localhost|127\.0\.0\.1)(:|\/|$)/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false }
});

// Crea las tablas si no existen. Es idempotente: se puede ejecutar en cada arranque.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      correo TEXT NOT NULL,
      servicio_slug TEXT,
      descripcion TEXT NOT NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS keep_alive (
      id INTEGER PRIMARY KEY,
      last_ping TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS ajustes (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      titulo TEXT NOT NULL,
      resumen TEXT NOT NULL DEFAULT '',
      descripcion TEXT NOT NULL DEFAULT '',
      incluye TEXT NOT NULL DEFAULT '',
      icono TEXT,
      media_url TEXT,
      media_tipo TEXT,
      orden INTEGER NOT NULL DEFAULT 0,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS banner_slides (
      id SERIAL PRIMARY KEY,
      titulo TEXT,
      subtitulo TEXT,
      enlace TEXT,
      media_url TEXT NOT NULL,
      media_tipo TEXT NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS portafolio_items (
      id SERIAL PRIMARY KEY,
      servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
      titulo TEXT,
      descripcion TEXT,
      media_url TEXT NOT NULL,
      media_tipo TEXT NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await sembrarServicios();
}

// Carga los 8 servicios originales (config/servicios.js) una sola vez.
// La marca 'seed_servicios' evita que se vuelvan a crear si luego los borras desde el admin.
async function sembrarServicios() {
  const marca = await pool.query(
    `INSERT INTO ajustes (clave, valor) VALUES ('seed_servicios', '1')
     ON CONFLICT (clave) DO NOTHING RETURNING clave`
  );
  if (marca.rowCount === 0) return; // ya se sembró antes

  for (let i = 0; i < serviciosIniciales.length; i++) {
    const s = serviciosIniciales[i];
    await pool.query(
      `INSERT INTO servicios (slug, titulo, resumen, descripcion, incluye, icono, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING`,
      [s.slug, s.titulo, s.resumen, s.descripcion.join('\n\n'), s.incluye.join('\n'), s.icono, i + 1]
    );
  }
}

// Garantiza que initDb corra una vez por instancia (importante en Vercel/serverless).
// Si falla, se reintenta como máximo cada 30 segundos y el sitio sigue sirviendo lo que pueda.
let lista = null;
let ultimoFallo = 0;

function asegurarDb() {
  if (lista) return lista;
  if (Date.now() - ultimoFallo < 30000) return Promise.resolve();
  lista = initDb().catch(err => {
    console.error('Error inicializando la base de datos:', err);
    ultimoFallo = Date.now();
    lista = null;
  });
  return lista;
}

module.exports = { pool, initDb, asegurarDb };
