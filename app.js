/* Montessori on Wheels · Impact dashboard
   Vanilla JS: count-ups, the scroll-driven bus route, and the hand-drawn bar chart. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceMQ.matches;
  var fmt = new Intl.NumberFormat("en-US");
  var COLORS = { yellow: "#F0B323", coral: "#E2665C", sky: "#9BCBEB", lavender: "#C1A7E2", star: "#FFFFFF" };

  if (!reduced) document.documentElement.classList.add("js-anim");

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- Download summary ---------- */
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  document.querySelectorAll(".js-print").forEach(function (b) {
    // Embedded viewers block the print dialog, so only offer it on the standalone page.
    if (framed) { b.hidden = true; return; }
    b.addEventListener("click", function () { window.print(); });
  });

  /* ---------- Count-ups ---------- */
  var counters = [].slice.call(document.querySelectorAll(".js-count"));
  function showFinal() {
    counters.forEach(function (c) { c.textContent = fmt.format(+c.dataset.value); });
  }
  if (!reduced && "IntersectionObserver" in window) {
    counters.forEach(function (c) {
      c.textContent = "0";
    });
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        var node = e.target, end = +node.dataset.value, t0 = performance.now(), dur = 1400 + Math.min(end, 1500) * .4;
        (function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          node.textContent = fmt.format(Math.round(end * easeOut(p)));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: .6 });
    counters.forEach(function (c) { countIO.observe(c); });
  }
  window.addEventListener("beforeprint", showFinal);

  /* ---------- Bar chart: children reached per program year ---------- */
  var YEARS = [
    { year: "2021", value: 90, partial: true },
    { year: "2022", value: 210, partial: false },
    { year: "2023", value: 260, partial: false },
    { year: "2024", value: 300, partial: false },
    { year: "2025", value: 139, partial: true },
    { year: "2026", value: 130, partial: true }
  ];
  var chart = document.querySelector(".js-chart");
  var plot = chart && chart.querySelector(".js-chart-plot");
  var tip = chart && chart.querySelector(".chart__tip");

  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  function renderChart() {
    if (!plot) return;
    var W = Math.max(280, plot.clientWidth);
    var small = W < 520;
    var H = small ? 300 : 380;
    var m = { t: 40, r: 8, b: 44, l: small ? 34 : 44 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b, max = 500;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, "aria-hidden": "false", focusable: "false" });
    var grid = el("g", { "class": "grid", "aria-hidden": "true" }, svg);
    [0, 125, 250, 375, 500].forEach(function (v) {
      var y = m.t + ih - (v / max) * ih;
      el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, "class": v === 0 ? "base" : "" }, grid);
      var t = el("text", { x: m.l - 10, y: y + 4, "text-anchor": "end", "class": "tick" }, grid);
      t.textContent = v;
    });
    var band = iw / YEARS.length, bw = Math.min(small ? 34 : 64, band * .62);
    YEARS.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2, h = (d.value / max) * ih, y = m.t + ih - h;
      var label = d.year + (d.partial ? ", partial year" : ", full year") + ": " + d.value + " children reached";
      var g = el("g", { "class": "bar", tabindex: "0", role: "img", "aria-label": label, style: "--i:" + i }, svg);
      el("rect", { "class": "hit", x: cx - band / 2 + 2, y: m.t - 10, width: band - 4, height: ih + 10 + m.b - 6, rx: 12 }, g);
      el("path", { "class": "shape", d: topRounded(cx - bw / 2, y, bw, h, small ? 8 : 12), fill: d.partial ? "url(#hatch)" : COLORS.yellow }, g);
      var v = el("text", { "class": "vlab", x: cx, y: y - 10, "aria-hidden": "true" }, g);
      v.textContent = fmt.format(d.value);
      if (small) v.style.fontSize = "19px";
      var xl = el("text", { "class": "xlab", x: cx, y: H - m.b + 28, "aria-hidden": "true" }, g);
      xl.textContent = d.year + (d.partial ? "*" : "");
      if (small) { xl.style.fontSize = W < 360 ? "13px" : "14px"; xl.style.letterSpacing = "-.03em"; }
      var show = function () { showTip(g, d, cx, y); };
      g.addEventListener("pointerenter", show);
      g.addEventListener("focus", show);
      g.addEventListener("click", show);
      g.addEventListener("pointerleave", hideTip);
      g.addEventListener("blur", hideTip);
    });
    plot.innerHTML = "";
    plot.appendChild(svg);
  }
  function showTip(g, d, cx, y) {
    chart.querySelectorAll(".bar.is-on").forEach(function (b) { b.classList.remove("is-on"); });
    g.classList.add("is-on");
    tip.innerHTML = "<strong>" + fmt.format(d.value) + "</strong>children reached in " + d.year +
      "<br>" + (d.partial ? "* Partial year" : "Full year");
    var svg = plot.querySelector("svg");
    var scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    var off = plot.offsetTop;
    tip.style.left = Math.max(80, Math.min(chart.clientWidth - 80, plot.offsetLeft + cx * scale)) + "px";
    tip.style.top = (off + y * scale - 4) + "px";
    tip.classList.add("is-on");
  }
  function hideTip() {
    if (!tip) return;
    tip.classList.remove("is-on");
    chart.querySelectorAll(".bar.is-on").forEach(function (b) { b.classList.remove("is-on"); });
  }
  if (chart) {
    renderChart();
    var lastW = plot.clientWidth;
    window.addEventListener("resize", debounce(function () {
      if (plot.clientWidth !== lastW) { lastW = plot.clientWidth; renderChart(); }
    }, 150));
    if (!reduced && "IntersectionObserver" in window) {
      var chartIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { chart.classList.add("is-in"); chartIO.disconnect(); }
      }, { threshold: .35 });
      chartIO.observe(chart);
    } else {
      chart.classList.add("is-in");
    }
    window.addEventListener("beforeprint", function () { chart.classList.add("is-in"); });
  }

  /* ---------- The MoW route ---------- */
  var route = document.querySelector(".js-route");
  if (route) initRoute(route);

  function initRoute(root) {
    var svg = root.querySelector(".route__svg");
    var items = [].slice.call(root.querySelectorAll(".stop"));
    var MAXV = 1240;
    var state = { path: null, len: 0, stopLens: [], points: [], vertical: false, busLen: 0, active: 0, lockY: null, anim: null };
    var bus, markers = [];

    // Visual weight: marker size and figure size follow the square root of each stop's value.
    items.forEach(function (li) {
      var k = Math.sqrt(+li.dataset.value / MAXV);
      li.style.setProperty("--vsize", (2.1 + 1.6 * k).toFixed(2) + "rem");
    });

    function smoothPath(pts) {
      // Catmull-Rom through points -> cubic Béziers.
      var d = "M" + pts[0][0] + "," + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
      }
      return d;
    }

    // getPointAtLength is slow, so sample the road once into a lookup table.
    var STEP = 8;
    function sample(path, total) {
      var lut = [];
      for (var l = 0; l < total + STEP; l += STEP) {
        var p = path.getPointAtLength(Math.min(l, total));
        lut.push([p.x, p.y]);
      }
      return lut;
    }
    function pointAt(L) {
      var lut = state.lut, f = Math.max(0, Math.min(state.len, L)) / STEP, i = Math.min(lut.length - 2, Math.floor(f)), t = f - i;
      return { x: lut[i][0] + (lut[i + 1][0] - lut[i][0]) * t, y: lut[i][1] + (lut[i + 1][1] - lut[i][1]) * t };
    }
    function nearestLen(pt) {
      var best = 0, bestD = Infinity;
      state.lut.forEach(function (p, i) {
        var dd = (p[0] - pt[0]) * (p[0] - pt[0]) + (p[1] - pt[1]) * (p[1] - pt[1]);
        if (dd < bestD) { bestD = dd; best = i * STEP; }
      });
      return Math.min(best, state.len);
    }

    function build() {
      var W = root.clientWidth, H = root.clientHeight, rb = root.getBoundingClientRect();
      state.vertical = window.matchMedia("(max-width: 899px)").matches;
      var pts = [], stopPts = [];
      var narrow = W < 420;
      // Measure everything before writing to the SVG to avoid forced layouts.
      var rects = items.map(function (li) { return li.getBoundingClientRect(); });
      items.forEach(function (li, i) {
        var r = rects[i];
        if (state.vertical) {
          var x = (narrow ? 34 : 44) + (i % 2 ? 10 : -6);
          stopPts.push([x, r.top - rb.top + Math.min(54, r.height / 2)]);
        } else {
          stopPts.push([r.left - rb.left + r.width / 2, i % 2 ? 150 : 74]);
        }
      });
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.innerHTML = "";
      if (state.vertical) {
        pts.push([stopPts[0][0] + 8, 0]);
        pts = pts.concat(stopPts);
        pts.push([stopPts[stopPts.length - 1][0] - 4, H]);
      } else {
        pts.push([-20, 128]);
        pts = pts.concat(stopPts);
        pts.push([W + 20, 96]);
      }
      var d = smoothPath(pts);
      var roadW = state.vertical ? 30 : 40;
      el("path", { d: d, "class": "road-edge", "stroke-width": roadW + 7 }, svg);
      el("path", { d: d, "class": "road-fill", "stroke-width": roadW }, svg);
      var dash = el("path", { d: d, "class": "road-dash" }, svg);
      state.path = dash;
      state.len = dash.getTotalLength();
      state.points = stopPts;
      state.lut = sample(dash, state.len);
      state.stopLens = stopPts.map(nearestLen);

      // Stop markers sized by scale.
      markers = stopPts.map(function (p, i) {
        var li = items[i], k = Math.sqrt(+li.dataset.value / MAXV);
        var r = state.vertical ? (narrow ? 11 : 13) + (narrow ? 14 : 17) * k : 15 + 27 * k;
        var g = el("g", { "class": "marker", transform: "translate(" + p[0] + "," + p[1] + ")" }, svg);
        if (!state.vertical) {
          // A little signpost from the stop down to its card.
          el("line", { "class": "pole", x1: 0, y1: r + 4, x2: 0, y2: (rects[i].top - rb.top) - p[1] - 6 }, g);
        }
        el("circle", { "class": "dot", r: r, fill: COLORS[li.dataset.color] }, g);
        if (li.dataset.color === "star") {
          el("use", { href: "#i-star", x: -r * .62, y: -r * .62, width: r * 1.24, height: r * 1.24 }, g);
        } else {
          var t = el("text", { "font-size": Math.max(14, r * .95) }, g);
          t.textContent = i + 1;
        }
        g.addEventListener("click", function () { goTo(i, true); });
        return g;
      });

      bus = el("g", { "class": "route-bus" }, svg);
      var bw = state.vertical ? (narrow ? 58 : 66) : 92, bh = bw * 74 / 120;
      el("use", { href: "#i-bus", x: -bw / 2, y: -bh + 8, width: bw, height: bh }, bus);

      if (reduced) {
        state.busLen = state.stopLens[state.active];
      } else if (state.lockY === null) {
        state.busLen = scrollLen();
      } else {
        state.busLen = state.stopLens[state.active];
      }
      placeBus(state.busLen);
      setActive(state.active, false);
    }

    function placeBus(L) {
      if (!state.path || !bus) return;
      L = Math.max(0, Math.min(state.len, L));
      var p = pointAt(L), q = pointAt(L + 6), p0 = pointAt(L - 6);
      var ang = Math.atan2(q.y - p0.y, q.x - p0.x) * 180 / Math.PI;
      if (!state.vertical) ang = Math.max(-28, Math.min(28, ang));
      bus.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
    }

    function scrollLen() {
      // Progress through the section: the bus leaves as the route enters the screen
      // and reaches the last stop as the route's end passes the middle of the screen.
      var r = root.getBoundingClientRect(), vh = window.innerHeight;
      var start = vh * .85, end = vh * .5;
      var total = (r.height + start - end);
      var p = (start - r.top) / total;
      p = Math.max(0, Math.min(1, p));
      var first = state.stopLens[0], last = state.stopLens[state.stopLens.length - 1];
      return p * last + (1 - p) * Math.max(0, first - 90);
    }

    function activeFor(L) {
      var a = 0;
      state.stopLens.forEach(function (s, i) { if (L >= s - 24) a = i; });
      return a;
    }

    function setActive(i, announce) {
      state.active = i;
      items.forEach(function (li, j) {
        var on = j === i;
        li.classList.toggle("is-active", on);
        var btn = li.querySelector(".stop__card");
        if (on) btn.setAttribute("aria-current", "step"); else btn.removeAttribute("aria-current");
        if (markers[j]) markers[j].classList.toggle("is-active", on);
      });
    }

    function goTo(i, fromClick) {
      if (fromClick) state.lockY = window.scrollY;
      setActive(i);
      var target = state.stopLens[i];
      if (reduced) { state.busLen = target; placeBus(target); return; }
      if (state.anim) cancelAnimationFrame(state.anim);
      var from = state.busLen, t0 = performance.now(), dur = Math.min(1400, 450 + Math.abs(target - from) * .9);
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        state.busLen = from + (target - from) * easeInOut(p);
        placeBus(state.busLen);
        if (p < 1) state.anim = requestAnimationFrame(step); else state.anim = null;
      })(t0);
    }

    items.forEach(function (li, i) {
      li.querySelector(".stop__card").addEventListener("click", function () { goTo(i, true); });
    });

    var ticking = false;
    function onScroll() {
      if (reduced || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (state.lockY !== null) {
          if (Math.abs(window.scrollY - state.lockY) < 140) return;
          state.lockY = null;
        }
        if (state.anim) return;
        state.busLen = scrollLen();
        placeBus(state.busLen);
        var a = activeFor(state.busLen);
        if (a !== state.active) setActive(a);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    var lastSize = "";
    var rebuild = debounce(function () {
      var size = root.clientWidth + "x" + root.clientHeight;
      if (size !== lastSize) { lastSize = size; build(); }
    }, 120);
    window.addEventListener("resize", rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastSize = ""; rebuild(); });

    reduceMQ.addEventListener && reduceMQ.addEventListener("change", function (e) {
      reduced = e.matches;
      document.documentElement.classList.toggle("js-anim", !reduced);
      if (reduced) { showFinal(); if (chart) chart.classList.add("is-in"); }
      build();
    });

    build();
    lastSize = root.clientWidth + "x" + root.clientHeight;
  }
})();
