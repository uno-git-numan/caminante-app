/* Grid de experiencias EN VIVO desde la BD (/caminante/api/experiences).
   Se activa en cualquier .exp-grid con data-exp-grid:
     data-exp-grid=""                  → todas las publicadas (home #proximos)
     data-exp-grid="Estado de México"  → solo las de ese estado (página de destino)
   Reconstruye las tarjetas .exp con el MISMO markup del diseño y conserva la
   tarjeta "Próximamente" (.exp.slot) al final. Si el API falla o no hay
   experiencias, se queda el contenido estático como fallback. */
(function () {
  var grids = document.querySelectorAll("[data-exp-grid]");
  if (!grids.length) return;

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  function buildCard(c) {
    var art = el("article", "exp");
    var ph = el("div", "ph");
    var img = document.createElement("img");
    img.src = c.image;
    img.alt = c.imageAlt || c.title;
    img.loading = "lazy";
    ph.appendChild(img);
    ph.appendChild(el("span", "loc", c.ploc || c.estado || ""));
    art.appendChild(ph);

    var inn = el("div", "in");
    inn.appendChild(el("h3", null, c.title));

    // Satisfacción real (★ promedio) o "Experiencia nueva" si aún no hay encuestas.
    var rate = el("div");
    rate.style.cssText = "display:flex;align-items:center;gap:7px;margin:8px 0 2px;line-height:1;";
    if (c.rating && c.rating.stars) {
      var st = el("span", null, "★ " + Number(c.rating.stars).toFixed(1));
      st.style.cssText = "color:#ff5d36;font-weight:600;font-size:14px;";
      rate.appendChild(st);
      var n = c.rating.count;
      var cnt = el("span", null, n === 1 ? "1 opinión" : n + " opiniones");
      cnt.style.cssText = "color:#637154;font-size:12.5px;";
      rate.appendChild(cnt);
    } else {
      var nu = el("span", null, "Experiencia nueva");
      nu.style.cssText =
        "font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#637154;background:rgba(99,113,84,.12);border-radius:999px;padding:4px 10px;";
      rate.appendChild(nu);
    }
    inn.appendChild(rate);

    var faces = el("div", "faces");
    ["Naturaleza", "Conservación", "Comunidades", "Problemas"].forEach(function (f) {
      var face = el("span", "face");
      face.appendChild(el("span", "dia", "◆"));
      face.appendChild(document.createTextNode(f));
      faces.appendChild(face);
    });
    inn.appendChild(faces);
    if (c.hook) inn.appendChild(el("p", "hook", c.hook));
    var a = el("a", "btn btn-outline btn-arrow", "Vivir esta experiencia");
    a.href = "/caminante/experiencias/" + encodeURIComponent(c.slug);
    inn.appendChild(a);
    art.appendChild(inn);
    return art;
  }

  fetch("/caminante/api/experiences", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data) return;
      var all = (data.experiences || []).filter(function (c) {
        return c && c.slug && c.title && c.image;
      });
      // próximas primero (startDate asc); sin fecha al final
      all.sort(function (a, b) {
        return (a.startDate || "9999").localeCompare(b.startDate || "9999");
      });
      grids.forEach(function (grid) {
        var estado = grid.getAttribute("data-exp-grid") || "";
        var cards = estado
          ? all.filter(function (c) { return (c.estado || "") === estado; })
          : all;
        if (!cards.length) return; // fallback: se queda lo estático
        var slot = grid.querySelector(".exp.slot"); // tarjeta "Próximamente"
        grid.querySelectorAll("article.exp:not(.slot)").forEach(function (n) { n.remove(); });
        cards.forEach(function (c) {
          var card = buildCard(c);
          if (slot) grid.insertBefore(card, slot);
          else grid.appendChild(card);
        });
      });
    })
    .catch(function () { /* fallback: contenido estático */ });
})();
