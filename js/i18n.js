/* Textos en español e inglés. El idioma inicial sale de la preferencia guardada o,
   si no hay, del idioma del navegador; el HTML ya trae el español como base. */
(function () {
  "use strict";

  var App = (window.Portfolio = window.Portfolio || {});
  var STORE_KEY = "diegocedenno.github.io:v1";

  var TEXT = {
    es: {
      "status.label": "status",
      "status.text": "{n} proyectos en órbita",
      "lang.switch": "Switch to English",
      "theme.label": "Modo claro",
      "hero.kicker": "systems builder · Caracas, VE",
      "hero.lead":
        "Tomo procesos de un área y los reconstruyo como sistemas replicables: automatización, herramientas internas e infraestructura self-hosted.",
      "hero.cta": "Ver los proyectos",
      "map.label": "Mapa orbital de proyectos",
      "map.hint": "cada satélite es un proyecto",
      "series.title": "Serie Plutón",
      "series.lead":
        "Microapps web de temática espacial, cada una en su propio repo y con demo en vivo: HTML, CSS y JavaScript vanilla, SVG animado, sin build.",
      "filter.label": "Filtrar proyectos",
      "filter.all": "Todos",
      "filter.tool": "Herramientas",
      "filter.sim": "Simuladores",
      "filter.play": "Juegos",
      "count.all": "mostrando: {n} proyectos",
      "count.some": "mostrando: {n} de {total} proyectos",
      "card.demo": "abrir demo →",
      "card.code": "código",
      "card.open": "Abrir la demo de {name}",
      "card.repo": "Código de {name} en GitHub",
      "work.title": "Otros trabajos",
      "work.lead": "Software que resuelve un proceso completo, de punta a punta.",
      "work.code": "ver el código →",
      "ventamas.text":
        "Punto de venta, inventario y clientes para comercios pequeños. Se instala en la computadora del mostrador, funciona sin internet y cobra en bolívares, dólares y euros con la tasa del día.",
      "tags.label": "Tecnologías",
      "about.title": "Con qué trabajo",
      "contact.title": "Contacto",
      "foot.series": "serie Plutón",
      "foot.made": "hecho por",
    },
    en: {
      "status.label": "status",
      "status.text": "{n} projects in orbit",
      "lang.switch": "Cambiar a español",
      "theme.label": "Light mode",
      "hero.kicker": "systems builder · Caracas, VE",
      "hero.lead":
        "I take processes from one domain and rebuild them as replicable systems: automation, internal tools and self-hosted infrastructure.",
      "hero.cta": "See the projects",
      "map.label": "Orbital map of projects",
      "map.hint": "every satellite is a project",
      "series.title": "Plutón series",
      "series.lead":
        "Space-themed micro web apps, each in its own repo with a live demo: vanilla HTML, CSS and JavaScript, animated SVG, no build step.",
      "filter.label": "Filter projects",
      "filter.all": "All",
      "filter.tool": "Tools",
      "filter.sim": "Simulators",
      "filter.play": "Games",
      "count.all": "showing: {n} projects",
      "count.some": "showing: {n} of {total} projects",
      "card.demo": "open demo →",
      "card.code": "code",
      "card.open": "Open the {name} demo",
      "card.repo": "{name} source on GitHub",
      "work.title": "Other work",
      "work.lead": "Software that solves a whole process, end to end.",
      "work.code": "see the code →",
      "ventamas.text":
        "Point of sale, inventory and customers for small shops. It installs on the counter computer, works offline and charges in bolívares, dollars and euros at the day's rate.",
      "tags.label": "Technologies",
      "about.title": "What I work with",
      "contact.title": "Contact",
      "foot.series": "Plutón series",
      "foot.made": "made by",
    },
  };

  function stored() {
    try {
      var data = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
      return data && (data.lang === "es" || data.lang === "en") ? data.lang : null;
    } catch (err) {
      return null;
    }
  }

  function detect() {
    var nav = (window.navigator.language || "es").toLowerCase();
    return nav.indexOf("es") === 0 ? "es" : "en";
  }

  var lang = stored() || detect();
  var listeners = [];

  function t(key, vars) {
    var text = TEXT[lang][key];
    if (text === undefined) text = TEXT.es[key] || key;
    if (vars) {
      for (var name in vars) text = text.replace("{" + name + "}", vars[name]);
    }
    return text;
  }

  // Aplica el idioma al HTML estático: texto (data-i18n) y atributos (data-i18n-attr="attr:clave").
  function apply() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));

    var attrs = document.querySelectorAll("[data-i18n-attr]");
    for (var k = 0; k < attrs.length; k++) {
      var pair = attrs[k].getAttribute("data-i18n-attr").split(":");
      attrs[k].setAttribute(pair[0], t(pair[1]));
    }

    var marks = document.querySelectorAll(".lang-toggle [data-lang]");
    for (var m = 0; m < marks.length; m++) {
      marks[m].classList.toggle("is-current", marks[m].getAttribute("data-lang") === lang);
    }
    listeners.forEach(function (fn) {
      fn(lang);
    });
  }

  function set(next) {
    if (next !== "es" && next !== "en") return;
    lang = next;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang: lang }));
    } catch (err) {
      /* sin almacenamiento: el idioma vale para esta visita */
    }
    apply();
  }

  App.i18n = {
    t: t,
    get: function () {
      return lang;
    },
    set: set,
    toggle: function () {
      set(lang === "es" ? "en" : "es");
    },
    apply: apply,
    onChange: function (fn) {
      listeners.push(fn);
    },
  };
})();
