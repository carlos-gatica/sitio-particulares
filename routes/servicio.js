const express = require('express');
const router = express.Router();
const servicios = require('../config/servicios');

router.get('/servicio/:slug', (req, res) => {
  const servicio = servicios.find(s => s.slug === req.params.slug);

  if (!servicio) {
    return res.status(404).render('404', {
      siteName: process.env.SITE_NAME || 'Tu Empresa'
    });
  }

  res.render('servicio', {
    servicio,
    servicios,
    siteName: process.env.SITE_NAME || 'Tu Empresa'
  });
});

module.exports = router;
