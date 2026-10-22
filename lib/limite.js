// Limitador de intentos simple, en memoria.
// En Vercel cada instancia tiene su propia memoria, así que es una barrera "de mejor esfuerzo":
// frena a bots torpes y a quien pruebe claves a mano, sin necesitar servicios externos.

function crearLimitador({ max, ventanaMs }) {
  const registros = new Map(); // clave -> [timestamps]

  function limpiar(clave, ahora) {
    const lista = (registros.get(clave) || []).filter(t => ahora - t < ventanaMs);
    if (lista.length) registros.set(clave, lista);
    else registros.delete(clave);
    return lista;
  }

  return {
    // ¿Todavía puede intentar?
    permitido(clave) {
      return limpiar(clave, Date.now()).length < max;
    },
    // Anota un intento (úsalo en cada intento fallido o en cada envío).
    registrar(clave) {
      const ahora = Date.now();
      const lista = limpiar(clave, ahora);
      lista.push(ahora);
      registros.set(clave, lista);

      // Evita que el mapa crezca sin límite.
      if (registros.size > 5000) {
        for (const k of registros.keys()) limpiar(k, ahora);
      }
    },
    reiniciar(clave) {
      registros.delete(clave);
    }
  };
}

module.exports = { crearLimitador };
