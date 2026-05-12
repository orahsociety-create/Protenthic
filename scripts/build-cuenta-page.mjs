/**
 * One-off / regen helper: merges index.html navbar (home) into cuenta.html.
 * Run from repo root: node scripts/build-cuenta-page.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const idxPath = path.join(root, "index.html");
const outPath = path.join(root, "cuenta.html");

const lines = fs.readFileSync(idxPath, "utf8").split(/\r?\n/);

const navHtml = lines
  .slice(28, 471)
  .join("\n")
  .replace(
    `<button class="nx-icon" type="button" aria-label="Cuenta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>`,
    `<a class="nx-icon" href="./cuenta.html" aria-label="Cuenta" aria-current="page">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </a>`
  )
  .replace(
    `<header id="nexorien-navbar" class="nx-navbar" role="banner">`,
    `<header id="nexorien-navbar" class="nx-navbar nx-navbar--light" role="banner">`
  );

const dividerAndMobile = lines.slice(471, 484).join("\n");

const navbarInit = `
      // 1) Promotion bar carousel
      (function () {
        const bar = document.getElementById("announcement-bar");
        const el = document.getElementById("ann-message");
        const prevBtn = document.getElementById("ann-prev");
        const nextBtn = document.getElementById("ann-next");
        if (!bar || !el || !prevBtn || !nextBtn) return;

        const messages = [
          "los mejores suplemenos de las mejores marcas",
          "entregas rapidas a todo el pais",
        ];

        let i = 0;
        let timer = null;
        const dur = 300;

        const render = (nextIndex, direction) => {
          i = (nextIndex + messages.length) % messages.length;
          el.style.transition = \`opacity \${dur}ms ease, transform \${dur}ms ease\`;
          el.style.opacity = "0";
          el.style.transform = \`translateX(\${direction > 0 ? "-8px" : "8px"})\`;
          setTimeout(() => {
            el.textContent = messages[i];
            el.style.opacity = "1";
            el.style.transform = "translateX(0)";
          }, dur);
        };

        const start = () => {
          stop();
          timer = setInterval(() => render(i + 1, 1), 4200);
        };
        const stop = () => {
          if (timer) clearInterval(timer);
          timer = null;
        };

        prevBtn.addEventListener("click", () => {
          render(i - 1, -1);
          start();
        });
        nextBtn.addEventListener("click", () => {
          render(i + 1, 1);
          start();
        });
        bar.addEventListener("mouseenter", stop);
        bar.addEventListener("mouseleave", start);
        el.textContent = messages[0];
        start();
      })();

      // 1c) Mega menús — productos Shopify
      NxShopify.initMegaCollections();

      window.addEventListener("scroll", function () {
        const navbar = document.getElementById("nexorien-navbar");
        const divider = document.querySelector(".navbar-divider");
        const bar = document.getElementById("announcement-bar");
        if (!navbar) return;

        const atTop = window.scrollY === 0;

        if (window.scrollY > 80) {
          navbar.classList.add("scrolled");
          if (divider) divider.style.opacity = "0";
        } else {
          navbar.classList.remove("scrolled");
          if (divider) divider.style.opacity = "1";
        }

        if (bar) {
          if (atTop) {
            bar.classList.remove("is-hidden");
            navbar.style.top = "";
            if (divider) divider.style.top = "";
            document.documentElement.style.setProperty("--nx-mega-top", "");
          } else {
            bar.classList.add("is-hidden");
            navbar.style.top = "0";
            if (divider) divider.style.top = "68px";
            document.documentElement.style.setProperty("--nx-mega-top", "68px");
          }
        }
      });

      (function () {
        const overlay = document.getElementById("nx-mobile-menu");
        const openBtn = document.querySelector(".nx-hamburger");
        const closeBtn = document.getElementById("nx-mobile-close");
        const links = Array.from(document.querySelectorAll(".nx-mobile-link"));

        if (!overlay || !openBtn || !closeBtn) return;

        const open = () => {
          overlay.classList.add("open");
          overlay.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        };

        const close = () => {
          overlay.classList.remove("open");
          overlay.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        };

        openBtn.addEventListener("click", open);
        closeBtn.addEventListener("click", close);
        links.forEach((a) => a.addEventListener("click", close));
      })();
`;

const css = `
    body.nx-page-cuenta {
      --nx-acc-bg: #ebebeb;
      --nx-acc-fg: #111;
      --nx-acc-muted: #6b7280;
      --nx-acc-border: #d4d4d4;
      --nx-acc-card: #ffffff;
      --nx-acc-ann-h: 40px;
      --nx-acc-nav-h: 68px;
      --nx-acc-below-header-gap: 28px;
      --nx-acc-shell-pad-top: calc(var(--nx-acc-ann-h) + var(--nx-acc-nav-h) + var(--nx-acc-below-header-gap));
      background: var(--nx-acc-bg);
    }

    /* Navbar: siempre opaco sobre fondo claro (evita “transparente” y texto montado) */
    body.nx-page-cuenta #nexorien-navbar.nx-navbar {
      background: #ffffff !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
    }

    body.nx-page-cuenta #nexorien-navbar.nx-navbar.scrolled {
      background: #ffffff !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
      box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06);
    }

    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-navbar__link,
    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-icon,
    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-hamburger {
      color: rgba(10, 10, 18, 0.72);
    }

    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-navbar__link:hover,
    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-icon:hover,
    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-hamburger:hover {
      color: rgba(10, 10, 18, 1);
    }

    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-navbar__logo-img--default {
      display: block !important;
    }

    body.nx-page-cuenta #nexorien-navbar.scrolled .nx-navbar__logo-img--inverse {
      display: none !important;
    }

    body.nx-page-cuenta .navbar-divider {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(0, 0, 0, 0.08) 30%,
        rgba(0, 0, 0, 0.08) 70%,
        transparent 100%
      );
    }

    /* Enlace cuenta con mismo tratamiento visual que botones del navbar */
    a.nx-icon {
      text-decoration: none;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    main.nx-acc-shell {
      box-sizing: border-box;
      min-height: 100vh;
      padding: var(--nx-acc-shell-pad-top) 20px 48px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      font-family: var(--font-body, "Montserrat", system-ui, sans-serif);
      color: var(--nx-acc-fg);
      margin: 0;
    }

    /* Card (login / registro) — inspiración minimal clara */
    .nx-acc-card {
      max-width: 420px;
      margin: 0 auto;
      background: var(--nx-acc-card);
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 18px 48px rgba(0, 0, 0, 0.07);
      padding: 42px 36px 32px;
    }

    .nx-acc-card--register {
      max-width: 440px;
    }

    .nx-acc-heading {
      margin: 0 0 8px;
      text-align: center;
      font-size: 1.375rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--nx-acc-fg);
      font-family: var(--font-body, "Montserrat", system-ui, sans-serif);
    }

    .nx-acc-sub {
      margin: 0 0 28px;
      text-align: center;
      font-size: 13px;
      color: var(--nx-acc-muted);
      line-height: 1.45;
    }

    .nx-acc-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .nx-acc-input {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      border: 1px solid var(--nx-acc-border);
      border-radius: 6px;
      background: #fff;
      color: var(--nx-acc-fg);
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .nx-acc-input:focus {
      border-color: #111;
      box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
    }

    .nx-acc-input::placeholder {
      color: #9ca3af;
    }

    .nx-acc-grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Botón principal sutil — negro suave como referencia */
    .nx-acc-btn-primary {
      width: 100%;
      margin-top: 6px;
      padding: 13px 20px;
      border: none;
      border-radius: 6px;
      background: #111;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: background 0.18s ease, opacity 0.18s ease;
    }

    .nx-acc-btn-primary:hover {
      background: #2d2d2d;
    }

    .nx-acc-btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: #111;
    }

    .nx-acc-link-quiet {
      display: inline;
      align-self: flex-start;
      margin-top: -4px;
      padding: 0;
      border: none;
      background: none;
      font-size: 13px;
      color: var(--nx-acc-muted);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
      font-family: inherit;
    }

    .nx-acc-link-quiet:hover {
      color: var(--nx-acc-fg);
    }

    .nx-acc-foot {
      margin: 26px 0 0;
      text-align: center;
      font-size: 14px;
      color: var(--nx-acc-muted);
    }

    .nx-acc-switch {
      padding: 0;
      margin: 0;
      border: none;
      background: none;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: #111;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }

    .nx-acc-alert {
      display: none;
      padding: 11px 14px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.35;
      margin-bottom: 16px;
    }

    .nx-acc-alert.nx-acc-alert--show {
      display: block;
    }

    .nx-acc-alert--error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .nx-acc-alert--success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
    }

    /* Dashboard — minimal monocromo (Montserrat) */
    .nx-acc-dash-min {
      max-width: 560px;
      margin: 0 auto;
      font-family: var(--font-body, "Montserrat", system-ui, sans-serif);
    }

    .nx-acc-dash-minirow {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: center;
      gap: 10px 20px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #444;
    }

    .nx-acc-dash-greet-line {
      font-weight: 500;
    }

    .nx-acc-dash-greet-line strong {
      font-weight: 700;
      color: #111;
    }

    .nx-acc-dash-email {
      color: #6b7280;
      font-size: 12px;
    }

    .nx-acc-logout-text {
      margin-left: auto;
      padding: 0;
      border: none;
      background: none;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      color: #111;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }

    .nx-acc-logout-text:hover {
      opacity: 0.7;
    }

    .nx-acc-subnav {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0 28px;
      padding: 14px 16px 0;
      margin: 0 -12px 8px;
      background: #f0f0f0;
      border-radius: 0;
    }

    .nx-acc-subnav__btn {
      padding: 10px 4px 12px;
      border: none;
      background: none;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      color: #555;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s ease, border-color 0.15s ease;
    }

    .nx-acc-subnav__btn:hover {
      color: #111;
    }

    .nx-acc-subnav__btn.is-active {
      font-weight: 700;
      color: #111;
      border-bottom-color: #111;
    }

    .nx-acc-page-head {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 28px 0 32px;
      flex-wrap: wrap;
    }

    .nx-acc-page-title {
      margin: 0;
      font-size: clamp(26px, 5vw, 34px);
      font-weight: 600;
      letter-spacing: -0.03em;
      color: #111;
      text-align: center;
    }

    .nx-acc-page-badge {
      flex-shrink: 0;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #111;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }

    .nx-acc-page-badge[hidden] {
      display: none !important;
    }

    .nx-acc-dash-panel[hidden] {
      display: none !important;
    }

    /* Tarjetas dirección / perfil */
    .nx-acc-addr-card {
      max-width: 420px;
      margin: 0 auto 14px;
      padding: 22px 24px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .nx-acc-addr-label {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
      color: #111;
    }

    .nx-acc-addr-lines {
      margin: 0;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.55;
      color: #333;
      white-space: pre-line;
    }

    .nx-acc-addr-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .nx-acc-text-link {
      padding: 0;
      border: none;
      background: none;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: #111;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }

    .nx-acc-text-link:hover {
      opacity: 0.65;
    }

    .nx-acc-actions-foot {
      display: flex;
      justify-content: center;
      margin-top: 36px;
      margin-bottom: 48px;
    }

    .nx-acc-btn-solid {
      min-width: 200px;
      padding: 14px 28px;
      border: none;
      border-radius: 2px;
      background: #111;
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .nx-acc-btn-solid:hover {
      background: #333;
    }

    .nx-acc-btn-solid:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .nx-acc-profile-sheet {
      max-width: 420px;
      margin: 0 auto;
      padding: 22px 24px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .nx-acc-min-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 0;
      border-bottom: 1px solid #eee;
    }

    .nx-acc-min-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .nx-acc-min-row:first-child {
      padding-top: 0;
    }

    .nx-acc-min-k {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #888;
    }

    .nx-acc-min-v {
      font-size: 15px;
      color: #111;
      line-height: 1.4;
    }

    .nx-acc-phone-add-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-top: 8px;
    }

    #profile-phone-alert {
      margin: 10px 0 0;
    }

    .nx-acc-input--profile-phone {
      flex: 1 1 200px;
      min-width: 0;
      margin-bottom: 0;
    }

    .nx-acc-btn-profile-phone {
      min-width: auto;
      padding: 12px 22px;
      font-size: 13px;
    }

    /* Pedidos — limpio, sin chips de color */
    .nx-acc-order {
      max-width: 420px;
      margin: 0 auto 16px;
      padding: 22px 24px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
    }

    .nx-acc-order-head {
      margin-bottom: 14px;
    }

    .nx-acc-order-num {
      font-weight: 700;
      font-size: 15px;
      color: #111;
    }

    .nx-acc-order-meta {
      display: block;
      font-size: 12px;
      color: #777;
      margin-top: 4px;
    }

    .nx-acc-order-statusline {
      font-size: 12px;
      color: #555;
      margin-top: 6px;
      letter-spacing: 0.02em;
    }

    .nx-acc-line-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid #f0f0f0;
    }

    .nx-acc-line-item:first-of-type {
      border-top: none;
      padding-top: 0;
    }

    .nx-acc-line-item img {
      width: 44px;
      height: 44px;
      border-radius: 2px;
      object-fit: cover;
      border: 1px solid #eee;
    }

    .nx-acc-line-title {
      font-size: 14px;
      font-weight: 500;
      color: #111;
    }

    .nx-acc-line-qty {
      font-size: 12px;
      color: #777;
      margin-top: 2px;
    }

    .nx-acc-order-total {
      text-align: right;
      font-weight: 700;
      padding-top: 14px;
      margin-top: 10px;
      border-top: 1px solid #eee;
      font-size: 15px;
      color: #111;
    }

    .nx-acc-empty {
      max-width: 420px;
      margin: 0 auto;
      text-align: center;
      padding: 36px 20px;
      color: #777;
      font-size: 14px;
      line-height: 1.5;
      background: #fff;
      border: 1px dashed #ccc;
      border-radius: 2px;
    }

    .nx-acc-empty-order {
      max-width: 420px;
      margin: 0 auto;
      padding: 40px 24px 36px;
      text-align: center;
      background: #fff;
      border: 1px dashed #c8c8c8;
      border-radius: 2px;
    }

    .nx-acc-empty-order__visual {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 22px;
    }

    .nx-acc-empty-order__box {
      width: 92px;
      height: 92px;
      color: #111;
    }

    .nx-acc-empty-order__box path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .nx-acc-empty-order__badge {
      position: absolute;
      top: -8px;
      right: -10px;
      min-width: 28px;
      height: 28px;
      padding: 0 7px;
      border-radius: 999px;
      background: #111;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-sizing: border-box;
    }

    .nx-acc-empty-order__msg {
      margin: 0 auto 26px;
      max-width: 300px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.55;
      color: #555;
    }

    .nx-acc-empty-order__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 208px;
      padding: 14px 28px;
      border-radius: 2px;
      background: #111;
      color: #fff !important;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-decoration: none;
      transition: background 0.15s ease;
    }

    .nx-acc-empty-order__cta:hover {
      background: #333;
      color: #fff !important;
    }

    @media (max-width: 640px) {
      .nx-acc-dash-minirow {
        flex-direction: column;
        align-items: center;
      }

      .nx-acc-logout-text {
        margin-left: 0;
      }

      .nx-acc-subnav {
        gap: 0 18px;
        padding-inline: 8px;
      }

      .nx-acc-subnav__btn {
        font-size: 13px;
      }
    }

    /* Recover modal — minimal light */
    .nx-acc-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 100600;
      background: rgba(0, 0, 0, 0.45);
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .nx-acc-overlay.show {
      display: flex;
    }

    .nx-acc-dialog {
      background: #fff;
      border-radius: 12px;
      padding: 32px 28px;
      width: min(400px, 100%);
      box-shadow: 0 28px 64px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .nx-acc-dialog h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--nx-acc-fg);
    }

    .nx-acc-dialog p {
      margin: 0 0 22px;
      font-size: 14px;
      color: var(--nx-acc-muted);
      line-height: 1.5;
    }

    .nx-acc-dialog-hint {
      margin: -4px 0 16px !important;
      font-size: 12px !important;
      color: #888 !important;
    }

    .nx-acc-dialog--wide {
      width: min(480px, 96vw);
      max-height: min(88vh, 720px);
      overflow-y: auto;
      text-align: left;
    }

    .nx-acc-adr-form .nx-acc-grid2 {
      margin-bottom: 0;
    }

    .nx-acc-adr-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 6px;
    }

    .nx-acc-stack--tight .nx-acc-input {
      margin-bottom: 0;
    }

    .nx-acc-adr-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 22px;
      flex-wrap: wrap;
    }

    .nx-acc-btn-secondary {
      padding: 12px 20px;
      border-radius: 2px;
      border: 1px solid #c4c4c4;
      background: #fff;
      color: #111;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .nx-acc-btn-secondary:hover {
      background: #f8f8f8;
      border-color: #999;
    }

    #nx-address-modal .nx-acc-btn-solid {
      min-width: auto;
    }

    button.nx-acc-btn-solid[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
    }

    [data-view] {
      display: none !important;
    }
    [data-view].active {
      display: block !important;
    }

    body.nx-page-cuenta main.nx-acc-shell > [data-view="auth"].active {
      display: flex !important;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1 1 auto;
      width: 100%;
      min-height: 0;
    }

    body.nx-page-cuenta main.nx-acc-shell > [data-view="dashboard"].active {
      display: block !important;
      flex: 1 0 auto;
      width: 100%;
      max-width: 640px;
      align-self: center;
      padding-top: 8px;
    }

    @media (max-width: 768px) {
      body.nx-page-cuenta {
        --nx-acc-ann-h: 34px;
        --nx-acc-nav-h: 56px;
        --nx-acc-below-header-gap: 20px;
      }
    }

    @media (max-width: 640px) {
      .nx-acc-card {
        padding: 32px 22px;
      }

      main.nx-acc-shell {
        padding-left: 16px;
        padding-right: 16px;
      }

      .nx-acc-grid2 {
        grid-template-columns: 1fr;
      }
    }

    /* compat: grid perfil antiguo si quedara en DOM */
    .nx-acc-profile-grid {
      grid-template-columns: 1fr;
    }

    body.nx-page-cuenta .nx-icon[aria-current="page"] {
      opacity: 1;
    }
