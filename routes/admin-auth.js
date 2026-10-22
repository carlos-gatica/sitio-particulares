const express = require('express');
const router = express.Router();
const { sesionDe, iniciarSesion, cerrarSesion, credencialesValidas } = require('../lib/session');
const { crearLimitador } = require('../lib/limite');

// 6 intentos fallidos por IP cada 15 minutos.
const limitador = crearLimitador({ max: 6, ventanaMs: 15 * 60 * 1000 });

// Solo se permite volver a una página interna del admin (evita redirecciones a sitios externos).
function destinoSeguro(valor) {
  if (typeof valor === 'string' && valor.startsWith('/admin') && !valor.startsWith('//') && !valor.startsWith('/admin/login')) {
    return valor;
  }
  return '/admin/cotizaciones';
}

router.get('/admin/login', (req, res) => {
  if (sesionDe(req)) return res.redirect(destinoSeguro(req.query.volver));
  res.render('admin/login', { error: null, volver: destinoSeguro(req.query.volver) });
});

router.post('/admin/login', async (req, res) => {
  const ip = req.ip || 'desconocida';
  const volver = destinoSeguro(req.body.volver);

  if (!limitador.permitido(ip)) {
    return res.status(429).render('admin/login', {
      error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      volver
    });
  }

  if (credencialesValidas(req.body.usuario, req.body.clave)) {
    limitador.reiniciar(ip);
    iniciarSesion(req, res, String(req.body.usuario));
    return res.redirect(volver);
  }

  limitador.registrar(ip);
  await new Promise(resolve => setTimeout(resolve, 600)); // frena la prueba rápida de claves
  res.status(401).render('admin/login', { error: 'Usuario o clave incorrectos.', volver });
});

router.post('/admin/logout', (req, res) => {
  cerrarSesion(req, res);
  res.redirect('/admin/login');
});

module.exports = router;
