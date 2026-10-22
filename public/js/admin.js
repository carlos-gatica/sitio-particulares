// Pequeños comportamientos del panel admin.
(function () {
  // Confirmación antes de acciones destructivas: <form data-confirmar="..."> o <button data-confirmar="...">
  document.addEventListener('submit', function (e) {
    var enviador = e.submitter;
    var mensaje = (enviador && enviador.getAttribute('data-confirmar')) ||
                  e.target.getAttribute('data-confirmar');
    if (mensaje && !window.confirm(mensaje)) e.preventDefault();
  });
})();
