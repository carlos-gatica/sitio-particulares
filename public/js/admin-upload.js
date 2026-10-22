// Subida de fotos y videos desde el panel admin.
// 1) Las fotos se reducen en el navegador (máx. 1920 px) para ahorrar espacio.
// 2) Se pide al servidor una URL firmada y el archivo se sube DIRECTO a Supabase Storage.
// 3) El resultado (lista de {url, tipo}) queda en un campo oculto que el formulario envía al guardar.
(function () {
  var MAX_IMAGEN = 10 * 1024 * 1024;
  var MAX_VIDEO = 50 * 1024 * 1024;
  var LADO_MAXIMO = 1920;

  function esImagen(tipo) { return /^image\//.test(tipo); }
  function esVideo(tipo) { return /^video\//.test(tipo); }

  // Reduce una foto a un máximo de 1920 px y la convierte a WebP (o JPEG). Los GIF no se tocan.
  function comprimirImagen(archivo) {
    if (archivo.type === 'image/gif') return Promise.resolve(archivo);

    return new Promise(function (resolve) {
      var url = URL.createObjectURL(archivo);
      var img = new Image();

      img.onload = function () {
        URL.revokeObjectURL(url);
        var escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
        var ancho = Math.round(img.width * escala);
        var alto = Math.round(img.height * escala);

        var lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        lienzo.getContext('2d').drawImage(img, 0, 0, ancho, alto);

        function terminar(blob) {
          // Si no se logró comprimir o quedó más pesada, se sube la original.
          if (!blob || blob.size >= archivo.size) return resolve(archivo);
          resolve(blob);
        }

        lienzo.toBlob(function (webp) {
          if (webp && webp.type === 'image/webp') return terminar(webp);
          lienzo.toBlob(terminar, 'image/jpeg', 0.85);
        }, 'image/webp', 0.85);
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(archivo); // si el navegador no puede leerla, se sube tal cual
      };

      img.src = url;
    });
  }

  function pedirUrlSubida(carpeta, archivo) {
    return fetch('/admin/api/upload-url', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carpeta: carpeta, tipoMime: archivo.type, tamano: archivo.size })
    }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (datos) {
        if (!resp.ok) throw new Error(datos.error || 'No se pudo preparar la subida.');
        return datos;
      });
    });
  }

  // Sube el archivo con XMLHttpRequest para poder mostrar el progreso.
  function subirArchivo(urlSubida, archivo, alProgresar) {
    return new Promise(function (resolve, reject) {
      var datos = new FormData();
      datos.append('cacheControl', '31536000');
      datos.append('', archivo);

      var xhr = new XMLHttpRequest();
      xhr.open('PUT', urlSubida);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) alProgresar(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Supabase rechazó el archivo (' + xhr.status + ').'));
      };
      xhr.onerror = function () { reject(new Error('Se cortó la conexión durante la subida.')); };
      xhr.send(datos);
    });
  }

  function crearMiniatura(item) {
    var cont = document.createElement('div');
    cont.className = 'subidor__miniatura';

    if (item.tipo === 'imagen') {
      var img = document.createElement('img');
      img.src = item.url;
      img.alt = '';
      cont.appendChild(img);
    } else if (item.tipo === 'video') {
      var v = document.createElement('video');
      v.src = item.url + '#t=0.1';
      v.muted = true;
      v.setAttribute('playsinline', '');
      v.preload = 'metadata';
      cont.appendChild(v);
    } else {
      var id = (item.url.match(/embed\/([A-Za-z0-9_-]{11})/) || [])[1];
      var mini = document.createElement('img');
      mini.src = id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '';
      mini.alt = '';
      cont.appendChild(mini);
      var marca = document.createElement('span');
      marca.className = 'subidor__marca';
      marca.textContent = 'YouTube';
      cont.appendChild(marca);
    }
    return cont;
  }

  function iniciar(raiz) {
    var carpeta = raiz.getAttribute('data-carpeta');
    var multiple = raiz.getAttribute('data-multiple') === 'true';
    var campo = raiz.querySelector('.subidor__valor');
    var lista = raiz.querySelector('.subidor__lista');
    var archivoInput = raiz.querySelector('.subidor__archivo');
    var ytInput = raiz.querySelector('.subidor__youtube-url');
    var ytBoton = raiz.querySelector('.subidor__youtube-boton');
    var estado = raiz.querySelector('.subidor__estado');
    var enCurso = 0;

    var items = [];
    try { items = JSON.parse(campo.value || '[]'); } catch (e) { items = []; }

    // Los elementos que venían guardados no se borran del almacenamiento hasta que se guarde el formulario;
    // solo los recién subidos y descartados se borran al instante.
    var nuevos = {};

    function mostrarEstado(texto, esError) {
      estado.textContent = texto || '';
      estado.className = 'subidor__estado' + (esError ? ' subidor__estado--error' : '');
    }

    function pintar() {
      campo.value = JSON.stringify(items);
      lista.innerHTML = '';

      items.forEach(function (item, i) {
        var caja = document.createElement('div');
        caja.className = 'subidor__item';
        caja.appendChild(crearMiniatura(item));

        var quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'subidor__quitar';
        quitar.setAttribute('aria-label', 'Quitar');
        quitar.textContent = '×';
        quitar.addEventListener('click', function () {
          items.splice(i, 1);
          if (nuevos[item.url]) {
            delete nuevos[item.url];
            fetch('/admin/api/borrar', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: item.url })
            }).catch(function () { /* si falla, solo queda un archivo huérfano */ });
          }
          pintar();
        });
        caja.appendChild(quitar);
        lista.appendChild(caja);
      });
    }

    function agregar(item) {
      if (!multiple) items = [item];
      else items.push(item);
      pintar();
    }

    function procesar(archivo) {
      var tipo = archivo.type;

      if (!esImagen(tipo) && !esVideo(tipo)) {
        return Promise.reject(new Error('«' + archivo.name + '»: formato no permitido.'));
      }
      if (esVideo(tipo) && archivo.size > MAX_VIDEO) {
        return Promise.reject(new Error('«' + archivo.name + '» pesa más de 50 MB. Usa un video más corto o un link de YouTube.'));
      }

      var preparado = esImagen(tipo) ? comprimirImagen(archivo) : Promise.resolve(archivo);

      return preparado.then(function (final) {
        if (esImagen(tipo) && final.size > MAX_IMAGEN) {
          throw new Error('«' + archivo.name + '» pesa más de 10 MB.');
        }

        return pedirUrlSubida(carpeta, final).then(function (resp) {
          mostrarEstado('Subiendo «' + archivo.name + '»… 0%');
          return subirArchivo(resp.urlSubida, final, function (pct) {
            mostrarEstado('Subiendo «' + archivo.name + '»… ' + pct + '%');
          }).then(function () {
            nuevos[resp.urlPublica] = true;
            agregar({ url: resp.urlPublica, tipo: resp.tipo });
          });
        });
      });
    }

    archivoInput.addEventListener('change', function () {
      var archivos = Array.prototype.slice.call(archivoInput.files || []);
      archivoInput.value = '';
      if (!archivos.length) return;

      enCurso++;
      raiz.classList.add('subidor--ocupado');
      mostrarEstado('');

      // Se suben de a uno para no saturar la conexión del celular.
      var errores = [];
      archivos.reduce(function (cadena, archivo) {
        return cadena.then(function () {
          return procesar(archivo).catch(function (err) { errores.push(err.message); });
        });
      }, Promise.resolve()).then(function () {
        enCurso--;
        if (enCurso === 0) raiz.classList.remove('subidor--ocupado');
        if (errores.length) mostrarEstado(errores.join(' '), true);
        else mostrarEstado('Listo. Recuerda guardar para publicar los cambios.');
      });
    });

    function agregarYoutube() {
      var valor = ytInput.value.trim();
      if (!valor) return;
      var id = (valor.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) || [])[1];
      if (!id) {
        mostrarEstado('Ese link no parece ser de YouTube.', true);
        return;
      }
      agregar({ url: 'https://www.youtube-nocookie.com/embed/' + id, tipo: 'youtube' });
      ytInput.value = '';
      mostrarEstado('Link agregado. Recuerda guardar para publicar los cambios.');
    }

    ytBoton.addEventListener('click', agregarYoutube);
    ytInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarYoutube();
      }
    });

    // Evita guardar el formulario mientras todavía hay una subida en curso.
    var formulario = raiz.closest('form');
    if (formulario) {
      formulario.addEventListener('submit', function (e) {
        if (enCurso > 0) {
          e.preventDefault();
          window.alert('Espera a que termine la subida del archivo antes de guardar.');
          return;
        }
        // Si quedó un link de YouTube escrito sin presionar "Agregar link", se agrega solo.
        if (ytInput.value.trim()) agregarYoutube();
      }, true);
    }

    pintar();
  }

  document.querySelectorAll('.subidor').forEach(iniciar);
})();
