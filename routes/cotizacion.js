const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { notificarCotizacionPorCorreo } = require('../services/email');
const { notificarCotizacionPorWhatsapp } = require('../services/whatsapp');
const contenido = require('../lib/contenido');
const { crearLimitador } = require('../lib/limite');

// Máximo 5 solicitudes por IP cada 10 minutos (freno básico contra spam).
const limitador = crearLimitador({ max: 5, ventanaMs: 10 * 60 * 1000 });

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function mostrarFormularioConError(res, estado, mensaje, valores) {
  const [servicios, slides] = await Promise.all([contenido.serviciosActivos(), contenido.slidesActivos()]);
  return res.status(estado).render('index', {
    servicios,
    slides,
    servicioSel: (valores && valores.servicio_slug) || '',
    formTs: Date.now(),
    error: mensaje
  });
}

router.post('/cotizacion', async (req, res, next) => {
  try {
    const { nombre, telefono, correo, servicio_slug, descripcion, sitio_web, form_ts } = req.body;

    // Trampa para bots: el campo "sitio_web" está oculto; una persona nunca lo llena.
    // También se descarta lo que se envía en menos de 3 segundos desde que cargó la página.
    const muyRapido = Date.now() - Number(form_ts || 0) < 3000;
    if (sitio_web || muyRapido) {
      return res.render('gracias', { nombre: String(nombre || '').slice(0, 100), titulo: 'Solicitud enviada' });
    }

    const ip = req.ip || 'desconocida';
    if (!limitador.permitido(ip)) {
      return mostrarFormularioConError(res, 429, 'Enviaste varias solicitudes seguidas. Espera unos minutos o escríbenos por WhatsApp.', req.body);
    }

    // Validación de campos requeridos y largos máximos
    if (!nombre || !telefono || !correo || !descripcion) {
      return mostrarFormularioConError(res, 400, 'Por favor completa todos los campos obligatorios.', req.body);
    }

    const nombreLimpio = String(nombre).trim().slice(0, 100);
    const correoLimpio = String(correo).trim().slice(0, 150);
    const descripcionLimpia = String(descripcion).trim().slice(0, 2000);

    if (!CORREO_VALIDO.test(correoLimpio)) {
      return mostrarFormularioConError(res, 400, 'El correo electrónico no parece válido.', req.body);
    }

    // El formulario solo pide los 8 dígitos locales; el prefijo +569 es fijo.
    const digitos = String(telefono).replace(/\D/g, '');
    if (digitos.length < 8) {
      return mostrarFormularioConError(res, 400, 'El teléfono debe tener 8 dígitos (después de +569).', req.body);
    }
    const telefonoNormalizado = '+569' + digitos.slice(-8);

    // Solo se guarda el servicio si existe en el catálogo.
    const servicios = await contenido.serviciosActivos();
    const slugValido = servicios.some(s => s.slug === servicio_slug) ? servicio_slug : null;

    limitador.registrar(ip);

    const result = await pool.query(
      `INSERT INTO cotizaciones (nombre, telefono, correo, servicio_slug, descripcion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombreLimpio, telefonoNormalizado, correoLimpio, slugValido, descripcionLimpia]
    );

    const cotizacion = result.rows[0];

    // Se espera a que ambas notificaciones terminen antes de responder,
    // porque en Vercel (serverless) la función puede cortarse justo al enviar la respuesta,
    // dejando notificaciones "en vuelo" sin completar (especialmente CallMeBot).
    try {
      await Promise.all([
        notificarCotizacionPorCorreo(cotizacion),
        notificarCotizacionPorWhatsapp(cotizacion)
      ]);
    } catch (err) {
      console.error('Error en notificaciones:', err);
    }

    res.render('gracias', { nombre: nombreLimpio, titulo: 'Solicitud enviada' });
  } catch (error) {
    console.error('Error guardando cotización:', error);
    try {
      await mostrarFormularioConError(res, 500, 'Ocurrió un error al enviar tu solicitud. Intenta nuevamente.', req.body);
    } catch (err) {
      next(err);
    }
  }
});

module.exports = router;
