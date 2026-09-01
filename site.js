/* Mezcal docs: theme toggle and local search.
   Progressive enhancement only. Nothing here is required to read the site,
   and nothing typed here leaves the browser. */
(function () {
  "use strict";

  var root = document.documentElement;
  var STORE = "mezcal-docs-theme";

  function apply(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    var current = root.getAttribute("data-theme");
    button.textContent =
      current === "dark" ? "Light kiln" : current === "light" ? "Dark kiln" : "Kiln";
    button.setAttribute(
      "aria-label",
      current === "dark"
        ? "Switch to the light theme"
        : current === "light"
          ? "Switch to the dark theme"
          : "Switch theme"
    );
  }

  function stored() {
    try {
      return window.localStorage.getItem(STORE);
    } catch (err) {
      return null;
    }
  }

  function prefersDark() {
    return (
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  apply(stored());

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.hidden = false;
    apply(stored());
    toggle.addEventListener("click", function () {
      var now = root.getAttribute("data-theme") || (prefersDark() ? "dark" : "light");
      var next = now === "dark" ? "light" : "dark";
      apply(next);
      try {
        window.localStorage.setItem(STORE, next);
      } catch (err) {
        /* storage blocked: the choice simply does not persist */
      }
    });
  }

  /* ---------------- search ---------------- */

  var input = document.getElementById("site-search");
  var panel = document.getElementById("search-results");
  if (!input || !panel) return;

  var index = null;
  var loading = false;
  var failed = false;

  /* Every page of this site lives at the repository root. */
  function base() {
    return "./";
  }

  function load() {
    if (index || loading || failed) return;
    loading = true;
    fetch(base() + "search-index.json", { credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        index = Array.isArray(data.entries) ? data.entries : [];
        loading = false;
        if (input.value.trim()) render(input.value);
      })
      .catch(function () {
        failed = true;
        loading = false;
        show(
          '<p>The search index could not be loaded. Every page is linked in the footer and in <a href="' +
            base() +
            'llms.txt">llms.txt</a>.</p>'
        );
      });
  }

  function show(html) {
    panel.innerHTML = html;
    panel.hidden = false;
  }

  function hide() {
    panel.hidden = true;
    panel.innerHTML = "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function score(entry, terms) {
    var haystack = (
      entry.title +
      " " +
      entry.page +
      " " +
      entry.text +
      " " +
      (entry.aliases || []).join(" ")
    ).toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (haystack.indexOf(term) === -1) return 0;
      total += 1;
      if (entry.title.toLowerCase().indexOf(term) !== -1) total += 3;
      if ((entry.aliases || []).join(" ").toLowerCase().indexOf(term) !== -1) {
        total += 2;
      }
    }
    return total;
  }

  function render(value) {
    var query = value.trim().toLowerCase();
    if (!query) {
      hide();
      return;
    }
    if (!index) {
      load();
      show("<p>Loading the index...</p>");
      return;
    }
    var terms = query.split(/\s+/).filter(Boolean);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var value2 = score(index[i], terms);
      if (value2 > 0) hits.push({ entry: index[i], score: value2 });
    }
    hits.sort(function (a, b) {
      return b.score - a.score;
    });
    if (!hits.length) {
      show(
        "<p>Nothing matches " +
          escapeHtml(value.trim()) +
          '. Try a field name (<code>edicts</code>, <code>pointer</code>, <code>terms</code>), a rule id (<code>P-4</code>), or a word such as <code>cenotaph</code>.</p>'
      );
      return;
    }
    var html = "";
    for (var j = 0; j < Math.min(hits.length, 12); j++) {
      var hit = hits[j].entry;
      html +=
        '<a href="' +
        base() +
        escapeHtml(hit.url) +
        '"><strong>' +
        escapeHtml(hit.title) +
        "</strong><span>" +
        escapeHtml(hit.page) +
        " &middot; " +
        escapeHtml(hit.text.slice(0, 118)) +
        "</span></a>";
    }
    show(html);
  }

  input.addEventListener("focus", load);
  input.addEventListener("input", function () {
    render(input.value);
  });
  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      input.value = "";
      hide();
      input.blur();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.defaultPrevented) return;
    var tag = (event.target && event.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || event.target.isContentEditable) return;
    event.preventDefault();
    input.focus();
    input.select();
  });

  document.addEventListener("click", function (event) {
    if (!panel.contains(event.target) && event.target !== input) hide();
  });
})();
