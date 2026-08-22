const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function notificarCotizacionPorCorreo(cotizacion) {
  const { nombre, telefono, correo, servicio_slug, descripcion } = cotizacion;

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATION_EMAIL_FROM,
      to: process.env.NOTIFICATION_EMAIL_TO,
      subject: `Nueva cotización — ${nombre}`,
      html: `
        <h2>Nueva solicitud de cotización</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Correo:</strong> ${correo}</p>
        <p><strong>Servicio:</strong> ${servicio_slug || 'No especificado'}</p>
        <p><strong>Descripción:</strong></p>
        <p>${descripcion}</p>
      `
    });
  } catch (error) {
    // No se interrumpe el flujo del usuario si falla el correo.
    console.error('Error enviando correo con Resend:', error);
  }
}

module.exports = { notificarCotizacionPorCorreo };
