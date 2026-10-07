// Reproductor de la guía: capítulos, pasos con recuadro y cursor animado, reproducción automática
// (como un video), teclado y versión para imprimir. Datos en datos.js (window.GUIA).
(function () {
  'use strict';
  var G = window.GUIA;
  if (!G) return;
  var STEP_MS = 5200;
  var $ = function (s, root) {
    return (root || document).querySelector(s);
  };
  var player = $('[data-player]');
  var img = $('[data-shot]');
  var boxes = $('[data-boxes]');
  var cursor = $('[data-cursor]');
  var progress = $('[data-progress]');
  var playBtn = $('[data-play]');
  var state = { f: 0, s: 0, playing: false, timer: 0 };

  function flow() {
    return G.flows[state.f];
  }

  // Capítulos
  var nav = $('[data-chapters]');
  G.flows.forEach(function (fl, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<span>' + (i + 1) + '</span>' + fl.title;
    b.addEventListener('click', function () {
      go(i, 0, true);
    });
    nav.appendChild(b);
  });

  function rect(b) {
    return 'left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%;height:' + b.h + '%';
  }

  function render(moveCursor) {
    var fl = flow();
    var st = fl.steps[state.s];
    $('[data-chapter-title]').textContent = state.f + 1 + '. ' + fl.title;
    $('[data-chapter-lead]').textContent = fl.lead;
    img.src = 'img/' + st.img;
    img.alt = st.title;
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
    boxes.innerHTML = st.boxes
      .map(function (b) {
        return '<span style="' + rect(b) + '"></span>';
      })
      .join('');
    $('[data-count]').textContent = 'Paso ' + (state.s + 1) + ' de ' + fl.steps.length;
    $('[data-title]').textContent = st.title;
    $('[data-text]').textContent = st.text;
    // Cursor: viaja al centro del primer recuadro y "hace clic"
    var t = st.boxes[0];
    if (t) {
      cursor.style.opacity = '1';
      cursor.style.left = t.x + t.w / 2 + '%';
      cursor.style.top = t.y + t.h / 2 + '%';
      cursor.classList.remove('is-click');
      setTimeout(function () {
        cursor.classList.add('is-click');
      }, moveCursor ? 780 : 0);
    } else {
      cursor.style.opacity = '0';
    }
    // Puntos y botones
    var dots = $('[data-dots]');
    dots.innerHTML = '';
    fl.steps.forEach(function (s, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Paso ' + (i + 1) + ': ' + s.title);
      if (i === state.s) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () {
        go(state.f, i, true);
      });
      li.appendChild(b);
      dots.appendChild(li);
    });
    [].forEach.call(nav.children, function (b, i) {
      b.setAttribute('aria-current', i === state.f ? 'true' : 'false');
    });
    $('[data-prev]').disabled = state.f === 0 && state.s === 0;
    $('[data-next]').disabled =
      state.f === G.flows.length - 1 && state.s === fl.steps.length - 1;
    // Precarga del siguiente
    var nx = fl.steps[state.s + 1] || (G.flows[state.f + 1] || { steps: [] }).steps[0];
    if (nx) new Image().src = 'img/' + nx.img;
    runProgress();
    if (location.hash !== '#' + fl.id) history.replaceState(null, '', '#' + fl.id);
  }

  function runProgress() {
    progress.style.transition = 'none';
    progress.style.width = '0';
    if (!state.playing) return;
    void progress.offsetWidth;
    progress.style.transition = 'width ' + STEP_MS + 'ms linear';
    progress.style.width = '100%';
  }

  function go(f, s, user) {
    state.f = f;
    state.s = s;
    if (user && state.playing) schedule();
    render(true);
  }

  function step(dir) {
    var fl = flow();
    var s = state.s + dir;
    if (s >= fl.steps.length) {
      if (state.f < G.flows.length - 1) return go(state.f + 1, 0);
      return stop();
    }
    if (s < 0) {
      if (state.f > 0) return go(state.f - 1, G.flows[state.f - 1].steps.length - 1);
      return;
    }
    go(state.f, s);
  }

  function schedule() {
    clearInterval(state.timer);
    state.timer = setInterval(function () {
      step(1);
    }, STEP_MS);
  }
  function play() {
    state.playing = true;
    playBtn.textContent = '❚❚ Pausa';
    schedule();
    runProgress();
  }
  function stop() {
    state.playing = false;
    clearInterval(state.timer);
    playBtn.textContent = '▶ Reproducir';
    runProgress();
  }

  playBtn.addEventListener('click', function () {
    if (state.playing) stop();
    else play();
  });
  $('[data-prev]').addEventListener('click', function () {
    step(-1);
    if (state.playing) schedule();
  });
  $('[data-next]').addEventListener('click', function () {
    step(1);
    if (state.playing) schedule();
  });
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ' && player.contains(document.activeElement)) {
      e.preventDefault();
      if (state.playing) stop();
      else play();
    }
  });
  $('[data-print]').addEventListener('click', function () {
    window.print();
  });

  // Marcas numeradas sobre la captura del sitio
  var marks = $('[data-site-marks]');
  ['name', 'where', 'lead', 'axes', 'for', 'btn'].forEach(function (k, i) {
    var b = G.site[k];
    if (!b) return;
    var m = document.createElement('span');
    m.className = 'mark';
    m.setAttribute('style', rect(b));
    m.innerHTML = '<b>' + (i + 1) + '</b>';
    marks.appendChild(m);
  });

  // Versión para imprimir: todos los pasos seguidos
  var all = document.createElement('section');
  all.className = 'print-all';
  G.flows.forEach(function (fl, i) {
    var h = document.createElement('h2');
    h.textContent = i + 1 + '. ' + fl.title;
    all.appendChild(h);
    fl.steps.forEach(function (st, k) {
      var fig = document.createElement('figure');
      fig.innerHTML =
        '<div class="shot"><img src="img/' + st.img + '" alt="" loading="lazy">' +
        st.boxes
          .map(function (b) {
            return '<span class="mark" style="' + rect(b) + '"></span>';
          })
          .join('') +
        '</div><figcaption><b>' + (k + 1) + '. ' + st.title + '.</b> ' + st.text + '</figcaption>';
      all.appendChild(fig);
    });
  });
  player.parentNode.insertBefore(all, player.nextSibling);

  // Enlace directo a un capítulo (#programa, #fotos…)
  var start = 0;
  G.flows.forEach(function (fl, i) {
    if (location.hash === '#' + fl.id) start = i;
  });
  go(start, 0);
})();
