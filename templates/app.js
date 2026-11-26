(function () {
  function press(group, button) {
    group.querySelectorAll(".chip").forEach(function (b) {
      b.setAttribute("aria-pressed", b === button ? "true" : "false");
    });
  }

  var sourceFilter = document.querySelector(".source-filter");
  if (sourceFilter) {
    sourceFilter.addEventListener("click", function (e) {
      var button = e.target.closest(".chip");
      if (!button) return;
      press(sourceFilter, button);
      var source = button.dataset.source;
      var anyShown = false;
      document.querySelectorAll("[data-day]").forEach(function (day) {
        var dayShown = false;
        day.querySelectorAll(".post").forEach(function (post) {
          var show = source === "all" || post.dataset.source === source;
          post.hidden = !show;
          if (show) dayShown = true;
        });
        day.hidden = !dayShown;
        if (dayShown) anyShown = true;
      });
      document.querySelector(".filter-empty").hidden = anyShown;
    });
  }

  var list = document.querySelector(".service-list");
  if (list) {
    var q = document.getElementById("q");
    var category = document.getElementById("category");
    var prefixGroup = document.querySelector(".prefix-filter");
    var shown = document.getElementById("shown");
    var empty = document.querySelector(".services-empty");
    var rows = Array.prototype.slice.call(list.querySelectorAll(".service"));
    var bars = Array.prototype.slice.call(document.querySelectorAll(".year-bar"));
    var yearNote = document.getElementById("year-note");
    var prefix = "all";
    var year = "";

    function setYear(value, scroll) {
      year = year === value ? "" : value;
      bars.forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.year === year ? "true" : "false");
      });
      document.querySelector(".chart figure").classList.toggle("has-selection", !!year);
      yearNote.hidden = !year;
      document.getElementById("year-value").textContent = year;
      apply();
      if (year && scroll) {
        document.getElementById("lookup").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }

    bars.forEach(function (b) {
      b.addEventListener("click", function () { setYear(b.dataset.year, true); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setYear(b.dataset.year, true); }
      });
    });
    document.getElementById("year-clear").addEventListener("click", function () { setYear(year, false); });

    function apply() {
      var terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var cat = category.value;
      var n = 0;
      rows.forEach(function (row) {
        var show = (prefix === "all" || row.dataset.prefix === prefix)
          && (!cat || row.dataset.category === cat)
          && (!year || row.dataset.year === year)
          && terms.every(function (t) { return row.dataset.search.indexOf(t) !== -1; });
        row.hidden = !show;
        if (show) n++;
      });
      shown.textContent = n;
      empty.hidden = n > 0;
    }

    q.addEventListener("input", apply);
    category.addEventListener("change", apply);
    prefixGroup.addEventListener("click", function (e) {
      var button = e.target.closest(".chip");
      if (!button) return;
      press(prefixGroup, button);
      prefix = button.dataset.prefix;
      apply();
    });
    var params = new URLSearchParams(location.search);
    if (params.get("q")) { q.value = params.get("q"); apply(); }
    if (params.get("year")) { setYear(params.get("year"), false); }
  }
})();
