// Admin: servicios (agregar / editar / quitar / ordenar) y su portafolio de proyectos.
const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const media = require('../lib/media');
const storage = require('../lib/storage');
const { siguienteOrden, mover } = require('../lib/orden');

const texto = (valor, max) => String(valor || '').replace(/\r\n/g, '\n').trim().slice(0, max);

// Cualquier :id o :itemId debe ser un número; si no, la ruta no aplica.
['id', 'itemId'].forEach(nombre => {
  router.param(nombre, (req, res, next, valor) => (/^\d+$/.test(valor) ? next() : next('route')));
});

function leerFormulario(body) {
  return {
    titulo: texto(body.titulo, 80),
    slug: texto(body.slug, 60),
    resumen: texto(body.resumen, 200),
    descripcion: texto(body.descripcion, 3000),
    incluye: texto(body.incluye, 1500),
    activo: body.activo === 'on'
  };
}

async function slugUnico(base, excluirId) {
  const raiz = media.slugify(base) || 'servicio';
  let candidato = raiz;
  for (let n = 2; n < 100; n++) {
    const { rows } = await pool.query(
      'SELECT 1 FROM servicios WHERE slug = $1 AND ($2::int IS NULL OR id <> $2) LIMIT 1',
      [candidato, excluirId || null]
    );
    if (!rows.length) return candidato;
    candidato = `${raiz}-${n}`;
  }
  return `${raiz}-${Date.now()}`;
}

// --- Lista ---------------------------------------------------------------

router.get('/servicios', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM portafolio_items p WHERE p.servicio_id = s.id)::int AS proyectos
       FROM servicios s ORDER BY s.orden, s.id`
    );
    res.render('admin/servicios', { servicios: rows, seccion: 'servicios', tituloAdmin: 'Servicios', query: req.query });
  } catch (err) {
    next(err);
  }
});

// --- Crear ---------------------------------------------------------------

router.get('/servicios/nuevo', (req, res) => {
  res.render('admin/servicio-form', {
    nuevo: true,
    servicio: { titulo: '', slug: '', resumen: '', descripcion: '', incluye: '', activo: true, media_url: null, media_tipo: null },
    portafolio: [],
    seccion: 'servicios',
    tituloAdmin: 'Nuevo servicio',
    query: req.query
  });
});

router.post('/servicios', async (req, res, next) => {
  try {
    const datos = leerFormulario(req.body);
    const medios = media.validarMedios(req.body.media || '[]', 1) || [];

    if (!datos.titulo) {
      return res.status(400).render('admin/servicio-form', {
        nuevo: true,
        servicio: Object.assign({}, datos, { media_url: medios[0] && medios[0].url, media_tipo: medios[0] && medios[0].tipo }),
        portafolio: [],
        seccion: 'servicios',
        tituloAdmin: 'Nuevo servicio',
        query: {},
        errorAdmin: 'El servicio necesita un título.'
      });
    }

    const slug = await slugUnico(datos.slug || datos.titulo);
    const orden = await siguienteOrden('servicios');

    const { rows } = await pool.query(
      `INSERT INTO servicios (slug, titulo, resumen, descripcion, incluye, media_url, media_tipo, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [slug, datos.titulo, datos.resumen, datos.descripcion, datos.incluye,
        medios[0] ? medios[0].url : null, medios[0] ? medios[0].tipo : null, orden, datos.activo]
    );

    res.redirect(`/admin/servicios/${rows[0].id}?ok=creado`);
  } catch (err) {
    next(err);
  }
});

// --- Editar --------------------------------------------------------------

async function mostrarEdicion(res, id, extra) {
  const { rows } = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).render('404', { titulo: 'No encontrado' });

  const portafolio = await pool.query('SELECT * FROM portafolio_items WHERE servicio_id = $1 ORDER BY orden, id', [id]);

  // "valores" son los datos recién escritos en el formulario (para no perderlos si hubo un error).
  const { valores, ...resto } = extra || {};

  return res.render('admin/servicio-form', Object.assign({
    nuevo: false,
    servicio: Object.assign({}, rows[0], valores || {}),
    portafolio: portafolio.rows,
    seccion: 'servicios',
    tituloAdmin: 'Editar servicio',
    query: {}
  }, resto));
}

router.get('/servicios/:id', async (req, res, next) => {
  try {
    await mostrarEdicion(res, req.params.id, { query: req.query });
  } catch (err) {
    next(err);
  }
});

