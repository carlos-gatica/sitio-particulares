// Protege todo lo que cuelga de /admin (excepto /admin/login).
// Reemplaza al antiguo Basic Auth: ahora hay pantalla de login y sesión por cookie.

const { sesionDe } = require('../lib/session');

function requireAdmin(req, res, next) {
  const sesion = sesionDe(req);

  if (!sesion) {
    const esApi = req.originalUrl.startsWith('/admin/api/');
    if (esApi) return res.status(401).json({ error: 'Tu sesión expiró. Vuelve a ingresar.' });
    return res.redirect('/admin/login?volver=' + encodeURIComponent(req.originalUrl));
  }

  // Defensa extra contra CSRF: en acciones que modifican datos, el origen debe ser este mismo sitio.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origen = req.headers.origin;
    if (origen) {
      let host = '';
      try { host = new URL(origen).host; } catch (err) { /* origen inválido */ }
      if (host !== req.headers.host) {
        return res.status(403).send('Solicitud rechazada.');
      }
    }
  }

  res.locals.adminUsuario = sesion.u;
  next();
}

module.exports = requireAdmin;
