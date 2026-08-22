const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // requerido por Supabase
});

// Crea la tabla si no existe. Se llama una vez al arrancar el servidor.
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
  `);
}

module.exports = { pool, initDb };
