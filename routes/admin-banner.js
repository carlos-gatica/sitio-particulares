// Admin: carrusel de la portada (fotos y videos de proyectos).
const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const media = require('../lib/media');
const storage = require('../lib/storage');
const { siguienteOrden, mover } = require('../lib/orden');

const texto = (valor, max) => String(valor || '').replace(/\r\n/g, '\n').trim().slice(0, max);

router.param('id', (req, res, next, valor) => (/^\d+$/.test(valor) ? next() : next('route')));

// El enlace opcional de una diapositiva: interno ("/servicio/pintura") o https://...
function enlaceSeguro(valor) {
  const v = texto(valor, 300);
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  return /^https:\/\/[^\s]+$/.test(v) ? v : false;
}

async function mostrar(res, extra) {
  const { rows } = await pool.query('SELECT * FROM banner_slides ORDER BY orden, id');
  res.render('admin/banner', Object.assign({
    slides: rows,
    seccion: 'banner',
    tituloAdmin: 'Banner de portada',
    query: {}
  }, extra || {}));
}

router.get('/banner', async (req, res, next) => {
  try {
    await mostrar(res, { query: req.query });
  } catch (err) {
    next(err);
  }
});

// Agregar una o varias diapositivas de una vez.
router.post('/banner', async (req, res, next) => {
  try {
    const medios = media.validarMedios(req.body.media || '[]', 20) || [];
    if (!medios.length) {
      return mostrar(res, { errorAdmin: 'Sube al menos una foto o video, o pega un link de YouTube.' });
    }

    const enlace = enlaceSeguro(req.body.enlace);
    if (enlace === false) {
      return mostrar(res, { errorAdmin: 'El enlace debe empezar con / (página del sitio) o con https://' });
    }

    const titulo = texto(req.body.titulo, 100) || null;
    const subtitulo = texto(req.body.subtitulo, 200) || null;
    let orden = await siguienteOrden('banner');

    for (const m of medios) {
      await pool.query(
        `INSERT INTO banner_slides (titulo, subtitulo, enlace, media_url, media_tipo, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [titulo, subtitulo, enlace, m.url, m.tipo, orden++]
      );
    }

    res.redirect('/admin/banner?ok=agregado');
  } catch (err) {
    next(err);
  }
});

// Editar los textos / enlace / visibilidad de una diapositiva.
router.post('/banner/:id', async (req, res, next) => {
  try {
    const enlace = enlaceSeguro(req.body.enlace);
    if (enlace === false) {
      return mostrar(res, { errorAdmin: 'El enlace debe empezar con / (página del sitio) o con https://' });
    }

    await pool.query(
      'UPDATE banner_slides SET titulo = $1, subtitulo = $2, enlace = $3, activo = $4 WHERE id = $5',
      [texto(req.body.titulo, 100) || null, texto(req.body.subtitulo, 200) || null, enlace, req.body.activo === 'on', req.params.id]
    );
    res.redirect('/admin/banner?ok=guardado');
  } catch (err) {
    next(err);
  }
});

router.post('/banner/:id/mover', async (req, res, next) => {
  try {
    if (req.body.direccion === 'subir' || req.body.direccion === 'bajar') {
      await mover('banner', req.params.id, req.body.direccion);
    }
    res.redirect('/admin/banner');
  } catch (err) {
    next(err);
  }
});

router.post('/banner/:id/eliminar', async (req, res, next) => {
  try {
    const { rows } = await pool.query('DELETE FROM banner_slides WHERE id = $1 RETURNING media_url', [req.params.id]);
    if (rows.length) await storage.borrarPorUrl(rows[0].media_url);
    res.redirect('/admin/banner?ok=eliminado');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
