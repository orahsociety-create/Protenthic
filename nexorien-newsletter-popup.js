/**
 * Popup de suscripción (marketing) al cargar la home.
 * Usa NxShopify.newsletterSubscribe → Storefront API customerCreate + acceptsMarketing.
 */
(function () {
  if (typeof document === "undefined") return;

  const STORAGE = "nx_nl_popup_session_dismissed";
  /** Foto principal del bloque superior del popup (audífonos / marca). */
  const HERO_BG_URL = "/assets/newsletter-popup-bg.jpg";

  function injectStyles() {
    const existing = document.getElementById("nx-nl-popup-styles");
    if (existing) existing.remove();

    const s = document.createElement("style");
    s.id = "nx-nl-popup-styles";
    s.textContent =
      "#nx-nl-popup{position:fixed;inset:0;z-index:100600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,8,8,0.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity 0.28s ease,visibility 0.28s ease;}" +
      "#nx-nl-popup.is-open{opacity:1;visibility:visible;}" +
      "#nx-nl-popup__dialog{position:relative;width:100%;max-width:460px;margin:0;background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.55);}" +
      "#nx-nl-popup__close{position:absolute;top:12px;right:12px;z-index:20;width:38px;height:38px;border:0;border-radius:999px;background:rgba(0,0,0,0.45);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}" +
      "#nx-nl-popup__close:hover{background:rgba(0,0,0,0.62);color:#fff;}" +
      "#nx-nl-popup__hero{position:relative;height:200px;flex-shrink:0;}" +
      "#nx-nl-popup__hero-bg{position:absolute;inset:0;z-index:0;background-color:#111;background-position:center;background-size:cover;background-repeat:no-repeat;background-image:var(--nx-nl-hero-img);}" +
      "#nx-nl-popup__hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.75));pointer-events:none;}" +
      "#nx-nl-popup__hero-copy{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:16px 18px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;}" +
      "#nx-nl-popup__brand{display:flex;justify-content:center;margin:14px 0 0;pointer-events:none;opacity:0.72;}" +
      "#nx-nl-popup__brand-img{display:block;width:min(72px,48%);height:auto;}" +
      "#nx-nl-popup__eyebrow-row{display:flex;align-items:center;gap:10px;}" +
      "#nx-nl-popup__eyebrow-bar{width:28px;height:3px;background:#E53C2A;border-radius:2px;flex-shrink:0;}" +
      "#nx-nl-popup__eyebrow{font-family:'Montserrat',system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#E53C2A;}" +
      "#nx-nl-popup__headline{margin:0;font-family:'Montserrat',system-ui,sans-serif;font-size:22px;font-weight:500;line-height:1.25;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.45);}" +
      "#nx-nl-popup__body{padding:1.5rem;background:#111;}" +
      "#nx-nl-popup__sub{margin:0 0 1rem;font-family:'Montserrat',system-ui,sans-serif;font-size:14px;line-height:1.45;color:rgba(255,255,255,0.55);}" +
      "#nx-nl-popup__form{display:flex;flex-direction:column;gap:12px;width:100%;}" +
      "#nx-nl-popup__email{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);font-family:'Montserrat',system-ui,sans-serif;font-size:15px;color:#fff;}" +
      "#nx-nl-popup__email::placeholder{color:rgba(255,255,255,0.38);}" +
      "#nx-nl-popup__email:focus{outline:none;border-color:#E53C2A;box-shadow:0 0 0 1px #E53C2A;}" +
      "#nx-nl-popup__submit{width:100%;padding:14px 18px;border-radius:10px;border:0;background:#E53C2A;color:#fff;font-family:'Montserrat',system-ui,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;}" +
      "#nx-nl-popup__submit:hover{background:#c42f1f;}" +
      "#nx-nl-popup__submit:disabled{opacity:0.45;cursor:not-allowed;}" +
      "#nx-nl-popup__fine{margin:12px 0 0;font-family:'Montserrat',system-ui,sans-serif;font-size:12px;line-height:1.35;text-align:center;color:rgba(255,255,255,0.35);}" +
      "#nx-nl-popup__status{margin:14px 0 0;min-height:0;font-family:'Montserrat',system-ui,sans-serif;font-size:13px;font-weight:600;text-align:center;color:#fca5a5;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);}" +
      "#nx-nl-popup__status:empty{display:none;}" +
      "#nx-nl-popup__status.is-ok{color:#86efac;border-color:rgba(34,197,94,0.25);background:rgba(34,197,94,0.08);}" +
      "#nx-nl-popup .nx-nl-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}";
    document.head.appendChild(s);
  }

  function close(root) {
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    try {
      sessionStorage.setItem(STORAGE, "1");
    } catch (_) {}
    document.documentElement.classList.remove("nx-nl-popup-lock");
    document.body.classList.remove("nx-nl-popup-lock");
  }

  function open(root) {
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("nx-nl-popup-lock");
    document.body.classList.add("nx-nl-popup-lock");
    const input = root.querySelector("#nx-nl-popup__email");
    if (input) setTimeout(() => input.focus(), 80);
  }

  function init() {
    try {
      if (sessionStorage.getItem(STORAGE)) return;
    } catch (_) {}

    injectStyles();

    let lockCss = document.getElementById("nx-nl-popup-lock-css");
    if (!lockCss) {
      lockCss = document.createElement("style");
      lockCss.id = "nx-nl-popup-lock-css";
      lockCss.textContent = ".nx-nl-popup-lock{overflow:hidden !important;}";
      document.head.appendChild(lockCss);
    }

    const root = document.createElement("div");
    root.id = "nx-nl-popup";
    root.setAttribute("role", "presentation");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div id="nx-nl-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="nx-nl-popup__headline">' +
      '<button type="button" id="nx-nl-popup__close" aria-label="Cerrar">&times;</button>' +
      '<div id="nx-nl-popup__hero">' +
      '<div id="nx-nl-popup__hero-bg" aria-hidden="true"></div>' +
      '<div id="nx-nl-popup__hero-overlay" aria-hidden="true"></div>' +
      '<div id="nx-nl-popup__hero-copy">' +
      '<div id="nx-nl-popup__eyebrow-row">' +
      '<span id="nx-nl-popup__eyebrow-bar" aria-hidden="true"></span>' +
      '<span id="nx-nl-popup__eyebrow">OFERTA DE BIENVENIDA</span>' +
      "</div>" +
      '<h2 id="nx-nl-popup__headline">10% OFF en tu primera compra</h2>' +
      "</div>" +
      "</div>" +
      '<div id="nx-nl-popup__body">' +
      '<p id="nx-nl-popup__sub">Suscríbete y obtén un 10% de descuento en tu primera compra. Además, serás el primero en conocer ofertas y nuevos lanzamientos.</p>' +
      '<form id="nx-nl-popup__form" novalidate>' +
      '<label class="nx-nl-sr-only" for="nx-nl-popup__email">Correo electrónico</label>' +
      '<input id="nx-nl-popup__email" type="email" name="email" autocomplete="email" inputmode="email" placeholder="tu@correo.com" required />' +
      '<button type="submit" id="nx-nl-popup__submit">SUSCRIBIRSE</button>' +
      "</form>" +
      '<p id="nx-nl-popup__fine">Sin spam. Cancela cuando quieras.</p>' +
      '<div id="nx-nl-popup__brand" aria-hidden="true">' +
      '<img id="nx-nl-popup__brand-img" src="/assets/logo-prothentic-white.png" alt="" decoding="async" />' +
      "</div>" +
      '<p id="nx-nl-popup__status" role="status" aria-live="polite"></p>' +
      "</div>" +
      "</div>";

    document.body.appendChild(root);

    const heroBg = root.querySelector("#nx-nl-popup__hero-bg");
    if (heroBg) heroBg.style.setProperty("--nx-nl-hero-img", 'url("' + HERO_BG_URL + '")');

    const btnClose = root.querySelector("#nx-nl-popup__close");
    const form = root.querySelector("#nx-nl-popup__form");
    const email = root.querySelector("#nx-nl-popup__email");
    const submit = root.querySelector("#nx-nl-popup__submit");
    const status = root.querySelector("#nx-nl-popup__status");

    btnClose.addEventListener("click", () => close(root));
    root.addEventListener("click", (e) => {
      if (e.target === root) close(root);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.classList.contains("is-open")) close(root);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("is-ok");
      const val = String(email.value || "").trim();
      if (!val) {
        status.textContent = "Escribe tu correo.";
        return;
      }
      if (!window.NxShopify || typeof window.NxShopify.newsletterSubscribe !== "function") {
        status.textContent = "Suscripción no disponible (Shopify no configurado).";
        return;
      }
      submit.disabled = true;
      status.textContent = "Enviando…";
      try {
        await window.NxShopify.ready();
        await window.NxShopify.newsletterSubscribe(val);
        status.classList.add("is-ok");
        status.innerHTML =
          "¡Listo! Tu 10% de descuento se aplicará automáticamente en tu primera compra.";
        // Guardar descuento para aplicar al carrito
        if (window.NxShopify && window.NxShopify.savePendingDiscount) {
          window.NxShopify.savePendingDiscount("BIENVENIDO10");
        }
        email.value = "";
        setTimeout(() => close(root), 2200);
      } catch (err) {
        status.textContent = err && err.message ? err.message : "No se pudo completar. Intenta de nuevo.";
      } finally {
        submit.disabled = false;
      }
    });

    requestAnimationFrame(() => open(root));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