`;

const accountScript = `
  (async function () {
    await NxShopify.ready();

    const loginPane = document.getElementById("nx-acc-login-pane");
    const registerPane = document.getElementById("nx-acc-register-pane");
    const alertLogin = document.getElementById("auth-alert");
    const alertReg = document.getElementById("auth-alert-reg");

    document.getElementById("nx-show-register").addEventListener("click", () => {
      loginPane.hidden = true;
      registerPane.hidden = false;
      hideAlert(alertLogin);
      hideAlert(alertReg);
    });
    document.getElementById("nx-show-login").addEventListener("click", () => {
      registerPane.hidden = true;
      loginPane.hidden = false;
      hideAlert(alertLogin);
      hideAlert(alertReg);
    });

    function showAlert(el, msg, type) {
      el.textContent = msg;
      el.className = \`nx-acc-alert nx-acc-alert--\${type} nx-acc-alert--show\`;
    }

    function hideAlert(el) {
      el.className = "nx-acc-alert";
    }

    function showView(name) {
      document.querySelectorAll("[data-view]").forEach((v) => v.classList.remove("active"));
      const el = document.querySelector(\`[data-view="\${name}"]\`);
      if (el) el.classList.add("active");
    }

    document.getElementById("btn-login").addEventListener("click", async () => {
      const email = document.getElementById("login-email").value.trim();
      const pass = document.getElementById("login-pass").value;
      if (!email || !pass) return showAlert(alertLogin, "Completa todos los campos.", "error");
      try {
        document.getElementById("btn-login").disabled = true;
        await NxShopify.customerLogin(email, pass);
        await loadDashboard();
        showView("dashboard");
      } catch (e) {
        showAlert(alertLogin, e.message || "Error al iniciar sesión.", "error");
      } finally {
        document.getElementById("btn-login").disabled = false;
      }
    });

    document.getElementById("btn-register").addEventListener("click", async () => {
      const firstName = document.getElementById("reg-first").value.trim();
      const lastName = document.getElementById("reg-last").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-pass").value;
      if (!firstName || !email || !password)
        return showAlert(alertReg, "Completa los campos requeridos.", "error");
      if (password.length < 6)
        return showAlert(alertReg, "La contraseña debe tener al menos 6 caracteres.", "error");
      try {
        document.getElementById("btn-register").disabled = true;
        await NxShopify.customerRegister({ firstName, lastName, email, password });
        await NxShopify.customerLogin(email, password);
        await loadDashboard();
        showView("dashboard");
      } catch (e) {
        showAlert(alertReg, e.message || "Error al crear la cuenta.", "error");
      } finally {
        document.getElementById("btn-register").disabled = false;
      }
    });

    document.getElementById("btn-logout").addEventListener("click", async () => {
      await NxShopify.customerLogout();
      loginPane.hidden = false;
      registerPane.hidden = true;
      showView("auth");
    });

    const recoverModal = document.getElementById("recover-modal");
    const recoverAlert = document.getElementById("recover-alert");
    document.getElementById("btn-forgot").addEventListener("click", () => {
      recoverModal.classList.add("show");
      hideAlert(recoverAlert);
    });
    document.getElementById("btn-recover-close").addEventListener("click", () => {
      recoverModal.classList.remove("show");
    });
    recoverModal.addEventListener("click", (e) => {
      if (e.target === recoverModal) recoverModal.classList.remove("show");
    });
    document.getElementById("btn-recover-send").addEventListener("click", async () => {
      const email = document.getElementById("recover-email").value.trim();
      if (!email) return showAlert(recoverAlert, "Escribe tu email.", "error");
      try {
        await NxShopify.customerRecover(email);
        showAlert(recoverAlert, "¡Email enviado! Revisa tu bandeja.", "success");
      } catch (e) {
        showAlert(recoverAlert, e.message || "Error al enviar.", "error");
      }
    });

    const dashCounts = { orders: 0, addresses: 0 };

    /** id de GraphQL → nodo dirección (último render de Direcciones). */
    let addressesById = Object.create(null);

    const addressModal = document.getElementById("nx-address-modal");
    const adrForm = document.getElementById("nx-address-form");
    const adrAlert = document.getElementById("nx-adr-alert");
    const adrTitle = document.getElementById("nx-adr-title");
    const adrEditIdEl = document.getElementById("nx-adr-edit-id");
    const adrSaveBtn = document.getElementById("nx-adr-save");

    function escapeHtml(s) {
      const d = document.createElement("div");
      d.textContent = s == null ? "" : String(s);
      return d.innerHTML;
    }

    function escapeAttr(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
    }

    function openAddressModal(mode, addr) {
      hideAlert(adrAlert);
      adrForm.reset();
      adrEditIdEl.value = "";
      if (mode === "edit" && addr && addr.id) {
        adrTitle.textContent = "Editar dirección";
        adrEditIdEl.value = addr.id;
        document.getElementById("adr-first").value = addr.firstName || "";
        document.getElementById("adr-last").value = addr.lastName || "";
        document.getElementById("adr-line1").value = addr.address1 || "";
        document.getElementById("adr-line2").value = addr.address2 || "";
        document.getElementById("adr-city").value = addr.city || "";
        document.getElementById("adr-province").value = addr.province || "";
        document.getElementById("adr-zip").value = addr.zip || "";
        document.getElementById("adr-country").value = addr.country || "";
        document.getElementById("adr-phone").value = addr.phone || "";
      } else {
        adrTitle.textContent = "Añadir dirección";
      }
      addressModal.classList.add("show");
    }

    function closeAddressModal() {
      addressModal.classList.remove("show");
      hideAlert(adrAlert);
    }

    document.getElementById("nx-adr-cancel").addEventListener("click", () => closeAddressModal());
    addressModal.addEventListener("click", (e) => {
      if (e.target === addressModal) closeAddressModal();
    });

    adrForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert(adrAlert);
      const payload = {
        firstName: document.getElementById("adr-first").value.trim(),
        lastName: document.getElementById("adr-last").value.trim(),
        address1: document.getElementById("adr-line1").value.trim(),
        address2: document.getElementById("adr-line2").value.trim(),
        city: document.getElementById("adr-city").value.trim(),
        province: document.getElementById("adr-province").value.trim(),
        zip: document.getElementById("adr-zip").value.trim(),
        country: document.getElementById("adr-country").value.trim(),
        phone: document.getElementById("adr-phone").value.trim(),
      };
      const editId = adrEditIdEl.value.trim();
      try {
        adrSaveBtn.disabled = true;
        if (editId) await NxShopify.customerAddressUpdate(editId, payload);
        else await NxShopify.customerAddressCreate(payload);
        closeAddressModal();
        await loadDashboard();
        setDashTab("addresses");
      } catch (err) {
        showAlert(adrAlert, err.message || "No se pudo guardar la dirección.", "error");
      } finally {
        adrSaveBtn.disabled = false;
      }
    });

    document.getElementById("btn-add-address-placeholder").addEventListener("click", () => openAddressModal("add"));

    function addrPlain(a) {
      if (!a) return "";
      const p1 = [a.address1, a.address2].filter(Boolean).join(", ");
      const p2 = [a.city, a.province, a.zip].filter(Boolean).join(", ");
      const p3 = a.country || "";
      return [p1, p2, p3].filter(Boolean).join("\\n");
    }

    function addrLinesHtml(a) {
      return addrPlain(a)
        .split("\\n")
        .map((ln) => escapeHtml(ln))
        .join("<br />");
    }

    function translateStatus(s) {
      const map = {
        PAID: "Pagado",
        PENDING: "Pendiente",
        REFUNDED: "Reembolsado",
        PARTIALLY_PAID: "Pago parcial",
      };
      return map[s] || s || "—";
    }

    function translateFulfill(s) {
      const map = {
        FULFILLED: "Enviado",
        UNFULFILLED: "Sin enviar",
        PARTIALLY_FULFILLED: "Envío parcial",
      };
      return map[s] || s || "Sin enviar";
    }

    function setDashTab(tab) {
      const titles = { orders: "Pedidos", addresses: "Direcciones", profile: "Mi perfil" };
      document.querySelectorAll(".nx-acc-subnav__btn").forEach((b) =>
        b.classList.toggle("is-active", b.getAttribute("data-dash-tab") === tab),
      );
      ["orders", "addresses", "profile"].forEach((id) => {
        const el = document.getElementById("nx-dash-panel-" + id);
        if (el) el.toggleAttribute("hidden", id !== tab);
      });
      const h = document.getElementById("nx-dash-heading");
      if (h) h.textContent = titles[tab] || "";
      const badge = document.getElementById("nx-dash-badge");
      if (badge) {
        if (tab === "profile") {
          badge.hidden = true;
        } else {
          badge.hidden = false;
          badge.textContent = String(tab === "orders" ? dashCounts.orders : dashCounts.addresses);
        }
      }
    }

    document.querySelectorAll("[data-dash-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setDashTab(btn.getAttribute("data-dash-tab")));
    });

    document.getElementById("addresses-list").addEventListener("click", async (ev) => {
      const editBtn = ev.target.closest(".nx-acc-addr-edit");
      const delBtn = ev.target.closest(".nx-acc-addr-del");
      const defaultBtn = ev.target.closest(".nx-acc-addr-default");
      const btn = editBtn || delBtn || defaultBtn;
      if (!btn) return;
      ev.preventDefault();
      const id = btn.getAttribute("data-address-id");
      if (!id) return;

      if (editBtn) {
        const addr = addressesById[id];
        if (!addr) {
          window.alert(
            "No se encontraron los datos de esta dirección. Recarga la página e inténtalo de nuevo.",
          );
          return;
        }
        openAddressModal("edit", addr);
        return;
      }

      if (delBtn) {
        if (!window.confirm("¿Eliminar esta dirección de tu cuenta?")) return;
        try {
          await NxShopify.customerAddressDelete(id);
          await loadDashboard();
          setDashTab("addresses");
        } catch (err) {
          window.alert(err.message || "No se pudo eliminar.");
        }
        return;
      }

      if (defaultBtn) {
        try {
          await NxShopify.customerDefaultAddressUpdate(id);
          await loadDashboard();
          setDashTab("addresses");
        } catch (err) {
          window.alert(err.message || "No se pudo actualizar la dirección principal.");
        }
      }
    });

    async function loadDashboard() {
      const customer = await NxShopify.getCustomer();
      if (!customer) {
        showView("auth");
        return;
      }

      const greet = document.getElementById("dash-greet-name");
      if (greet) greet.textContent = customer.firstName || "Cliente";
      const emEl = document.getElementById("dash-email-mini");
      if (emEl) emEl.textContent = customer.email || "";

      const nm = ((customer.firstName || "") + " " + (customer.lastName || "")).trim();
      const phoneRaw = customer.phone;
      const hasPhone = !!(phoneRaw && String(phoneRaw).trim());
      const phoneSection = hasPhone
        ? '<div class="nx-acc-min-row">' +
          '<span class="nx-acc-min-k">Teléfono</span>' +
          '<span class="nx-acc-min-v">' +
          escapeHtml(String(phoneRaw).trim()) +
          "</span></div>"
        : '<div class="nx-acc-min-row">' +
          '<span class="nx-acc-min-k">Teléfono</span>' +
          '<div id="profile-phone-alert" class="nx-acc-alert" role="alert"></div>' +
          '<div class="nx-acc-phone-add-row">' +
          '<input class="nx-acc-input nx-acc-input--profile-phone" type="tel" id="profile-phone-input" autocomplete="tel" placeholder="+57…" aria-label="Teléfono" />' +
          '<button type="button" class="nx-acc-btn-solid nx-acc-btn-profile-phone" id="btn-profile-phone-save">Guardar</button>' +
          "</div>" +
          "</div>";

      document.getElementById("profile-card").innerHTML =
        '<div class="nx-acc-profile-sheet">' +
        '<div class="nx-acc-min-row"><span class="nx-acc-min-k">Nombre</span><span class="nx-acc-min-v">' +
        escapeHtml(nm || "—") +
        "</span></div>" +
        '<div class="nx-acc-min-row"><span class="nx-acc-min-k">Email</span><span class="nx-acc-min-v">' +
        escapeHtml(customer.email || "—") +
        "</span></div>" +
        phoneSection +
        "</div>";

      if (!hasPhone) {
        const phoneAlertEl = document.getElementById("profile-phone-alert");
        const phoneInputEl = document.getElementById("profile-phone-input");
        const btnPhoneSave = document.getElementById("btn-profile-phone-save");
        hideAlert(phoneAlertEl);
        const submitProfilePhone = async () => {
          const v = phoneInputEl.value.trim();
          if (!v) return showAlert(phoneAlertEl, "Introduce tu teléfono.", "error");
          hideAlert(phoneAlertEl);
          try {
            btnPhoneSave.disabled = true;
            await NxShopify.customerUpdate({ phone: v });
            await loadDashboard();
            setDashTab("profile");
          } catch (e) {
            showAlert(phoneAlertEl, e.message || "No se pudo guardar el teléfono.", "error");
          } finally {
            btnPhoneSave.disabled = false;
          }
        };
        btnPhoneSave.addEventListener("click", () => submitProfilePhone());
        phoneInputEl.addEventListener("keydown", (ke) => {
          if (ke.key === "Enter") {
            ke.preventDefault();
            submitProfilePhone();
          }
        });
      }

      const defaultId = customer.defaultAddress?.id;
      let nodes = (customer.addresses?.edges || []).map((e) => e.node).filter(Boolean);
      if (!nodes.length && customer.defaultAddress) nodes = [customer.defaultAddress];
      dashCounts.addresses = nodes.length;

      addressesById = Object.create(null);
      nodes.forEach((node) => {
        if (node && node.id) addressesById[node.id] = node;
      });

      const addrBox = document.getElementById("addresses-list");
      if (!nodes.length) {
        addrBox.innerHTML =
          '<div class="nx-acc-empty">No tienes direcciones guardadas todavía.</div>';
      } else {
        const sep = '<span class="nx-acc-addr-sep" aria-hidden="true"> · </span>';
        addrBox.innerHTML = nodes
          .map((a) => {
            const isDef = defaultId && a.id === defaultId;
            const label = isDef ? "Dirección principal" : "Dirección";
            const body = addrLinesHtml(a);
            const idAttr = escapeAttr(a.id);
            const mkDefault =
              !isDef
                ? sep +
                  '<button type="button" class="nx-acc-text-link nx-acc-addr-default" data-address-id="' +
                  idAttr +
                  '">Marcar principal</button>'
                : "";
            return (
              '<article class="nx-acc-addr-card">' +
              '<p class="nx-acc-addr-label">' +
              escapeHtml(label) +
              "</p>" +
              '<p class="nx-acc-addr-lines">' +
              body +
              "</p>" +
              '<div class="nx-acc-addr-actions">' +
              '<button type="button" class="nx-acc-text-link nx-acc-addr-edit" data-address-id="' +
              idAttr +
              '">Editar</button>' +
              sep +
              '<button type="button" class="nx-acc-text-link nx-acc-addr-del" data-address-id="' +
              idAttr +
              '">Eliminar</button>' +
              mkDefault +
              "</div></article>"
            );
          })
          .join("");
      }

      const orders = customer.orders?.edges?.map((e) => e.node) || [];
      dashCounts.orders = orders.length;
      const container = document.getElementById("orders-list");

      if (!orders.length) {
        const n = dashCounts.orders;
        container.innerHTML =
          '<div class="nx-acc-empty-order" role="status">' +
          '<div class="nx-acc-empty-order__visual">' +
          '<span class="nx-acc-empty-order__badge">' +
          escapeHtml(String(n)) +
          "</span>" +
          '<svg class="nx-acc-empty-order__box" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<path d="M25 54 L52 72 L79 54 L52 36 Z" stroke-width="2"/>' +
          '<path d="M25 38 L52 56 L79 38 L52 21 Z" stroke-width="2"/>' +
          '<path d="M52 56 L52 72" stroke-width="2"/>' +
          '<path d="M32 61 Q52 63 71 61" stroke-width="1.3" opacity=".42"/>' +
          "</svg>" +
          "</div>" +
          '<p class="nx-acc-empty-order__msg">Aún no tienes pedidos. Cuando compres, aparecerán aquí.</p>' +
          '<a class="nx-acc-empty-order__cta" href="./todos-los-productos.html">Seguir comprando</a>' +
          "</div>";
      } else {
        container.innerHTML = orders
          .map((o) => {
            const date = new Date(o.processedAt).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const statusLine =
              translateStatus(o.financialStatus) +
              " · " +
              translateFulfill(o.fulfillmentStatus || "UNFULFILLED");
            const items = o.lineItems?.edges?.map((e) => e.node) || [];
            const total = NxShopify.money(o.totalPrice?.amount, o.totalPrice?.currencyCode);

            return \`
          <article class="nx-acc-order">
            <div class="nx-acc-order-head">
              <span class="nx-acc-order-num">\${escapeHtml(o.name || "#" + o.orderNumber)}</span>
              <span class="nx-acc-order-meta">\${escapeHtml(date)}</span>
              <div class="nx-acc-order-statusline">\${escapeHtml(statusLine)}</div>
            </div>
            \${items
              .map((it) => {
                const imgHtml = it.variant?.image?.url
                  ? \`<img src="\${String(it.variant.image.url)}" alt="" width="44" height="44" />\`
                  : "";
                return \`
                <div class="nx-acc-line-item">
                  \${imgHtml}
                  <div>
                    <div class="nx-acc-line-title">\${escapeHtml(it.title || "")}</div>
                    <div class="nx-acc-line-qty">Cantidad · \${escapeHtml(String(it.quantity || 0))}</div>
                  </div>
                </div>\`;
              })
              .join("")}
            <div class="nx-acc-order-total">\${escapeHtml(total)}</div>
          </article>\`;
          })
          .join("");
      }

      setDashTab("orders");
    }

    if (NxShopify.isLoggedIn()) {
      const customer = await NxShopify.getCustomer();
      if (customer) {
        await loadDashboard();
        showView("dashboard");
      }
    }
  })();
`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mi cuenta — PROTHENTIC</title>
  <meta name="description" content="Accede o crea tu cuenta PROTHENTIC." />
  <link rel="icon" type="image/png" href="/assets/isotipo-prothentic-red.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&display=swap"
    rel="stylesheet"
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="./nexorien-design-system.css" />
  <style>
${css}
  </style>
</head>
<body class="nx-page-cuenta">
${navHtml}
${dividerAndMobile}

  <main class="nx-acc-shell">
    <div data-view="auth" id="nx-acc-auth" class="active">
      <section class="nx-acc-card nx-acc-login" id="nx-acc-login-pane" aria-labelledby="nx-acc-login-title">
        <h1 class="nx-acc-heading" id="nx-acc-login-title">Iniciar sesión</h1>
        <p class="nx-acc-sub">Introduce tu email y contraseña para continuar.</p>
        <div id="auth-alert" class="nx-acc-alert" role="alert"></div>
        <div class="nx-acc-stack">
          <input class="nx-acc-input" type="email" id="login-email" autocomplete="email" placeholder="Email" />
          <input class="nx-acc-input" type="password" id="login-pass" autocomplete="current-password" placeholder="Contraseña" />
          <button type="button" class="nx-acc-link-quiet" id="btn-forgot">¿Olvidaste tu contraseña?</button>
          <button type="button" class="nx-acc-btn-primary" id="btn-login">Iniciar sesión</button>
        </div>
        <p class="nx-acc-foot">
          ¿No tienes cuenta?
          <button type="button" class="nx-acc-switch" id="nx-show-register">Crear cuenta</button>
        </p>
      </section>

      <section class="nx-acc-card nx-acc-card--register" id="nx-acc-register-pane" hidden aria-labelledby="nx-acc-reg-title">
        <h1 class="nx-acc-heading" id="nx-acc-reg-title">Crear cuenta</h1>
        <p class="nx-acc-sub">Completa los datos para registrarte en PROTHENTIC.</p>
        <div id="auth-alert-reg" class="nx-acc-alert" role="alert"></div>
        <div class="nx-acc-stack">
          <div class="nx-acc-grid2">
            <input class="nx-acc-input" type="text" id="reg-first" autocomplete="given-name" placeholder="Nombre" />
            <input class="nx-acc-input" type="text" id="reg-last" autocomplete="family-name" placeholder="Apellido" />
          </div>
          <input class="nx-acc-input" type="email" id="reg-email" autocomplete="email" placeholder="Email" />
          <input class="nx-acc-input" type="password" id="reg-pass" autocomplete="new-password" placeholder="Contraseña (mín. 6 caracteres)" />
          <button type="button" class="nx-acc-btn-primary" id="btn-register">Crear cuenta</button>
        </div>
        <p class="nx-acc-foot">
          ¿Ya tienes cuenta?
          <button type="button" class="nx-acc-switch" id="nx-show-login">Iniciar sesión</button>
        </p>
      </section>
    </div>

    <div data-view="dashboard" id="nx-acc-dashboard">
      <div class="nx-acc-dash-min">
        <div class="nx-acc-dash-minirow">
          <span class="nx-acc-dash-greet-line">Hola, <strong id="dash-greet-name">—</strong></span>
          <span class="nx-acc-dash-email" id="dash-email-mini"></span>
          <button type="button" class="nx-acc-logout-text" id="btn-logout">Cerrar sesión</button>
        </div>

        <nav class="nx-acc-subnav" aria-label="Tu cuenta">
          <button type="button" class="nx-acc-subnav__btn is-active" data-dash-tab="orders">Pedidos</button>
          <button type="button" class="nx-acc-subnav__btn" data-dash-tab="addresses">Direcciones</button>
          <button type="button" class="nx-acc-subnav__btn" data-dash-tab="profile">Mi perfil</button>
        </nav>

        <header class="nx-acc-page-head">
          <h1 class="nx-acc-page-title" id="nx-dash-heading">Pedidos</h1>
          <span class="nx-acc-page-badge" id="nx-dash-badge">0</span>
        </header>

        <section id="nx-dash-panel-orders" class="nx-acc-dash-panel" aria-labelledby="nx-dash-heading">
          <div id="orders-list"></div>
        </section>

        <section id="nx-dash-panel-addresses" class="nx-acc-dash-panel" hidden aria-labelledby="nx-dash-heading">
          <div id="addresses-list"></div>
          <div class="nx-acc-actions-foot">
            <button type="button" class="nx-acc-btn-solid" id="btn-add-address-placeholder">Añadir dirección</button>
          </div>
        </section>

        <section id="nx-dash-panel-profile" class="nx-acc-dash-panel" hidden aria-labelledby="nx-dash-heading">
          <div id="profile-card"></div>
        </section>
      </div>
    </div>
  </main>

  <div class="nx-acc-overlay" id="recover-modal" role="presentation">
    <div class="nx-acc-dialog" role="dialog" aria-modal="true" aria-labelledby="nx-rec-title">
      <h3 id="nx-rec-title">Recuperar contraseña</h3>
      <p>Te enviamos instrucciones a tu correo cuando exista una cuenta asociada.</p>
      <div id="recover-alert" class="nx-acc-alert" role="alert" style="margin-bottom:14px;"></div>
      <div class="nx-acc-stack">
        <input class="nx-acc-input" type="email" id="recover-email" autocomplete="email" placeholder="Email" />
        <button type="button" class="nx-acc-btn-primary" id="btn-recover-send">Enviar</button>
      </div>
      <p class="nx-acc-foot">
        <button type="button" class="nx-acc-switch" id="btn-recover-close">Cancelar</button>
      </p>
    </div>
  </div>

  <div class="nx-acc-overlay" id="nx-address-modal" role="presentation">
    <div class="nx-acc-dialog nx-acc-dialog--wide" role="dialog" aria-modal="true" aria-labelledby="nx-adr-title">
      <h3 id="nx-adr-title">Añadir dirección</h3>
      <p class="nx-acc-dialog-hint">
        Se guarda en tu cuenta de Shopify. Si falla, revisa que el canal Headless tenga permiso
        <strong>unauthenticated_write_customers</strong>.
      </p>
      <div id="nx-adr-alert" class="nx-acc-alert" role="alert"></div>
      <form id="nx-address-form" class="nx-acc-adr-form">
        <input type="hidden" id="nx-adr-edit-id" value="" autocomplete="off" />
        <div class="nx-acc-grid2">
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-first">Nombre</label>
            <input class="nx-acc-input" id="adr-first" name="firstName" type="text" autocomplete="given-name" />
          </div>
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-last">Apellido</label>
            <input class="nx-acc-input" id="adr-last" name="lastName" type="text" autocomplete="family-name" />
          </div>
        </div>
        <div class="nx-acc-stack" style="margin-top:14px;">
          <label class="nx-acc-adr-label" for="adr-line1">Dirección (calle y número) *</label>
          <input class="nx-acc-input" id="adr-line1" name="address1" type="text" autocomplete="address-line1" required />
        </div>
        <div class="nx-acc-stack" style="margin-top:14px;">
          <label class="nx-acc-adr-label" for="adr-line2">Apartamento, interior, etc.</label>
          <input class="nx-acc-input" id="adr-line2" name="address2" type="text" autocomplete="address-line2" />
        </div>
        <div class="nx-acc-grid2" style="margin-top:14px;">
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-city">Ciudad *</label>
            <input class="nx-acc-input" id="adr-city" name="city" type="text" autocomplete="address-level2" required />
          </div>
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-province">Departamento / provincia</label>
            <input class="nx-acc-input" id="adr-province" name="province" type="text" autocomplete="address-level1" />
          </div>
        </div>
        <div class="nx-acc-grid2" style="margin-top:14px;">
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-zip">Código postal</label>
            <input class="nx-acc-input" id="adr-zip" name="zip" type="text" autocomplete="postal-code" />
          </div>
          <div class="nx-acc-stack nx-acc-stack--tight">
            <label class="nx-acc-adr-label" for="adr-country">País *</label>
            <input class="nx-acc-input" id="adr-country" name="country" type="text" autocomplete="country-name" placeholder="Colombia" required />
          </div>
        </div>
        <div class="nx-acc-stack" style="margin-top:14px;">
          <label class="nx-acc-adr-label" for="adr-phone">Teléfono</label>
          <input class="nx-acc-input" id="adr-phone" name="phone" type="tel" autocomplete="tel" placeholder="+57…" />
        </div>
        <div class="nx-acc-adr-actions">
          <button type="button" class="nx-acc-btn-secondary" id="nx-adr-cancel">Cancelar</button>
          <button type="submit" class="nx-acc-btn-solid" id="nx-adr-save">Guardar dirección</button>
        </div>
      </form>
    </div>
  </div>

  <script src="./nexorien-shopify.js"></script>
  <script src="./nexorien-cart.js"></script>
  <script src="./nexorien-navbar-actions.js"></script>
  <script src="./nexorien-mega-desktop.js"></script>
  <script>
${navbarInit}
  </script>
  <script>
${accountScript}
  </script>
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log("wrote", outPath);
