const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const ajustes = require('../lib/ajustes');
const contenido = require('../lib/contenido');

const limpiar = (valor, max) => String(valor || '').trim().slice(0, max);

router.get('/', (req, res) => res.redirect('/admin/cotizaciones'));

router.get('/cotizaciones', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM cotizaciones ORDER BY creado_en DESC');
    const servicios = await contenido.serviciosActivos();
    const nombres = {};
    servicios.forEach(s => { nombres[s.slug] = s.titulo; });

    res.render('admin/cotizaciones', {
      cotizaciones: result.rows,
      nombresServicio: nombres,
      seccion: 'cotizaciones',
      tituloAdmin: 'Cotizaciones',
      query: req.query
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ajustes', async (req, res, next) => {
  try {
    res.render('admin/ajustes', {
      valores: await ajustes.obtener(),
      seccion: 'ajustes',
      tituloAdmin: 'Ajustes',
      query: req.query
    });
  } catch (err) {
    next(err);
  }
});

router.post('/ajustes', async (req, res, next) => {
  try {
    const b = req.body;

    // Los links de redes solo se aceptan si son de la red correspondiente.
    const red = (valor, dominios) => {
      const url = limpiar(valor, 200);
      if (!url) return '';
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        return /^https:\/\//.test(url) && dominios.some(d => host === d || host.endsWith('.' + d)) ? url : null;
      } catch (err) {
        return null;
      }
    };

    const instagram = red(b.instagram, ['instagram.com']);
    const facebook = red(b.facebook, ['facebook.com', 'fb.com']);

    if (instagram === null || facebook === null) {
      return res.status(400).render('admin/ajustes', {
        valores: Object.assign({}, await ajustes.obtener(), b),
        seccion: 'ajustes',
        tituloAdmin: 'Ajustes',
        query: {},
        errorAdmin: 'Los links de Instagram y Facebook deben empezar con https:// y ser de esa red (por ejemplo https://instagram.com/tu_usuario).'
      });
    }

    const whatsapp = limpiar(b.whatsapp, 20).replace(/\D/g, '');

    await ajustes.guardar({
      hero_titulo: limpiar(b.hero_titulo, 160),
      hero_subtitulo: limpiar(b.hero_subtitulo, 300),
      whatsapp,
      whatsapp_mensaje: limpiar(b.whatsapp_mensaje, 200),
      instagram,
      facebook
    });

    res.redirect('/admin/ajustes?ok=guardado');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
