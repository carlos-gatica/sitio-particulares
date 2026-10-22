// Endpoints JSON que usa el navegador del admin para subir archivos directo a Supabase Storage.
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const storage = require('../lib/storage');
const media = require('../lib/media');

const CARPETAS = ['servicios', 'portafolio', 'banner'];

// POST /admin/api/upload-url  { carpeta, tipoMime, tamano }
// Responde { urlSubida, urlPublica, tipo }. El navegador hace PUT del archivo a urlSubida.
router.post('/api/upload-url', async (req, res) => {
  if (!storage.disponible()) {
    return res.status(503).json({
      error: 'Falta configurar el almacenamiento (variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel).'
    });
  }

  const { carpeta, tipoMime, tamano } = req.body || {};

  if (!CARPETAS.includes(carpeta)) {
    return res.status(400).json({ error: 'Carpeta no válida.' });
  }

  const tipo = media.tipoDeMime(tipoMime);
  const extension = media.extensionDeMime(tipoMime);
  if (!tipo || !extension) {
    return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP, GIF, MP4, WEBM o MOV.' });
  }

  const bytes = Number(tamano);
  const maximo = tipo === 'video' ? media.MAX_VIDEO : media.MAX_IMAGEN;
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > maximo) {
    const mb = Math.round(maximo / 1024 / 1024);
    return res.status(400).json({
      error: tipo === 'video'
        ? `El video pesa demasiado (máximo ${mb} MB). Usa un video más corto o pega un link de YouTube.`
        : `La imagen pesa demasiado (máximo ${mb} MB).`
    });
  }

  // Nombre generado por el servidor: nunca se usa el nombre que viene del navegador.
  const ruta = `${carpeta}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;

  try {
    const urlSubida = await storage.crearUrlSubida(ruta);
    res.json({ urlSubida, urlPublica: storage.urlPublica(ruta), tipo });
  } catch (err) {
    console.error('Error creando URL de subida:', err.message);
    res.status(502).json({
      error: 'No se pudo preparar la subida. Revisa la configuración de Supabase Storage (ver guía).'
    });
  }
});

// POST /admin/api/borrar  { url }  — borra un archivo recién subido que el usuario descartó.
router.post('/api/borrar', async (req, res, next) => {
  try {
    const url = String((req.body && req.body.url) || '');
    const ruta = storage.rutaDesdeUrlPublica(url);
    if (!ruta) return res.status(400).json({ error: 'URL no válida.' });

    // Seguridad: nunca se borra un archivo que el sitio ya está usando.
    const { rows } = await pool.query(
      `SELECT 1 FROM servicios WHERE media_url = $1
       UNION ALL SELECT 1 FROM banner_slides WHERE media_url = $1
       UNION ALL SELECT 1 FROM portafolio_items WHERE media_url = $1
       LIMIT 1`,
      [url]
    );
    if (rows.length) return res.status(409).json({ error: 'Ese archivo está en uso.' });

    await storage.borrar([ruta]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