router.post('/servicios/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actual = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
    if (!actual.rows.length) return res.status(404).render('404', { titulo: 'No encontrado' });
    const previo = actual.rows[0];

    const datos = leerFormulario(req.body);
    if (!datos.titulo) {
      return mostrarEdicion(res, id, { errorAdmin: 'El servicio necesita un título.', valores: datos });
    }

    // Imagen/video principal: si el campo no vino, se deja como estaba.
    let mediaUrl = previo.media_url;
    let mediaTipo = previo.media_tipo;
    if (typeof req.body.media === 'string') {
      const medios = media.validarMedios(req.body.media, 1);
      if (medios === null) {
        return mostrarEdicion(res, id, { errorAdmin: 'No se pudo leer el archivo subido. Intenta subirlo de nuevo.', valores: datos });
      }
      mediaUrl = medios[0] ? medios[0].url : null;
      mediaTipo = medios[0] ? medios[0].tipo : null;
    }

    const slug = await slugUnico(datos.slug || datos.titulo, id);

    await pool.query(
      `UPDATE servicios
         SET slug = $1, titulo = $2, resumen = $3, descripcion = $4, incluye = $5,
             media_url = $6, media_tipo = $7, activo = $8
       WHERE id = $9`,
      [slug, datos.titulo, datos.resumen, datos.descripcion, datos.incluye, mediaUrl, mediaTipo, datos.activo, id]
    );

    // Si se reemplazó o quitó el archivo anterior, se borra del almacenamiento.
    if (previo.media_url && previo.media_url !== mediaUrl) {
      await storage.borrarPorUrl(previo.media_url);
    }

    res.redirect(`/admin/servicios/${id}?ok=guardado`);
  } catch (err) {
    next(err);
  }
});

// --- Acciones de la lista --------------------------------------------------

router.post('/servicios/:id/activo', async (req, res, next) => {
  try {
    await pool.query('UPDATE servicios SET activo = NOT activo WHERE id = $1', [req.params.id]);
    res.redirect('/admin/servicios?ok=guardado');
  } catch (err) {
    next(err);
  }
});

router.post('/servicios/:id/mover', async (req, res, next) => {
  try {
    if (req.body.direccion === 'subir' || req.body.direccion === 'bajar') {
      await mover('servicios', req.params.id, req.body.direccion);
    }
    res.redirect('/admin/servicios');
  } catch (err) {
    next(err);
  }
});

router.post('/servicios/:id/eliminar', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const archivos = await pool.query(
      `SELECT media_url FROM servicios WHERE id = $1
       UNION ALL SELECT media_url FROM portafolio_items WHERE servicio_id = $1`,
      [id]
    );

    await pool.query('DELETE FROM servicios WHERE id = $1', [id]); // borra también su portafolio (CASCADE)
    await storage.borrarPorUrl(...archivos.rows.map(r => r.media_url));

    res.redirect('/admin/servicios?ok=eliminado');
  } catch (err) {
    next(err);
  }
});

// --- Portafolio ------------------------------------------------------------

router.post('/servicios/:id/portafolio', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existe = await pool.query('SELECT 1 FROM servicios WHERE id = $1', [id]);
    if (!existe.rows.length) return res.status(404).render('404', { titulo: 'No encontrado' });

    const medios = media.validarMedios(req.body.media || '[]', 20) || [];
    if (!medios.length) {
      return mostrarEdicion(res, id, { errorAdmin: 'Sube al menos una foto o video, o pega un link de YouTube.' });
    }

    const titulo = texto(req.body.titulo, 100) || null;
    const descripcion = texto(req.body.descripcion, 300) || null;
    let orden = await siguienteOrden('portafolio', id);

    for (const m of medios) {
      await pool.query(
        `INSERT INTO portafolio_items (servicio_id, titulo, descripcion, media_url, media_tipo, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, titulo, descripcion, m.url, m.tipo, orden++]
      );
    }

    res.redirect(`/admin/servicios/${id}?ok=agregado#portafolio`);
  } catch (err) {
    next(err);
  }
});

// Obtiene el servicio al que pertenece un ítem (para volver a la página correcta).
async function servicioDeItem(itemId) {
  const { rows } = await pool.query('SELECT servicio_id FROM portafolio_items WHERE id = $1', [itemId]);
  return rows[0] ? rows[0].servicio_id : null;
}

router.post('/portafolio/:itemId', async (req, res, next) => {
  try {
    const servicioId = await servicioDeItem(req.params.itemId);
    if (!servicioId) return res.status(404).render('404', { titulo: 'No encontrado' });

    await pool.query(
      'UPDATE portafolio_items SET titulo = $1, descripcion = $2 WHERE id = $3',
      [texto(req.body.titulo, 100) || null, texto(req.body.descripcion, 300) || null, req.params.itemId]
    );
    res.redirect(`/admin/servicios/${servicioId}?ok=guardado#portafolio`);
  } catch (err) {
    next(err);
  }
});

router.post('/portafolio/:itemId/mover', async (req, res, next) => {
  try {
    const servicioId = await servicioDeItem(req.params.itemId);
    if (!servicioId) return res.status(404).render('404', { titulo: 'No encontrado' });

    if (req.body.direccion === 'subir' || req.body.direccion === 'bajar') {
      await mover('portafolio', req.params.itemId, req.body.direccion, servicioId);
    }
    res.redirect(`/admin/servicios/${servicioId}#portafolio`);
  } catch (err) {
    next(err);
  }
});

router.post('/portafolio/:itemId/eliminar', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM portafolio_items WHERE id = $1 RETURNING servicio_id, media_url',
      [req.params.itemId]
    );
    if (!rows.length) return res.status(404).render('404', { titulo: 'No encontrado' });

    await storage.borrarPorUrl(rows[0].media_url);
    res.redirect(`/admin/servicios/${rows[0].servicio_id}?ok=eliminado#portafolio`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
