const express = require('express');
const router = express.Router();
const contenido = require('../lib/contenido');

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${res.locals.baseUrl}/sitemap.xml\n`
  );
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = res.locals.baseUrl;
    const servicios = await contenido.serviciosActivos();
    const urls = [`${base}/`].concat(servicios.map(s => `${base}/servicio/${s.slug}`));

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') +
      '\n</urlset>\n';

    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
