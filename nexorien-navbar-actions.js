/**
 * Acciones del navbar: búsqueda (Storefront API search) y enlace a cuenta Shopify.
 * Carga después de nexorien-shopify.js y nexorien-cart.js.
 */
(function (global) {
  if (typeof document === "undefined") return;

  let overlayEl = null;

  function injectStyles() {
    if (document.getElementById("nx-navbar-actions-styles")) return;
    const s = document.createElement("style");
    s.id = "nx-navbar-actions-styles";
    s.textContent =
      "#nx-search-overlay{position:fixed;inset:0;z-index:100500;display:flex;align-items:flex-start;justify-content:center;padding:72px 16px 24px;background:rgba(15,15,15,0.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}" +
      "#nx-search-overlay[hidden]{display:none!important}" +
      "#nx-search-overlay .nx-so-panel{width:min(560px,100%);max-height:min(72vh,calc(100dvh - 120px));overflow:auto;background:#fff;border-radius:16px;padding:22px 20px 18px;box-shadow:0 24px 60px rgba(0,0,0,0.2);}" +
      "#nx-search-overlay .nx-so-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}" +
      "#nx-search-overlay .nx-so-title{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#111;}" +
      "#nx-search-overlay .nx-so-close{border:0;background:transparent;font-size:28px;line-height:1;cursor:pointer;color:#444;padding:4px 8px;border-radius:8px;}" +
      "#nx-search-overlay .nx-so-close:hover{background:rgba(0,0,0,0.06);}" +
      "#nx-search-overlay .nx-so-row{display:flex;gap:10px;flex-wrap:wrap;}" +
      "#nx-search-overlay .nx-so-input{flex:1;min-width:180px;padding:12px 14px;border:1px solid rgba(0,0,0,0.14);border-radius:12px;font-size:15px;}" +
      "#nx-search-overlay .nx-so-submit{padding:12px 18px;border-radius:12px;border:1px solid #111;background:#111;color:#fff;font-weight:800;font-size:13px;cursor:pointer;}" +
      "#nx-search-overlay .nx-so-submit:disabled{opacity:0.45;cursor:not-allowed;}" +
      "#nx-search-overlay .nx-so-status{margin:14px 0 0;font-size:13px;color:rgba(10,10,10,0.55);min-height:1.2em;}" +
      "#nx-search-overlay .nx-so-list{list-style:none;margin:10px 0 0;padding:0;}" +
      "#nx-search-overlay .nx-so-item{border-top:1px solid rgba(0,0,0,0.06);}" +
      "#nx-search-overlay .nx-so-link{display:flex;align-items:center;gap:12px;padding:12px 4px;text-decoration:none;color:#111;}" +
      "#nx-search-overlay .nx-so-link:hover{background:rgba(0,0,0,0.03);border-radius:10px;}" +
      "#nx-search-overlay .nx-so-thumb{width:44px;height:44px;object-fit:contain;border-radius:8px;background:#f4f4f5;}" +
      "#nx-search-overlay .nx-so-meta{flex:1;min-width:0;}" +
      "#nx-search-overlay .nx-so-name{font-weight:800;font-size:14px;line-height:1.25;}" +
      "#nx-search-overlay .nx-so-price{font-size:13px;color:rgba(10,10,10,0.55);margin-top:2px;}";
    document.head.appendChild(s);
  }

  function customerAccountLoginUrl() {
    const c = global.NxShopify?.getConfigSync?.();
    const d = String(c?.storeDomain || "").trim().replace(/^https?:\/\//, "");
    if (!d) return "";
    return `https://${d}/account/login`;
  }

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    injectStyles();
    const root = document.createElement("div");
    root.id = "nx-search-overlay";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Buscar productos");
    root.hidden = true;
    root.innerHTML =
      '<div class="nx-so-panel" role="document">' +
      '<div class="nx-so-head">' +
      '<h2 class="nx-so-title" id="nx-so-title">Buscar</h2>' +
      '<button type="button" class="nx-so-close" aria-label="Cerrar búsqueda">&times;</button>' +
      "</div>" +
      '<form class="nx-so-form" action="#" method="get">' +
      '<div class="nx-so-row">' +
      '<input class="nx-so-input" type="search" name="q" autocomplete="off" placeholder="Buscar productos…" aria-label="Término de búsqueda" />' +
      '<button type="submit" class="nx-so-submit">Buscar</button>' +
      "</div>" +
      "</form>" +
      '<p class="nx-so-status" id="nx-so-status"></p>' +
      '<ul class="nx-so-list" id="nx-so-list"></ul>' +
      "</div>";

    document.body.appendChild(root);

    const closeBtn = root.querySelector(".nx-so-close");
    const form = root.querySelector(".nx-so-form");
    const input = root.querySelector(".nx-so-input");
    const status = root.querySelector("#nx-so-status");
    const list = root.querySelector("#nx-so-list");
    const submitBtn = root.querySelector(".nx-so-submit");

    function close() {
      root.hidden = true;
      status.textContent = "";
      list.innerHTML = "";
      form.reset();
    }

    closeBtn.addEventListener("click", close);
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !root.hidden) close();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = String(input.value || "").trim();
      if (!q) {
        status.textContent = "Escribe algo para buscar.";
        list.innerHTML = "";
        return;
      }
      if (!global.NxShopify?.searchProducts) {
        status.textContent = "Búsqueda no disponible.";
        return;
      }
      submitBtn.disabled = true;
      status.textContent = "Buscando…";
      list.innerHTML = "";
      try {
        await global.NxShopify.ready();
        const items = await global.NxShopify.searchProducts(q, 24);
        if (!items.length) {
          status.textContent = "No hay resultados para «" + q + "».";
          return;
        }
        status.textContent = items.length + " resultado(s).";
        for (const pr of items) {
          const li = document.createElement("li");
          li.className = "nx-so-item";
          const a = document.createElement("a");
          a.className = "nx-so-link";
          a.href = "./producto.html?handle=" + encodeURIComponent(pr.handle || "");
          const img = document.createElement("img");
          img.className = "nx-so-thumb";
          img.src =
            pr.imageUrl ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect fill='%23eee' width='100%25' height='100%25'/%3E%3C/svg%3E";
          img.alt = "";
          const meta = document.createElement("div");
          meta.className = "nx-so-meta";
          const name = document.createElement("div");
          name.className = "nx-so-name";
          name.textContent = pr.title || "";
          const price = document.createElement("div");
          price.className = "nx-so-price";
          price.textContent = pr.priceFormatted ? "Desde " + pr.priceFormatted : "";
          meta.appendChild(name);
          meta.appendChild(price);
          a.appendChild(img);
          a.appendChild(meta);
          li.appendChild(a);
          list.appendChild(li);
        }
      } catch (err) {
        status.textContent = err && err.message ? String(err.message) : "Error al buscar.";
      } finally {
        submitBtn.disabled = false;
      }
    });

    root._nxOpen = () => {
      root.hidden = false;
      status.textContent = "";
      list.innerHTML = "";
      setTimeout(() => {
        try {
          input.focus();
        } catch (_) {}
      }, 0);
    };

    overlayEl = root;
    return root;
  }

  function bindSearchButtons() {
    document.querySelectorAll('button.nx-icon[aria-label="Buscar"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await global.NxShopify?.ready?.();
        } catch (_) {
          alert("No se pudo cargar la configuración Shopify. Ejecuta npm run dev o revisa el token.");
          return;
        }
        ensureOverlay()._nxOpen();
      });
    });
  }

  function bindAccountButtons() {
    document.querySelectorAll('button.nx-icon[aria-label="Cuenta"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await global.NxShopify?.ready?.();
        } catch (_) {}
        const url = customerAccountLoginUrl();
        if (url) {
          global.location.href = url;
          return;
        }
        alert(
          "No hay dominio de tienda configurado. Añade SHOPIFY_STORE_DOMAIN=tu-tienda.myshopify.com en .env y recarga con npm run dev."
        );
      });
    });
  }

  function init() {
    injectStyles();
    bindSearchButtons();
    bindAccountButtons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);
