// CallMeBot funciona con una simple petición GET, no requiere librería.
// Node 18+ trae `fetch` global (Vercel usa Node 18+ por defecto).

async function notificarCotizacionPorWhatsapp(cotizacion) {
  const { nombre, telefono, servicio_slug } = cotizacion;

  const texto = encodeURIComponent(
    `Nueva cotización de ${nombre} (${telefono}) — servicio: ${servicio_slug || 'no especificado'}`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${process.env.CALLMEBOT_PHONE}&text=${texto}&apikey=${process.env.CALLMEBOT_APIKEY}`;

  try {
    await fetch(url);
  } catch (error) {
    // No se interrumpe el flujo del usuario si falla el aviso de WhatsApp.
    console.error('Error enviando WhatsApp con CallMeBot:', error);
  }
}

module.exports = { notificarCotizacionPorWhatsapp };
