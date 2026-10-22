require('dotenv').config();
const express = require('express');
const path = require('path');
const { asegurarDb } = require('./db/pool');
const ajustes = require('./lib/ajustes');
const media = require('./lib/media');
const requireAdmin = require('./middleware/requireAdmin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Vercel pasa la IP real del visitante en X-Forwarded-For
app.disable('x-powered-by');

// Ayudas disponibles en todas las vistas (links de YouTube, miniaturas, etc.)
app.locals.media = media;

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Antes de cualquier página: tablas listas y datos comunes (nombre del sitio, ajustes).
app.use(async (req, res, next) => {
  try {
    await asegurarDb();
    res.locals.siteName = process.env.SITE_NAME || 'Tu Empresa';
    res.locals.ajustes = await ajustes.obtener();
    res.locals.baseUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`;
    next();
  } catch (err) {
    next(err);
  }
});

app.use(require('./routes/index'));
app.use(require('./routes/health'));
app.use(require('./routes/servicio'));
app.use(require('./routes/cotizacion'));
app.use(require('./routes/seo'));

// Panel de administración: login público, todo lo demás exige sesión.
app.use(require('./routes/admin-auth'));
app.use(
  '/admin',
  requireAdmin,
  require('./routes/admin'),
  require('./routes/admin-servicios'),
  require('./routes/admin-banner'),
  require('./routes/admin-api')
);

// 404 genérico
app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página no encontrada' });
});

// Errores no controlados: se registran y el visitante ve un mensaje simple.
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  if (res.headersSent) return next(err);
  if (req.originalUrl.startsWith('/admin/api/')) {
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
  res.status(500).send('Ocurrió un error. Intenta nuevamente en unos minutos.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
