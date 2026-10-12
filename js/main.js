/* Página: tarjetas de proyectos, filtro por tipo, idioma y arranque del mapa. */
(function () {
  "use strict";

  var App = window.Portfolio;
  var i18n = App.i18n;
  var projects = App.projects || [];

  var els = {
    cards: document.getElementById("cards"),
    count: document.getElementById("count"),
    status: document.getElementById("status-text"),
    lang: document.getElementById("lang"),
    filters: document.querySelector(".filters"),
  };

  var filter = "all";

  function describe(project) {
    return i18n.get() === "es" ? project.es : project.en;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- tarjetas ---------- */

  function card(project) {
    var article = el("article", "card panel");
    article.dataset.kind = project.kind;
    article.dataset.name = project.name;

    var shot = el("div", "card-shot");
    var img = document.createElement("img");
    img.src = "assets/thumbs/" + project.name + ".jpg";
    img.alt = "";
    img.width = 640;
    img.height = 400;
    img.loading = "lazy";
    img.decoding = "async";
    shot.appendChild(img);
    if (project.series > 1) shot.appendChild(el("span", "card-badge mono", "serie " + project.series));

    var body = el("div", "card-body");
    var title = el("h3", "card-name mono");
    var icon = document.createElement("img");
    icon.src = "assets/icons/" + project.name + ".svg";
    icon.alt = "";
    icon.width = 22;
    icon.height = 22;
    var open = el("a", "card-open", project.name);
    open.href = project.demo;
    title.appendChild(icon);
    title.appendChild(open);

    var text = el("p", "card-text");
    var links = el("p", "card-links mono");
    var demo = el("span", "card-demo");
    var code = el("a", "card-code");
    code.href = project.repo;
    links.appendChild(demo);
    links.appendChild(code);

    body.appendChild(title);
    body.appendChild(text);
    body.appendChild(links);
    article.appendChild(shot);
    article.appendChild(body);

    project.refs = { article: article, open: open, text: text, demo: demo, code: code };
    return article;
  }

  function translateCards() {
    projects.forEach(function (project) {
      var refs = project.refs;
      refs.text.textContent = describe(project);
      refs.demo.textContent = i18n.t("card.demo");
      refs.code.textContent = i18n.t("card.code");
      refs.open.setAttribute("aria-label", i18n.t("card.open", { name: project.name }));
      refs.code.setAttribute("aria-label", i18n.t("card.repo", { name: project.name }));
    });
  }

  function applyFilter() {
    var visible = 0;
    projects.forEach(function (project) {
      var show = filter === "all" || project.kind === filter;
      project.refs.article.hidden = !show;
      if (show) visible++;
    });
    var buttons = els.filters.querySelectorAll("[data-filter]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].dataset.filter === filter));
    }
    els.count.textContent =
      visible === projects.length
        ? i18n.t("count.all", { n: visible })
        : i18n.t("count.some", { n: visible, total: projects.length });
  }

  projects.forEach(function (project) {
    els.cards.appendChild(card(project));
  });

  els.filters.addEventListener("click", function (event) {
    var button = event.target.closest("[data-filter]");
    if (!button) return;
    filter = button.dataset.filter;
    applyFilter();
  });

  /* ---------- mapa ---------- */

  var map = App.createMap({
    stage: document.getElementById("map"),
    svg: document.getElementById("map-svg"),
    tip: document.getElementById("map-tip"),
    tipName: document.getElementById("map-tip-name"),
    tipText: document.getElementById("map-tip-text"),
    projects: projects,
    describe: describe,
  });

  /* ---------- idioma ---------- */

  i18n.onChange(function () {
    els.status.textContent = i18n.t("status.text", { n: projects.length });
    translateCards();
    applyFilter();
    map.refresh();
  });

  els.lang.addEventListener("click", function (event) {
    if (event.detail > 0) els.lang.blur();
    i18n.toggle();
  });

  i18n.apply();
})();
