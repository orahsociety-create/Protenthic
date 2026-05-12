/**
 * Mega menú (desktop): evita cierres por huecos entre <li>, trayectorias lentas hacia el panel
 * fixed y saltos entre categorías vecinas. Usa clase .is-mega-open + cierre diferido.
 * Requiere reglas CSS que incluyan .nx-nav-item--mega.is-mega-open (nexorien-design-system.css).
 */
(function () {
  if (typeof document === "undefined") return;

  const MQ = typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 769px)") : null;
  const DELAY_MS = 420;
  let closeTimer = null;

  function desktop() {
    return MQ ? MQ.matches : window.innerWidth >= 769;
  }

  function clearTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function closeAllMegas() {
    clearTimer();
    document.querySelectorAll(".nx-nav-item--mega").forEach((item) => {
      item.classList.remove("is-mega-open");
      const trigger = item.querySelector(".nx-navbar__link");
      const panel = item.querySelector(".nx-mega");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel) panel.setAttribute("aria-hidden", "true");
    });
  }

  function openMegaItem(item) {
    if (!item || !desktop()) return;
    clearTimer();
    document.querySelectorAll(".nx-nav-item--mega").forEach((li) => {
      const on = li === item;
      li.classList.toggle("is-mega-open", on);
      const trigger = li.querySelector(".nx-navbar__link");
      const panel = li.querySelector(".nx-mega");
      if (trigger) trigger.setAttribute("aria-expanded", on ? "true" : "false");
      if (panel) panel.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  function scheduleCloseMegas() {
    if (!desktop()) return;
    clearTimer();
    closeTimer = setTimeout(() => {
      closeTimer = null;
      closeAllMegas();
    }, DELAY_MS);
  }

  /** Salida del <li> o del panel: si el puntero va a otro mega, abrir ese sin esperar. */
  function onLeaveMegaZone(item, related) {
    if (!desktop()) return;
    if (related && item.contains(related)) return;
    if (related) {
      const other = related.closest(".nx-nav-item--mega");
      if (other && other !== item) {
        openMegaItem(other);
        return;
      }
    }
    scheduleCloseMegas();
  }

  function bindNavbar(nav) {
    nav.querySelectorAll(".nx-nav-item--mega").forEach((item) => {
      const panel = item.querySelector(".nx-mega");

      item.addEventListener("mouseenter", () => openMegaItem(item));
      item.addEventListener("mouseleave", (e) => onLeaveMegaZone(item, e.relatedTarget));

      if (panel) {
        panel.addEventListener("mouseenter", () => openMegaItem(item));
        panel.addEventListener("mouseleave", (e) => onLeaveMegaZone(item, e.relatedTarget));
      }

      item.addEventListener("focusin", () => openMegaItem(item));
      item.addEventListener("focusout", (e) => {
        if (!desktop()) return;
        const rel = e.relatedTarget;
        if (rel && item.contains(rel)) return;
        if (rel) {
          const other = rel.closest(".nx-nav-item--mega");
          if (other && other !== item) {
            openMegaItem(other);
            return;
          }
        }
        scheduleCloseMegas();
      });
    });

    const onMq = () => {
      if (!desktop()) closeAllMegas();
    };
    if (MQ && MQ.addEventListener) MQ.addEventListener("change", onMq);
    else if (MQ && MQ.addListener) MQ.addListener(onMq);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllMegas();
    });
  }

  function init() {
    const nav = document.getElementById("nexorien-navbar");
    if (!nav || nav.dataset.nxMegaDesktopBound === "1") return;
    nav.dataset.nxMegaDesktopBound = "1";
    bindNavbar(nav);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
