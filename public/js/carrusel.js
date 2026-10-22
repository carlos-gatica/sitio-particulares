// Carrusel de la portada: cambia solo, con flechas, puntos y deslizamiento en el celular.
// Las fotos duran unos segundos; los videos se reproducen completos (sin sonido) y luego pasa el siguiente.
(function () {
  var TIEMPO_IMAGEN = 6000;
  var TIEMPO_MAXIMO_VIDEO = 20000;

  function iniciar(raiz) {
    var slides = Array.prototype.slice.call(raiz.querySelectorAll('.banner__slide'));
    if (!slides.length) return;

    var puntos = Array.prototype.slice.call(raiz.querySelectorAll('.banner__punto'));
    var anterior = raiz.querySelector('.banner__flecha--ant');
    var siguiente = raiz.querySelector('.banner__flecha--sig');
    var reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var actual = 0;
    var temporizador = null;
    var pausado = false;

    function videoDe(slide) {
      return slide.querySelector('video');
    }

    function detener() {
      clearTimeout(temporizador);
      temporizador = null;
    }

    function programar() {
      detener();
      if (slides.length < 2 || pausado || reducirMovimiento || document.hidden) return;

      var slide = slides[actual];
      var video = videoDe(slide);

      if (video) {
        // Avanza cuando el video termina (o a los 20 s como máximo).
        video.onended = function () { ir(actual + 1); };
        temporizador = setTimeout(function () { ir(actual + 1); }, TIEMPO_MAXIMO_VIDEO);
      } else {
        temporizador = setTimeout(function () { ir(actual + 1); }, TIEMPO_IMAGEN);
      }
    }

    function ir(indice) {
      var nuevo = (indice + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        var activa = i === nuevo;
        slide.classList.toggle('is-activa', activa);
        slide.setAttribute('aria-hidden', activa ? 'false' : 'true');

        var video = videoDe(slide);
        if (video) {
          if (activa) {
            video.currentTime = 0;
            if (!reducirMovimiento) {
              var intento = video.play();
              if (intento && intento.catch) intento.catch(function () { /* el navegador bloqueó la reproducción */ });
            }
          } else {
            video.pause();
          }
        }
      });

      puntos.forEach(function (punto, i) {
        punto.classList.toggle('is-activo', i === nuevo);
      });

      actual = nuevo;
      programar();
    }

    if (anterior) anterior.addEventListener('click', function () { ir(actual - 1); });
    if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1); });
    puntos.forEach(function (punto, i) {
      punto.addEventListener('click', function () { ir(i); });
    });

    // Pausa al pasar el mouse o enfocar con el teclado; se reanuda al salir.
    raiz.addEventListener('mouseenter', function () { pausado = true; detener(); });
    raiz.addEventListener('mouseleave', function () { pausado = false; programar(); });
    raiz.addEventListener('focusin', function () { pausado = true; detener(); });
    raiz.addEventListener('focusout', function () { pausado = false; programar(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) detener();
      else programar();
    });

    // Deslizar con el dedo
    var inicioX = null;
    raiz.addEventListener('touchstart', function (e) {
      inicioX = e.changedTouches[0].clientX;
    }, { passive: true });
    raiz.addEventListener('touchend', function (e) {
      if (inicioX === null) return;
      var dif = e.changedTouches[0].clientX - inicioX;
      inicioX = null;
      if (Math.abs(dif) > 50) ir(dif < 0 ? actual + 1 : actual - 1);
    }, { passive: true });

    // Flechas del teclado cuando el carrusel tiene el foco
    raiz.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') ir(actual - 1);
      if (e.key === 'ArrowRight') ir(actual + 1);
    });

    ir(0);
  }

  document.querySelectorAll('[data-carrusel]').forEach(iniciar);
})();
