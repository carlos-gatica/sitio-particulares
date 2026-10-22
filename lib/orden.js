// Subir / bajar elementos en las listas del admin.
// Las tablas están en una lista blanca fija: nunca se arma SQL con texto que venga del usuario.

const { pool } = require('../db/pool');

const TABLAS = {
  servicios: { tabla: 'servicios', filtro: null },
  banner: { tabla: 'banner_slides', filtro: null },
  portafolio: { tabla: 'portafolio_items', filtro: 'servicio_id' }
};

async function siguienteOrden(clave, grupoId) {
  const t = TABLAS[clave];
  const donde = t.filtro ? `WHERE ${t.filtro} = $1` : '';
  const params = t.filtro ? [grupoId] : [];
  const { rows } = await pool.query(`SELECT COALESCE(MAX(orden), 0) + 1 AS n FROM ${t.tabla} ${donde}`, params);
  return rows[0].n;
}

// direccion: 'subir' | 'bajar'. grupoId solo aplica al portafolio (id del servicio).
async function mover(clave, id, direccion, grupoId) {
  const t = TABLAS[clave];
  const donde = t.filtro ? `WHERE ${t.filtro} = $1` : '';
  const params = t.filtro ? [grupoId] : [];
  const { rows } = await pool.query(`SELECT id FROM ${t.tabla} ${donde} ORDER BY orden, id`, params);

  const ids = rows.map(r => r.id);
  const i = ids.indexOf(Number(id));
  const j = direccion === 'subir' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;

  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) {
    await pool.query(`UPDATE ${t.tabla} SET orden = $1 WHERE id = $2`, [k + 1, ids[k]]);
  }
}

module.exports = { siguienteOrden, mover };
