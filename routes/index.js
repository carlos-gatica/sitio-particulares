const express = require('express');
const router = express.Router();
const servicios = require('../config/servicios');

router.get('/', (req, res) => {
  res.render('index', {
    servicios,
    siteName: process.env.SITE_NAME || 'Tu Empresa'
  });
});

module.exports = router;
