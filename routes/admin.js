const express = require('express');
const router = express.Router();
const basicAuth = require('../middleware/basicAuth');
const { pool } = require('../db/pool');

router.get('/admin/cotizaciones', basicAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cotizaciones ORDER BY creado_en DESC'
    );

    res.render('admin/cotizaciones', {
      cotizaciones: result.rows,
      siteName: process.env.SITE_NAME || 'Tu Empresa'
    });
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).send('Error al cargar las cotizaciones.');
  }
});

module.exports = router;
