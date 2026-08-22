const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { notificarCotizacionPorCorreo } = require('../services/email');
const { notificarCotizacionPorWhatsapp } = require('../services/whatsapp');
const servicios = require('../config/servicios');

router.post('/cotizacion', async (req, res) => {
  const { nombre, telefono, correo, servicio_slug, descripcion } = req.body;

  // Validación mínima de campos requeridos
  if (!nombre || !telefono || !correo || !descripcion) {
    return res.status(400).render('index', {
      servicios,
      siteName: process.env.SITE_NAME || 'Tu Empresa',
      error: 'Por favor completa todos los campos obligatorios.'
    });
  }

  // El formulario solo pide los 8 dígitos locales; el prefijo +569 es fijo.
  const soloDigitos = telefono.trim().replace(/\D/g, '').slice(-8);
  const telefonoNormalizado = '+569' + soloDigitos;

  try {
    const result = await pool.query(
      `INSERT INTO cotizaciones (nombre, telefono, correo, servicio_slug, descripcion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, telefonoNormalizado, correo, servicio_slug || null, descripcion]
    );

    const cotizacion = result.rows[0];

    // Notificaciones en paralelo, sin bloquear la respuesta al usuario
    Promise.all([
      notificarCotizacionPorCorreo(cotizacion),
      notificarCotizacionPorWhatsapp(cotizacion)
    ]).catch(err => console.error('Error en notificaciones:', err));

    res.render('gracias', {
      siteName: process.env.SITE_NAME || 'Tu Empresa',
      nombre
    });
  } catch (error) {
    console.error('Error guardando cotización:', error);
    res.status(500).render('index', {
      servicios,
      siteName: process.env.SITE_NAME || 'Tu Empresa',
      error: 'Ocurrió un error al enviar tu solicitud. Intenta nuevamente.'
    });
  }
});

module.exports = router;
