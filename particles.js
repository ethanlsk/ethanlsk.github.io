// Drifting particle field behind the page: cyan and rust dots on the Material
// Darker base, linked by faint lines when they drift close. Self-contained, no
// library. Costs one canvas and an rAF loop that pauses when the tab is hidden.
(function () {
  var canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // straight from the palette in style.css
  var CYAN = '137,221,255';   // --cyan  #89DDFF
  var RUST = '247,140,108';   // --rust  #F78C6C

  var LINK = 130;             // px within which two dots are joined
  var dots = [], w = 0, h = 0, raf = null;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    // density by area, but capped so a big monitor does not melt
    var n = Math.round((w * h) / 21000);
    n = Math.max(16, Math.min(n, w < 640 ? 32 : 76));
    dots = [];
    for (var i = 0; i < n; i++) {
      dots.push({
        x:  Math.random() * w,
        y:  Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r:  0.8 + Math.random() * 1.4,
        c:  Math.random() < 0.17 ? RUST : CYAN   // mostly cyan, occasional rust
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < dots.length; i++) {
      var a = dots[i];
      for (var j = i + 1; j < dots.length; j++) {
        var b = dots[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        var alpha = (1 - Math.sqrt(d2) / LINK) * 0.15;
        ctx.strokeStyle = 'rgba(' + CYAN + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (var k = 0; k < dots.length; k++) {
      var p = dots[k];
      ctx.fillStyle = 'rgba(' + p.c + ',0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < dots.length; i++) {
      var p = dots[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
    }
    draw();
    raf = window.requestAnimationFrame(step);
  }

  function start() {
    if (raf === null && !reduced && window.requestAnimationFrame) {
      raf = window.requestAnimationFrame(step);
    }
  }
  function stop() {
    if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
  }

  size();
  build();
  draw();          // reduced-motion visitors get the field, just not the drift
  start();

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { size(); build(); draw(); }, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
