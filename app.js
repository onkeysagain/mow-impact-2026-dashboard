/* Montessori on Wheels · Impact dashboards
   Vanilla JS: the self-driving bus scene, count-ups, charts with a year focus,
   the scroll-driven route, and dashboard navigation. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceMQ.matches;
  var fmt = new Intl.NumberFormat("en-US");
  var COLORS = { yellow: "#F0B323", coral: "#E2665C", sky: "#9BCBEB", lavender: "#C1A7E2", star: "#FFFFFF" };
  var PROGRAMS = [
    { name: "Exposure to Montessori", tag: "Access", value: 1240, unit: "children", color: "yellow" },
    { name: "Caregiver & Child", tag: "Family", value: 610, unit: "families", color: "coral" },
    { name: "Targeted Interventions", tag: "Support", value: 180, unit: "children in literacy support", color: "sky" },
    { name: "Community Partnerships", tag: "Village", value: 24, unit: "partner organizations", color: "lavender" },
    { name: "Embedded Learning", tag: "Beyond Denver", value: 3, unit: "partners learning the framework", color: "star" }
  ];
  var YEARS = [
    { year: "2021", value: 90, partial: true },
    { year: "2022", value: 210, partial: false },
    { year: "2023", value: 260, partial: false },
    { year: "2024", value: 300, partial: false },
    { year: "2025", value: 139, partial: true },
    { year: "2026", value: 130, partial: true }
  ];

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
  // getPointAtLength is slow, so each road is sampled once into a lookup table.
  function sampler(path, step) {
    var total = path.getTotalLength(), lut = [];
    for (var l = 0; l < total + step; l += step) {
      var p = path.getPointAtLength(Math.min(l, total));
      lut.push([p.x, p.y]);
    }
    return {
      total: total,
      lut: lut,
      at: function (L) {
        var f = Math.max(0, Math.min(total, L)) / step, i = Math.min(lut.length - 2, Math.floor(f)), t = f - i;
        return { x: lut[i][0] + (lut[i + 1][0] - lut[i][0]) * t, y: lut[i][1] + (lut[i + 1][1] - lut[i][1]) * t };
      },
      nearest: function (test) {
        var best = 0, bestD = Infinity;
        lut.forEach(function (p, i) { var d = test(p); if (d < bestD) { bestD = d; best = i * step; } });
        return Math.min(best, total);
      }
    };
  }

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
  function showFinal() { counters.forEach(function (c) { c.textContent = fmt.format(+c.dataset.value); }); }
  if (!reduced && "IntersectionObserver" in window) {
    counters.forEach(function (c) { c.textContent = "0"; });
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        var node = e.target, end = +node.dataset.value, t0 = performance.now(), dur = 1300 + Math.min(end, 1500) * .4;
        (function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          node.textContent = fmt.format(Math.round(end * easeOut(p)));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: .5 });
    counters.forEach(function (c) { countIO.observe(c); });
  }
  window.addEventListener("beforeprint", showFinal);

  /* ---------- Dashboard navigation ---------- */
  var links = [].slice.call(document.querySelectorAll(".js-navlink"));
  function setCurrent(id) {
    links.forEach(function (a) {
      if (a.dataset.board === id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  setCurrent("overview");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".board").forEach(function (b) { spy.observe(b); });
  }
  document.querySelectorAll(".js-next").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target || reduced) return;
      ev.preventDefault();
      a.classList.add("is-going");
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", a.getAttribute("href"));
      }, 480);
      setTimeout(function () { a.classList.remove("is-going"); }, 1400);
    });
  });

  /* ---------- 01 · The bus scene ---------- */
  var scene = document.querySelector(".js-scene");
  if (scene) initScene(scene);

  function initScene(fig) {
    var svg = fig.querySelector(".scene__art");
    var road = svg.querySelector(".js-scene-road");
    var signsG = svg.querySelector(".js-scene-stops");
    var bus = svg.querySelector(".js-scene-bus");
    var hits = fig.querySelector(".js-scene-hits");
    var bubble = fig.querySelector(".js-bubble");
    var XS = [96, 236, 376, 514, 652];
    var R = sampler(road, 6);
    var stopLens = XS.map(function (x) { return R.nearest(function (p) { return Math.abs(p[0] - x); }); });
    var signs = [], buttons = [];

    stopLens.forEach(function (L, i) {
      var p = R.at(L), prog = PROGRAMS[i], k = Math.sqrt(prog.value / 1240), r = 9 + 6 * k;
      var g = el("g", { "class": "scene__sign", transform: "translate(" + p.x.toFixed(1) + "," + (p.y - 13).toFixed(1) + ")" }, signsG);
      el("line", { x1: 0, y1: 0, x2: 0, y2: -30, stroke: "#1A1A1A", "stroke-width": 3, "stroke-linecap": "round" }, g);
      el("circle", { cx: 0, cy: -30 - r, r: r, fill: COLORS[prog.color], stroke: "#1A1A1A", "stroke-width": 3 }, g);
      if (prog.color === "star") {
        el("use", { href: "#i-star", x: -r * .7, y: -30 - r * 1.7, width: r * 1.4, height: r * 1.4 }, g);
      } else {
        var t = el("text", { x: 0, y: -30 - r }, g);
        t.textContent = i + 1;
      }
      signs.push(g);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "scene__stop";
      b.setAttribute("aria-label", "Stop " + (i + 1) + ": " + prog.name + ", " + prog.tag + ". " + fmt.format(prog.value) + " " + prog.unit + ".");
      b.addEventListener("click", function () { goTo(i); });
      b.addEventListener("focus", function () { goTo(i); });
      hits.appendChild(b);
      buttons.push(b);
    });

    function placeHits() {
      var fr = fig.getBoundingClientRect();
      signs.forEach(function (g, i) {
        var c = g.querySelector("circle").getBoundingClientRect();
        buttons[i].style.left = (c.left + c.width / 2 - fr.left) + "px";
        buttons[i].style.top = (c.top + c.height / 2 - fr.top) + "px";
      });
      if (state.shown >= 0) showBubble(state.shown);
    }

    function showBubble(i) {
      var prog = PROGRAMS[i], fr = fig.getBoundingClientRect();
      var c = signs[i].querySelector("circle").getBoundingClientRect();
      var x = c.left + c.width / 2 - fr.left, y = c.top - fr.top;
      bubble.innerHTML = '<p class="bubble__kicker"><span class="bubble__dot" style="background:' + COLORS[prog.color] + '"></span>Stop ' + (i + 1) + " · " + prog.tag + "</p>" +
        '<p class="bubble__name">' + prog.name.replace("&", "&amp;") + "</p>" +
        '<p class="bubble__fig"><strong>' + fmt.format(prog.value) + "</strong>" + prog.unit + "</p>";
      var w = bubble.offsetWidth || 200;
      var bx = x < w * .55 ? "-12%" : (x > fr.width - w * .55 ? "-88%" : "-50%");
      bubble.style.setProperty("--bx", bx);
      bubble.style.left = x + "px";
      bubble.style.top = y + "px";
      bubble.classList.add("is-on");
      signs.forEach(function (g, j) { g.classList.toggle("is-active", j === i); });
      state.shown = i;
    }
    function hideBubble() {
      bubble.classList.remove("is-on");
      signs.forEach(function (g) { g.classList.remove("is-active"); });
      state.shown = -1;
    }

    var state = { len: 0, idx: -1, target: stopLens[0], phase: "drive", until: 0, dir: 1, shown: -1, manualUntil: 0, running: false, last: 0 };

    function placeBus(L) {
      var p = R.at(L), q = R.at(L + 5), o = R.at(L - 5);
      var a = Math.atan2(q.y - o.y, q.x - o.x) * 180 / Math.PI;
      a = Math.max(-16, Math.min(16, a));
      bus.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ") rotate(" + a.toFixed(1) + ")" + (state.dir < 0 ? " scale(-1 1)" : ""));
    }

    function goTo(i) {
      state.manualUntil = performance.now() + 9000;
      if (reduced) { state.len = stopLens[i]; state.idx = i; placeBus(state.len); showBubble(i); return; }
      hideBubble();
      state.idx = i - 1;
      state.target = stopLens[i];
      state.next = i;
      state.phase = "drive";
      state.dir = state.target >= state.len ? 1 : -1;
      bus.classList.add("is-driving");
      wake();
    }

    function frame(now) {
      if (!state.running) { state.raf = null; return; }
      var dt = Math.min(.05, (now - (state.last || now)) / 1000);
      state.last = now;
      if (state.phase === "wait") {
        if (now >= state.until && now >= state.manualUntil) {
          hideBubble();
          var n = state.idx + 1;
          state.next = n;
          state.target = n < stopLens.length ? stopLens[n] : R.total;
          state.dir = 1;
          state.phase = "drive";
          bus.classList.add("is-driving");
        }
      } else {
        var dist = state.target - state.len;
        var speed = 150 * Math.min(1, .18 + Math.abs(dist) / 70);
        var step = Math.sign(dist) * Math.min(Math.abs(dist), speed * dt);
        state.len += step;
        if (Math.abs(state.target - state.len) < .5) {
          state.len = state.target;
          bus.classList.remove("is-driving");
          if (state.next >= stopLens.length) {
            state.len = 0; state.idx = -1; state.next = 0; state.target = stopLens[0]; state.dir = 1;
            bus.classList.add("is-driving");
          } else {
            state.idx = state.next;
            state.dir = 1;
            state.phase = "wait";
            state.until = now + 2600;
            showBubble(state.idx);
          }
        }
      }
      placeBus(state.len);
      state.raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (reduced || !state.running || state.raf) return;
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    }

    placeHits();
    if (reduced) {
      state.len = stopLens[0]; state.idx = 0; placeBus(state.len); showBubble(0);
    } else {
      state.next = 0;
      placeBus(0);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          state.running = entries[0].isIntersecting && !document.hidden;
          wake();
        }, { threshold: .2 }).observe(fig);
      } else { state.running = true; wake(); }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) state.running = false;
        else { var r = fig.getBoundingClientRect(); state.running = r.bottom > 0 && r.top < innerHeight; wake(); }
      });
    }
    if ("ResizeObserver" in window) new ResizeObserver(debounce(placeHits, 100)).observe(fig);
    else window.addEventListener("resize", debounce(placeHits, 100));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeHits);
  }

  /* ---------- Charts: children reached per program year ---------- */
  var focus = {
    year: document.querySelector(".js-focus-year"),
    value: document.querySelector(".js-focus-value"),
    type: document.querySelector(".js-focus-type")
  };
  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }
  document.querySelectorAll(".js-chart").forEach(function (root) { initChart(root); });

  function initChart(root) {
    var plot = root.querySelector(".js-chart-plot");
    var tip = root.querySelector(".chart__tip");
    var mode = root.dataset.mode;
    var selected = 3;

    function render() {
      var W = Math.max(240, plot.clientWidth), H = Math.max(160, plot.clientHeight);
      var m = { t: 26, r: 4, b: 26, l: 34 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b, max = 500;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, focusable: "false" });
      var grid = el("g", { "class": "grid", "aria-hidden": "true" }, svg);
      [0, 125, 250, 375, 500].forEach(function (v) {
        var y = m.t + ih - (v / max) * ih;
        el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, "class": v === 0 ? "base" : "" }, grid);
        var t = el("text", { x: m.l - 8, y: y + 4, "text-anchor": "end", "class": "tick" }, grid);
        t.textContent = v;
      });
      var band = iw / YEARS.length, bw = Math.min(W < 420 ? 30 : 48, band * .58);
      YEARS.forEach(function (d, i) {
        var cx = m.l + band * i + band / 2, h = (d.value / max) * ih, y = m.t + ih - h;
        var label = d.year + (d.partial ? ", partial year" : ", full year") + ": " + d.value + " children reached";
        var g = el("g", { "class": "bar" + (mode === "focus" && i === selected ? " is-on" : ""), tabindex: "0", role: "img", "aria-label": label, style: "--i:" + i }, svg);
        el("rect", { "class": "hit", x: cx - band / 2 + 2, y: m.t - 8, width: band - 4, height: ih + 8 + m.b - 2, rx: 10 }, g);
        el("path", { "class": "shape", d: topRounded(cx - bw / 2, y, bw, h, 9), fill: d.partial ? "url(#hatch)" : "url(#g-bar)" }, g);
        var v = el("text", { "class": "vlab", x: cx, y: y - 8, "aria-hidden": "true" }, g);
        v.textContent = fmt.format(d.value);
        var xl = el("text", { "class": "xlab", x: cx, y: H - m.b + 18, "aria-hidden": "true" }, g);
        xl.textContent = d.year + (d.partial ? "*" : "");
        if (mode === "focus") {
          var pick = function () { select(i); };
          g.addEventListener("click", pick);
          g.addEventListener("focus", pick);
          g.addEventListener("pointerenter", pick);
        } else {
          var show = function () { showTip(g, d, cx, y); };
          g.addEventListener("pointerenter", show);
          g.addEventListener("focus", show);
          g.addEventListener("click", show);
          g.addEventListener("pointerleave", hideTip);
          g.addEventListener("blur", hideTip);
        }
      });
      plot.innerHTML = "";
      plot.appendChild(svg);
    }
    function select(i) {
      selected = i;
      root.querySelectorAll(".bar").forEach(function (b, j) { b.classList.toggle("is-on", j === i); });
      var d = YEARS[i];
      if (focus.year) {
        focus.year.textContent = d.year + (d.partial ? "*" : "");
        focus.value.textContent = fmt.format(d.value);
        focus.type.textContent = d.partial ? "* Partial year" : "Full year";
      }
    }
    function showTip(g, d, cx, y) {
      root.querySelectorAll(".bar.is-on").forEach(function (b) { b.classList.remove("is-on"); });
      g.classList.add("is-on");
      tip.innerHTML = "<strong>" + fmt.format(d.value) + "</strong>children reached in " + d.year + "<br>" + (d.partial ? "* Partial year" : "Full year");
      tip.style.left = Math.max(70, Math.min(root.clientWidth - 70, plot.offsetLeft + cx)) + "px";
      tip.style.top = (plot.offsetTop + y - 4) + "px";
      tip.classList.add("is-on");
    }
    function hideTip() {
      tip.classList.remove("is-on");
      root.querySelectorAll(".bar.is-on").forEach(function (b) { b.classList.remove("is-on"); });
    }

    render();
    var lastSz = plot.clientWidth + "x" + plot.clientHeight;
    var maybe = debounce(function () {
      var sz = plot.clientWidth + "x" + plot.clientHeight;
      if (sz !== lastSz) { lastSz = sz; render(); }
    }, 120);
    if ("ResizeObserver" in window) new ResizeObserver(maybe).observe(plot);
    else window.addEventListener("resize", maybe);
    if (!reduced && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { root.classList.add("is-in"); io.disconnect(); }
      }, { threshold: .3 });
      io.observe(root);
    } else {
      root.classList.add("is-in");
    }
    window.addEventListener("beforeprint", function () { root.classList.add("is-in"); });
  }

  /* ---------- 02 · The MoW route ---------- */
  var route = document.querySelector(".js-route");
  if (route) initRoute(route);

  function initRoute(root) {
    var svg = root.querySelector(".route__svg");
    var stopsEl = root.querySelector(".stops");
    var items = [].slice.call(root.querySelectorAll(".stop"));
    var MAXV = 1240;
    var state = { R: null, stopLens: [], vertical: false, busLen: 0, active: 0, lockY: null, anim: null };
    var bus, markers = [];

    // Visual weight: marker size and figure size follow the square root of each stop's value.
    items.forEach(function (li) {
      var k = Math.sqrt(+li.dataset.value / MAXV);
      li.style.setProperty("--vsize", (1.5 + 1.1 * k).toFixed(2) + "em");
    });

    function smoothPath(pts) {
      var d = "M" + pts[0][0] + "," + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
      }
      return d;
    }

    function build() {
      var W = root.clientWidth, H = root.clientHeight, rb = root.getBoundingClientRect();
      state.vertical = window.matchMedia("(max-width: 860px)").matches;
      var band = parseFloat(getComputedStyle(stopsEl).paddingTop) || 160;
      var narrow = W < 420;
      // Measure everything before writing to the SVG to avoid forced layouts.
      var rects = items.map(function (li) { return li.getBoundingClientRect(); });
      var stopPts = rects.map(function (r, i) {
        if (state.vertical) return [(narrow ? 32 : 40) + (i % 2 ? 9 : -5), r.top - rb.top + Math.min(52, r.height / 2)];
        return [r.left - rb.left + r.width / 2, band * (i % 2 ? .62 : .3)];
      });
      var pts;
      if (state.vertical) pts = [[stopPts[0][0] + 8, 0]].concat(stopPts, [[stopPts[4][0] - 4, H]]);
      else pts = [[-10, band * .5]].concat(stopPts, [[W + 10, band * .4]]);

      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.innerHTML = "";
      var d = smoothPath(pts), roadW = state.vertical ? 26 : 34;
      el("path", { d: d, "class": "road-edge", "stroke-width": roadW + 6 }, svg);
      el("path", { d: d, "class": "road-fill", "stroke-width": roadW }, svg);
      var dash = el("path", { d: d, "class": "road-dash" }, svg);
      state.R = sampler(dash, 8);
      state.stopLens = stopPts.map(function (pt) {
        return state.R.nearest(function (p) { return (p[0] - pt[0]) * (p[0] - pt[0]) + (p[1] - pt[1]) * (p[1] - pt[1]); });
      });

      markers = stopPts.map(function (p, i) {
        var li = items[i], k = Math.sqrt(+li.dataset.value / MAXV);
        var r = state.vertical ? (narrow ? 11 : 12) + (narrow ? 12 : 15) * k : 13 + 21 * k;
        var g = el("g", { "class": "marker", transform: "translate(" + p[0] + "," + p[1] + ")" }, svg);
        if (!state.vertical) el("line", { "class": "pole", x1: 0, y1: r + 4, x2: 0, y2: (rects[i].top - rb.top) - p[1] - 6 }, g);
        el("circle", { "class": "dot", r: r, fill: COLORS[li.dataset.color] }, g);
        if (li.dataset.color === "star") {
          el("use", { href: "#i-star", x: -r * .62, y: -r * .62, width: r * 1.24, height: r * 1.24 }, g);
        } else {
          var t = el("text", { "font-size": Math.max(12, r * .8) }, g);
          t.textContent = i + 1;
        }
        g.addEventListener("click", function () { goTo(i, true); });
        return g;
      });

      bus = el("g", { "class": "route-bus" }, svg);
      var bw = state.vertical ? (narrow ? 54 : 62) : 84, bh = bw * 74 / 120;
      el("use", { href: "#i-bus", x: -bw / 2, y: -bh + 8, width: bw, height: bh }, bus);

      state.busLen = (reduced || state.lockY !== null) ? state.stopLens[state.active] : scrollLen();
      placeBus(state.busLen);
      setActive(state.active);
    }

    function placeBus(L) {
      if (!state.R || !bus) return;
      var p = state.R.at(L), q = state.R.at(L + 6), o = state.R.at(L - 6);
      var ang = Math.atan2(q.y - o.y, q.x - o.x) * 180 / Math.PI;
      if (!state.vertical) ang = Math.max(-26, Math.min(26, ang));
      bus.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
    }
    function scrollLen() {
      var r = root.getBoundingClientRect(), vh = window.innerHeight;
      var start = vh * .85, end = vh * .45;
      var p = Math.max(0, Math.min(1, (start - r.top) / (r.height + start - end)));
      var first = state.stopLens[0], last = state.stopLens[state.stopLens.length - 1];
      return p * last + (1 - p) * Math.max(0, first - 80);
    }
    function activeFor(L) {
      var a = 0;
      state.stopLens.forEach(function (s, i) { if (L >= s - 24) a = i; });
      return a;
    }
    function setActive(i) {
      state.active = i;
      items.forEach(function (li, j) {
        var on = j === i, btn = li.querySelector(".stop__card");
        li.classList.toggle("is-active", on);
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
        state.anim = p < 1 ? requestAnimationFrame(step) : null;
      })(t0);
    }
    items.forEach(function (li, i) {
      li.querySelector(".stop__card").addEventListener("click", function () { goTo(i, true); });
    });

    var ticking = false;
    window.addEventListener("scroll", function () {
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
    }, { passive: true });

    var lastSize = "";
    var rebuild = debounce(function () {
      var size = root.clientWidth + "x" + root.clientHeight;
      if (size !== lastSize) { lastSize = size; build(); }
    }, 120);
    if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(root);
    else window.addEventListener("resize", rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastSize = ""; rebuild(); });
    build();
    lastSize = root.clientWidth + "x" + root.clientHeight;
  }

  reduceMQ.addEventListener && reduceMQ.addEventListener("change", function (e) {
    if (e.matches) { reduced = true; document.documentElement.classList.remove("js-anim"); showFinal(); }
  });
})();
