const express = require('express');
const router = express.Router();
const contenido = require('../lib/contenido');

router.get('/', async (req, res, next) => {
  try {
    const [servicios, slides] = await Promise.all([
      contenido.serviciosActivos(),
      contenido.slidesActivos()
    ]);

    // Permite abrir el formulario con un servicio ya elegido: /?servicio=pintura#cotizar
    const servicioSel = servicios.some(s => s.slug === req.query.servicio) ? req.query.servicio : '';

    res.render('index', { servicios, slides, servicioSel, formTs: Date.now() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
