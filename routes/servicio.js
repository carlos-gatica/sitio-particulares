const express = require('express');
const router = express.Router();
const contenido = require('../lib/contenido');

// Página de detalle del servicio + portafolio de proyectos realizados.
router.get('/servicio/:slug', async (req, res, next) => {
  try {
    const servicio = await contenido.servicioPorSlug(req.params.slug);

    if (!servicio) {
      return res.status(404).render('404', { titulo: 'Página no encontrada' });
    }

    const [servicios, portafolio] = await Promise.all([
      contenido.serviciosActivos(),
      contenido.portafolioDe(servicio.id)
    ]);

    res.render('servicio', {
      servicio,
      servicios,
      portafolio,
      titulo: servicio.titulo,
      descripcionMeta: servicio.resumen
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
