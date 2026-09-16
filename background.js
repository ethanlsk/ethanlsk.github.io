// Background scene: faint PCB traces that give way to optical fibres, which in
// turn give way to a LiDAR point cloud, tracking scroll position down the page.
// The three motifs are the three halves of the work on this site -- circuits,
// photonics, robotics. Black base, blue and white highlights, no library.
(function () {
  var canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var BLUE  = '77,163,255';
  var ICE   = '191,226,255';
  var WHITE = '255,255,255';

  var w = 0, h = 0, small = false, raf = null, t0 = Date.now();
  var traces = [], fibres = [], cloud = [], horizon = 0;

  // prefers-reduced-motion calms the scene rather than stopping it. What that
  // setting is meant to suppress is large, sweeping movement, so the fibres
  // stop undulating and everything else runs at a third speed -- the travelling
  // lights are small and local, and freezing the whole thing outright just
  // leaves a dead background.
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = reduced ? 0.33 : 1;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------------------------------------------------------------- sizing */

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    small = w < 700;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ------------------------------------------------------- PCB trace layer */

  function buildTraces() {
    traces = [];
    var n = small ? 11 : 24;
    var grid = 26;
    for (var i = 0; i < n; i++) {
      var x = Math.round(rnd(0, w) / grid) * grid;
      var y = Math.round(rnd(0, h) / grid) * grid;
      var pts = [{ x: x, y: y }];
      var horiz = Math.random() < 0.5;
      var segs = 3 + (Math.random() * 5 | 0);
      for (var k = 0; k < segs; k++) {
        var len = grid * (2 + (Math.random() * 6 | 0));
        var sx = Math.random() < 0.5 ? -1 : 1;
        var sy = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.32) {           // 45 degree dogleg, as on a real board
          x += len * sx; y += len * sy;
        } else if (horiz) {
          x += len * sx;
        } else {
          y += len * sy;
        }
        horiz = !horiz;
        pts.push({ x: x, y: y });
      }
      // segment table so a pulse can be placed at any distance along the trace
      var segs = [], total = 0;
      for (var m = 1; m < pts.length; m++) {
        var ax = pts[m - 1].x, ay = pts[m - 1].y;
        var bx = pts[m].x - ax, by = pts[m].y - ay;
        var L = Math.sqrt(bx * bx + by * by);
        if (L > 0) { segs.push({ x: ax, y: ay, dx: bx, dy: by, L: L }); total += L; }
      }
      var pulses = [];
      if (total > 0 && Math.random() < 0.65) {
        pulses.push({ d0: Math.random() * total, v: rnd(0.045, 0.115) });  // px per ms
      }
      traces.push({
        pts: pts, via: Math.random() < 0.55,
        segs: segs, total: total, pulses: pulses
      });
    }
  }

  function pointAt(tr, dist) {
    var d = dist % tr.total;
    for (var i = 0; i < tr.segs.length; i++) {
      var g = tr.segs[i];
      if (d <= g.L) { var f = d / g.L; return { x: g.x + g.dx * f, y: g.y + g.dy * f }; }
      d -= g.L;
    }
    var e = tr.segs[tr.segs.length - 1];
    return { x: e.x + e.dx, y: e.y + e.dy };
  }

  function drawTraces(a, time) {
    if (a < 0.01) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(' + BLUE + ',' + (0.22 * a).toFixed(3) + ')';
    for (var i = 0; i < traces.length; i++) {
      var pts = traces[i].pts;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
    }
    // pads and vias at the trace ends
    for (var k = 0; k < traces.length; k++) {
      if (!traces[k].via) continue;
      var p = traces[k].pts[traces[k].pts.length - 1];
      ctx.fillStyle = 'rgba(' + BLUE + ',' + (0.4 * a).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.8, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,' + (0.9 * a).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.15, 0, 6.2832); ctx.fill();
    }
    // current running down the traces
    for (var n = 0; n < traces.length; n++) {
      var tr = traces[n];
      if (!tr.segs.length) continue;
      for (var q = 0; q < tr.pulses.length; q++) {
        var pl = tr.pulses[q];
        var at = pointAt(tr, pl.d0 + time * pl.v);
        for (var r = 3; r >= 1; r--) {
          ctx.fillStyle = 'rgba(' + (r === 1 ? WHITE : BLUE) + ',' +
            (a * (r === 1 ? 0.6 : r === 2 ? 0.2 : 0.09)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(at.x, at.y, r * 1.6, 0, 6.2832); ctx.fill();
        }
      }
    }
  }

  /* ---------------------------------------------------------- fibre layer */

  function buildFibres() {
    fibres = [];
    var n = small ? 5 : 9;
    for (var i = 0; i < n; i++) {
      var y0 = rnd(-h * 0.1, h * 1.1);
      var pulses = [];
      var np = 1 + (Math.random() * 2 | 0);
      for (var k = 0; k < np; k++) {
        pulses.push({ t0: Math.random(), v: rnd(0.00013, 0.00032) });
      }
      fibres.push({
        y0: y0,
        y1: y0 + rnd(-h * 0.3, h * 0.3),
        amp: rnd(30, 120),
        k: rnd(1.2, 2.8),
        phase: rnd(0, 6.2832),
        drift: reduced ? 0 : rnd(0.00028, 0.00072),
        pulses: pulses
      });
    }
  }

  function fibreY(f, u, time) {
    return (f.y0 + (f.y1 - f.y0) * u) +
           Math.sin(u * f.k * 6.2832 + f.phase + time * f.drift) * f.amp;
  }

  function drawFibres(a, time) {
    if (a < 0.01) return;
    var STEPS = 44;
    for (var i = 0; i < fibres.length; i++) {
      var f = fibres[i];
      // soft outer sheath, then the bright core
      for (var pass = 0; pass < 2; pass++) {
        ctx.lineWidth = pass === 0 ? 4.5 : 1;
        ctx.strokeStyle = pass === 0
          ? 'rgba(' + BLUE + ',' + (0.05 * a).toFixed(3) + ')'
          : 'rgba(' + ICE  + ',' + (0.16 * a).toFixed(3) + ')';
        ctx.beginPath();
        for (var s = 0; s <= STEPS; s++) {
          var u = s / STEPS, x = u * w, y = fibreY(f, u, time);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // light travelling down the fibre
      for (var q = 0; q < f.pulses.length; q++) {
        var pu = f.pulses[q];
        var pt = (pu.t0 + time * pu.v) % 1;          // advance with time
        var px = pt * w, py = fibreY(f, pt, time);
        for (var r = 3; r >= 1; r--) {
          ctx.fillStyle = 'rgba(' + WHITE + ',' +
            (a * (r === 1 ? 0.55 : r === 2 ? 0.16 : 0.07)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(px, py, r * 1.9, 0, 6.2832); ctx.fill();
        }
      }
    }
  }

  /* ---------------------------------------------------------- LiDAR layer */

  function buildCloud() {
    cloud = [];
    horizon = h * 0.34;
    var rings = small ? 17 : 28;
    var cx = w * 0.5;
    for (var r = 1; r <= rings; r++) {
      var rr = r / rings;
      var sy = horizon + Math.pow(rr, 2.1) * (h - horizon);
      var halfW = Math.pow(rr, 0.85) * w * 0.78;
      // more returns per ring as it widens, so the foreground is not bare
      var per = Math.round((small ? 14 : 20) + rr * (small ? 20 : 38));
      for (var j = 0; j < per; j++) {
        var u = (j / (per - 1)) * 2 - 1;
        var x = cx + u * halfW + rnd(-5, 5);
        var y = sy + rnd(-3, 3);
        if (x < -20 || x > w + 20) continue;
        cloud.push({
          x: x, y: y,
          ang: Math.atan2(y - horizon, x - cx),
          a: 0.22 + rr * 0.5,
          s: rr < 0.4 ? 1 : 1.8
        });
      }
    }
  }

  function drawCloud(a, time) {
    if (a < 0.01) return;
    var sweep = (time * 0.00055) % 6.2832;      // rotating scan line, ~11s/rev
    for (var i = 0; i < cloud.length; i++) {
      var p = cloud[i];
      var d = Math.abs(p.ang - sweep);
      if (d > 3.1416) d = 6.2832 - d;
      var hot = d < 0.34 ? (1 - d / 0.34) : 0;
      var al = (p.a + hot * 0.55) * a;
      ctx.fillStyle = hot > 0.35
        ? 'rgba(' + WHITE + ',' + al.toFixed(3) + ')'
        : 'rgba(' + BLUE  + ',' + al.toFixed(3) + ')';
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
  }

  /* -------------------------------------------------------------- compose */

  function band(t, centre, width) {
    var v = 1 - Math.abs(t - centre) / width;
    return v < 0 ? 0 : v;
  }

  function progress(time) {
    var doc = document.documentElement;
    var span = doc.scrollHeight - doc.clientHeight;
    if (span > 240) return Math.min(1, Math.max(0, window.scrollY / span));
    // page too short to scroll: drift through the three motifs on a slow cycle
    return (Math.sin(time * 0.000055) + 1) / 2;
  }

  function frame() {
    var time = (Date.now() - t0) * motion;
    var t = progress(Date.now() - t0);
    ctx.clearRect(0, 0, w, h);
    drawTraces(band(t, 0.0, 0.45), time);
    drawFibres(band(t, 0.5, 0.40), time);
    drawCloud(band(t, 1.0, 0.45), time);
  }

  function loop() {
    raf = window.requestAnimationFrame(loop);   // queue first: a throw below
    frame();                                    // must not end the animation
  }
  function start() {
    if (raf === null && window.requestAnimationFrame) {
      raf = window.requestAnimationFrame(loop);
    }
  }
  function stop() { if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; } }

  function rebuild() { size(); buildTraces(); buildFibres(); buildCloud(); frame(); }

  rebuild();
  start();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(rebuild, 160);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
