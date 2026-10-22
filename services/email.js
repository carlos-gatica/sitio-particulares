const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Escapa el texto que escribe el visitante para que no se interprete como HTML dentro del correo.
function esc(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function notificarCotizacionPorCorreo(cotizacion) {
  const { nombre, telefono, correo, servicio_slug, descripcion } = cotizacion;

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATION_EMAIL_FROM,
      to: process.env.NOTIFICATION_EMAIL_TO,
      subject: `Nueva cotización — ${String(nombre).replace(/[\r\n]+/g, ' ')}`,
      replyTo: correo,
      html: `
        <h2>Nueva solicitud de cotización</h2>
        <p><strong>Nombre:</strong> ${esc(nombre)}</p>
        <p><strong>Teléfono:</strong> ${esc(telefono)}</p>
        <p><strong>Correo:</strong> ${esc(correo)}</p>
        <p><strong>Servicio:</strong> ${esc(servicio_slug || 'No especificado')}</p>
        <p><strong>Descripción:</strong></p>
        <p>${esc(descripcion).replace(/\n/g, '<br>')}</p>
      `
    });
  } catch (error) {
    // No se interrumpe el flujo del usuario si falla el correo.
    console.error('Error enviando correo con Resend:', error);
  }
}

module.exports = { notificarCotizacionPorCorreo };
