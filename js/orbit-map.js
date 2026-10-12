/* Mapa orbital: cada proyecto es un satélite alrededor de Plutón y, a la vez, un enlace
   a su demo. Un único requestAnimationFrame mueve todo y solo escribe `transform`.
   Con prefers-reduced-motion no hay bucle ni foco rotatorio: el mapa queda quieto. */
(function () {
  "use strict";

  var App = (window.Portfolio = window.Portfolio || {});
  var SVG_NS = "http://www.w3.org/2000/svg";
  var XLINK_NS = "http://www.w3.org/1999/xlink";

  var RINGS = [112, 172, 232]; // radios en unidades del viewBox
  var PERIODS = [95, 150, 215]; // segundos por vuelta
  var SHARE = [2, 3, 4]; // reparto de satélites entre los tres anillos
  var SPOT_MS = 3800; // cada cuánto cambia el proyecto destacado
  var TAU = Math.PI * 2;

  function node(name, attrs, parent) {
    var el = document.createElementNS(SVG_NS, name);
    for (var key in attrs) el.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function reduced() {
    return window.Pluton && window.Pluton.reducedMotion();
  }

  App.createMap = function (options) {
    var stage = options.stage;
    var svg = options.svg;
    var tip = options.tip;
    var tipName = options.tipName;
    var tipText = options.tipText;
    var ringsLayer = svg.querySelector("#map-rings");
    var satsLayer = svg.querySelector("#map-sats");

    var sats = [];
    var tilt = 1;
    var scale = 1; // tamaño de los iconos según el ancho real del mapa
    var size = { w: 1, h: 1, unit: 1, offX: 0, offY: 0 };
    var simTime = 0;
    var lastFrame = 0;
    var frame = 0;
    var compact = false;
    var held = null; // satélite bajo el cursor o con foco: detiene las órbitas
    var spot = null; // satélite destacado por turno
    var spotIndex = -1;
    var spotTimer = 0;

    var ringEls = RINGS.map(function (r) {
      return node("ellipse", { class: "orbit-dashed", rx: r, ry: r }, ringsLayer);
    });

    /* ---------- reparto en anillos ---------- */

    function build(projects) {
      var total = projects.length;
      var perRing = [Math.round((total * SHARE[0]) / 9), Math.round((total * SHARE[1]) / 9), 0];
      perRing[2] = total - perRing[0] - perRing[1];

      var index = 0;
      perRing.forEach(function (count, ring) {
        for (var i = 0; i < count; i++, index++) {
          var project = projects[index];
          var link = node("a", { class: "sat", href: project.demo }, satsLayer);
          link.setAttributeNS(XLINK_NS, "xlink:href", project.demo);
          var body = node("g", { class: "sat-body" }, link);
          node("circle", { class: "sat-halo", r: 25 }, body);
          // Baldosa oscura como la de un icono de app: el favicon se lee igual en ambos temas.
          node("rect", { class: "sat-tile", x: -17, y: -17, width: 34, height: 34, rx: 8 }, body);
          var icon = node("image", { x: -16, y: -16, width: 32, height: 32 }, body);
          icon.setAttribute("href", "assets/icons/" + project.name + ".svg");

          var sat = {
            project: project,
            ring: ring,
            // Medio paso de desfase entre anillos para que no se alineen en radios.
            base: (i / count) * TAU + ring * 0.9,
            el: link,
            body: body,
            x: 0,
            y: 0,
          };
          bind(sat);
          sats.push(sat);
        }
      });
    }

    function bind(sat) {
      sat.el.addEventListener("pointerenter", function (event) {
        if (event.pointerType === "mouse") hold(sat);
      });
      sat.el.addEventListener("pointerleave", function () {
        if (held === sat && document.activeElement !== sat.el) release();
      });
      sat.el.addEventListener("focus", function () {
        hold(sat);
      });
      sat.el.addEventListener("blur", function () {
        if (held === sat) release();
      });
    }

    /* ---------- geometría ---------- */

    function layout() {
      var rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      size.w = rect.width;
      size.h = rect.height;
      tilt = clamp(rect.height / rect.width, 0.5, 1);
      // Píxeles por unidad del viewBox (el SVG se ajusta con "meet") y márgenes de centrado.
      size.unit = Math.min(rect.width / 600, rect.height / (600 * tilt));
      size.offX = (rect.width - 600 * size.unit) / 2;
      size.offY = (rect.height - 600 * tilt * size.unit) / 2;
      // En mapas estrechos los iconos crecen menos y la etiqueta deja de flotar: va fija al pie.
      compact = rect.width < 480;
      stage.classList.toggle("is-compact", compact);
      scale = clamp(1 / size.unit, 1, compact ? 1.4 : 1.7);
      svg.setAttribute("viewBox", "-300 " + -300 * tilt + " 600 " + 600 * tilt);
      ringEls.forEach(function (el, i) {
        el.setAttribute("ry", (RINGS[i] * tilt).toFixed(2));
      });
      sats.forEach(function (sat) {
        sat.body.setAttribute("transform", "scale(" + scale.toFixed(3) + ")");
      });
      draw();
    }

    function draw() {
      for (var i = 0; i < sats.length; i++) {
        var sat = sats[i];
        var angle = sat.base + (simTime / (PERIODS[sat.ring] * 1000)) * TAU;
        sat.x = RINGS[sat.ring] * Math.cos(angle);
        sat.y = RINGS[sat.ring] * Math.sin(angle) * tilt;
        sat.el.setAttribute("transform", "translate(" + sat.x.toFixed(2) + " " + sat.y.toFixed(2) + ")");
      }
      placeTip();
    }

    /* ---------- etiqueta ---------- */

    function shown() {
      return held || spot;
    }

    function fillTip() {
      var sat = shown();
      sats.forEach(function (s) {
        s.el.classList.toggle("is-active", s === sat);
      });
      if (!sat) {
        tip.classList.remove("is-visible");
        return;
      }
      tipName.textContent = sat.project.name;
      tipText.textContent = options.describe(sat.project);
      tip.hidden = false;
      tip.classList.add("is-visible");
      placeTip();
    }

    // La etiqueta es HTML: se coloca con transform sobre el satélite, sin salirse del mapa.
    function placeTip() {
      var sat = shown();
      if (!sat) return;
      if (compact) {
        tip.style.transform = "";
        return;
      }
      var unit = size.unit;
      var px = (sat.x + 300) * unit + size.offX;
      var py = (sat.y + 300 * tilt) * unit + size.offY;
      var half = tip.offsetWidth / 2;
      var gap = 25 * scale * unit + 8;
      var x = clamp(px, half + 4, size.w - half - 4);
      var above = py - gap - tip.offsetHeight > 0;
      var y = above ? py - gap - tip.offsetHeight : py + gap;
      tip.style.transform = "translate(" + (x - half).toFixed(1) + "px," + y.toFixed(1) + "px)";
    }

    function hold(sat) {
      held = sat;
      fillTip();
    }

    function release() {
      held = null;
      fillTip();
    }

    function nextSpot() {
      if (held || document.hidden || !sats.length) return;
      spotIndex = (spotIndex + 1) % sats.length;
      // Recorre los anillos salteando, para que el foco salte de un lado a otro del mapa.
      spot = sats[(spotIndex * 7) % sats.length];
      fillTip();
    }

    /* ---------- bucle ---------- */

    function tick(now) {
      var dt = Math.min(now - lastFrame, 100);
      lastFrame = now;
      if (!held) simTime += dt;
      draw();
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (frame || reduced() || document.hidden || !sats.length) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
      if (!spotTimer) {
        nextSpot();
        spotTimer = window.setInterval(nextSpot, SPOT_MS);
      }
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.clearInterval(spotTimer);
      spotTimer = 0;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if (window.matchMedia) {
      var query = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (query.addEventListener) {
        query.addEventListener("change", function () {
          if (query.matches) {
            stop();
            spot = null;
            fillTip();
          } else {
            start();
          }
        });
      }
    }

    build(options.projects);
    if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);
    else window.addEventListener("resize", layout);
    layout();
    start();

    return {
      // Cambió el idioma: se rehacen los nombres accesibles y la etiqueta visible.
      refresh: function () {
        sats.forEach(function (sat) {
          sat.el.setAttribute("aria-label", sat.project.name + ": " + options.describe(sat.project));
        });
        fillTip();
      },
      count: function () {
        return sats.length;
      },
    };
  };
})();
