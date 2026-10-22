// Visor ampliado (lightbox) para el portafolio y los videos de YouTube del banner.
// Se activa en cualquier elemento con el atributo data-lightbox, que debe traer:
//   data-tipo="imagen|video|youtube"  data-url="..."  data-titulo="..."  data-grupo="nombre del grupo"
(function () {
  var visor = null;
  var contenido = null;
  var pie = null;
  var grupo = [];
  var indice = 0;
  var disparador = null;

  function crearVisor() {
    visor = document.createElement('div');
    visor.className = 'visor';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Visor de proyectos');
    visor.hidden = true;
    visor.innerHTML =
      '<button type="button" class="visor__cerrar" aria-label="Cerrar">×</button>' +
      '<button type="button" class="visor__flecha visor__flecha--ant" aria-label="Anterior">‹</button>' +
      '<div class="visor__contenido"></div>' +
      '<button type="button" class="visor__flecha visor__flecha--sig" aria-label="Siguiente">›</button>' +
      '<p class="visor__pie"></p>';
    document.body.appendChild(visor);

    contenido = visor.querySelector('.visor__contenido');
    pie = visor.querySelector('.visor__pie');

    visor.querySelector('.visor__cerrar').addEventListener('click', cerrar);
    visor.querySelector('.visor__flecha--ant').addEventListener('click', function () { mostrar(indice - 1); });
    visor.querySelector('.visor__flecha--sig').addEventListener('click', function () { mostrar(indice + 1); });
    visor.addEventListener('click', function (e) {
      if (e.target === visor || e.target === contenido) cerrar();
    });
  }

  function limpiar() {
    // Quitar el contenido detiene los videos y la reproducción de YouTube.
    while (contenido.firstChild) contenido.removeChild(contenido.firstChild);
  }

  function mostrar(i) {
    if (!grupo.length) return;
    indice = (i + grupo.length) % grupo.length;
    var item = grupo[indice];
    limpiar();

    var tipo = item.getAttribute('data-tipo');
    var url = item.getAttribute('data-url');
    var titulo = item.getAttribute('data-titulo') || '';
    var elemento;

    if (tipo === 'imagen') {
      elemento = document.createElement('img');
      elemento.src = url;
      elemento.alt = titulo;
    } else if (tipo === 'video') {
      elemento = document.createElement('video');
      elemento.src = url;
      elemento.controls = true;
      elemento.autoplay = true;
      elemento.setAttribute('playsinline', '');
    } else {
      elemento = document.createElement('iframe');
      elemento.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1&rel=0';
      elemento.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      elemento.setAttribute('allowfullscreen', '');
      elemento.title = titulo || 'Video del proyecto';
    }

    contenido.appendChild(elemento);
    pie.textContent = titulo;

    var varios = grupo.length > 1;
    visor.querySelector('.visor__flecha--ant').hidden = !varios;
    visor.querySelector('.visor__flecha--sig').hidden = !varios;
  }

  function abrir(elemento) {
    if (!visor) crearVisor();

    var nombre = elemento.getAttribute('data-grupo');
    grupo = Array.prototype.slice.call(
      document.querySelectorAll('[data-lightbox][data-grupo="' + nombre + '"]')
    );
    var posicion = grupo.indexOf(elemento);

    disparador = elemento;
    visor.hidden = false;
    document.body.classList.add('visor-abierto');
    mostrar(posicion < 0 ? 0 : posicion);
    visor.querySelector('.visor__cerrar').focus();
  }

  function cerrar() {
    if (!visor || visor.hidden) return;
    limpiar();
    visor.hidden = true;
    document.body.classList.remove('visor-abierto');
    if (disparador && disparador.focus) disparador.focus();
  }

  document.addEventListener('click', function (e) {
    var objetivo = e.target.closest ? e.target.closest('[data-lightbox]') : null;
    if (!objetivo) return;
    e.preventDefault();
    abrir(objetivo);
  });

  document.addEventListener('keydown', function (e) {
    if (!visor || visor.hidden) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowLeft') mostrar(indice - 1);
    if (e.key === 'ArrowRight') mostrar(indice + 1);
  });

  // Deslizar en el celular para pasar al anterior / siguiente
  var inicioX = null;
  document.addEventListener('touchstart', function (e) {
    if (visor && !visor.hidden) inicioX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (inicioX === null || !visor || visor.hidden) return;
    var dif = e.changedTouches[0].clientX - inicioX;
    inicioX = null;
    if (Math.abs(dif) > 60) mostrar(dif < 0 ? indice + 1 : indice - 1);
  }, { passive: true });
})();
