/**
 * Nexorien cart drawer (Storefront API cart).
 * Requires: nexorien-shopify.js loaded first.
 */
(function (global) {
  const d = global.document;
  if (!d) return;

  const SEL_BADGE = ".nx-cart-badge";
  const DRAWER_ID = "nx-cart-drawer";
  const RECS_CACHE_KEY = "nexorien_cart_recs_cache_v1";
  const RECS_CACHE_MS = 1000 * 60 * 10;

  const state = {
    open: false,
    loading: false,
    cart: null,
    recs: [],
  };

  const i18n = {
    cartTitle: "Carrito",
    loading: "Cargando…",
    trending: "Tendencias",
    checkout: "Finalizar compra",
    checkoutNote: "Impuestos y envío se calculan al finalizar la compra.",
    add: "+ Agregar",
    remove: "Eliminar",
    emptyCart: "Tu carrito está vacío.",
    freeShippingUnlocked: "Envío gratis desbloqueado.",
    freeShippingMore: "Te faltan <strong>{{amount}}</strong> para envío gratis.",
  };

  function tpl(template, params) {
    return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => String(params?.[key] ?? ""));
  }

  function money(amount, currencyCode) {
    try {
      return global.NxShopify?.money?.(amount, currencyCode) || `${amount} ${currencyCode || ""}`.trim();
    } catch {
      return `${amount} ${currencyCode || ""}`.trim();
    }
  }

  function ensureUI() {
    let root = d.getElementById(DRAWER_ID);
    if (root) return root;

    root = d.createElement("div");
    root.id = DRAWER_ID;
    root.className = "nx-cart-drawer";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="nx-cart-drawer__backdrop" data-nx-cart-close></div>
      <aside class="nx-cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Carrito">
        <header class="nx-cart-drawer__head">
          <div class="nx-cart-drawer__title">${i18n.cartTitle} <span class="nx-cart-drawer__count" data-nx-cart-count>0</span></div>
          <button class="nx-cart-drawer__close" type="button" aria-label="Cerrar" data-nx-cart-close>✕</button>
        </header>

        <div class="nx-cart-drawer__body">
          <div class="nx-cart-drawer__ship" data-nx-cart-ship hidden>
            <div class="nx-cart-drawer__ship-text" data-nx-cart-ship-text></div>
            <div class="nx-cart-drawer__ship-bar" role="progressbar" aria-label="Progreso de envío gratis">
              <div class="nx-cart-drawer__ship-fill" data-nx-cart-ship-fill></div>
            </div>
          </div>
          <div class="nx-cart-drawer__status" data-nx-cart-status>${i18n.loading}</div>
          <div class="nx-cart-drawer__lines" data-nx-cart-lines hidden></div>

          <section class="nx-cart-drawer__recs" data-nx-cart-recs hidden aria-label="Productos complementarios">
            <div class="nx-cart-drawer__recs-head">
              <h3 class="nx-cart-drawer__recs-title">${i18n.trending}</h3>
              <div class="nx-cart-drawer__recs-arrows">
                <button class="nx-cart-drawer__recs-arrow" type="button" aria-label="Anterior" data-nx-recs-prev>‹</button>
                <button class="nx-cart-drawer__recs-arrow" type="button" aria-label="Siguiente" data-nx-recs-next>›</button>
              </div>
            </div>
            <div class="nx-cart-drawer__recs-scroll" data-nx-recs-scroll tabindex="0">
              <div class="nx-cart-drawer__recs-track" data-nx-recs-track></div>
            </div>
          </section>
        </div>

        <footer class="nx-cart-drawer__foot">
          <div class="nx-cart-drawer__total">
            <span>Total</span>
            <strong data-nx-cart-total>$0</strong>
          </div>
          <button class="nx-cart-drawer__checkout" type="button" data-nx-cart-checkout disabled>
            <span class="nx-cart-drawer__checkout-lock" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            ${i18n.checkout}
          </button>
          <p class="nx-cart-drawer__note">${i18n.checkoutNote}</p>
        </footer>
      </aside>
    `;

    d.body.appendChild(root);

    root.addEventListener("click", (e) => {
      const close = e.target.closest("[data-nx-cart-close]");
      if (close) NxCart.close();
    });

    root.addEventListener("click", async (e) => {
      const add = e.target.closest("[data-nx-rec-add]");
      if (!add) return;
      const variantId = add.getAttribute("data-variant-id") || "";
      if (!variantId) return;
      add.setAttribute("aria-busy", "true");
      add.disabled = true;
      try {
        await NxCart.addVariantAndOpen(variantId, 1);
      } finally {
        add.removeAttribute("aria-busy");
        add.disabled = false;
      }
    });

    root.addEventListener("change", async (e) => {
      const qty = e.target.closest("[data-nx-line-qty]");
      if (!qty) return;
      const lineId = qty.getAttribute("data-line-id");
      if (!lineId) return;
      const q = Math.max(0, Number(qty.value || 0));
      await NxCart.setQuantity(lineId, q);
    });

    root.addEventListener("click", async (e) => {
      const rm = e.target.closest("[data-nx-line-remove]");
      if (!rm) return;
      const lineId = rm.getAttribute("data-line-id");
      if (!lineId) return;
      await NxCart.remove(lineId);
    });

    root.querySelector("[data-nx-cart-checkout]")?.addEventListener("click", async () => {
      const btn = root.querySelector("[data-nx-cart-checkout]");
      if (!btn || btn.disabled) return;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      try {
        await global.NxShopify.ready();
        const cart = await global.NxShopify.getCart();
        state.cart = cart;
        const url = cart?.checkoutUrl;
        if (!url) throw new Error("No hay checkout disponible. Revisa que el carrito tenga productos.");
        global.location.assign(url);
      } catch (e) {
        alert(e?.message || String(e));
        const lines = normalizeLines(state.cart);
        btn.disabled = lines.length === 0;
      } finally {
        btn.removeAttribute("aria-busy");
      }
    });

    // recs arrows
    const sc = root.querySelector("[data-nx-recs-scroll]");
    root.querySelector("[data-nx-recs-prev]")?.addEventListener("click", () => {
      if (!sc) return;
      sc.scrollBy({ left: -Math.max(Math.round(sc.clientWidth * 0.7), 260), behavior: "smooth" });
    });
    root.querySelector("[data-nx-recs-next]")?.addEventListener("click", () => {
      if (!sc) return;
      sc.scrollBy({ left: Math.max(Math.round(sc.clientWidth * 0.7), 260), behavior: "smooth" });
    });

    return root;
  }

  function setOpen(open) {
    const root = ensureUI();
    state.open = !!open;
    root.setAttribute("aria-hidden", open ? "false" : "true");
    d.body.style.overflow = open ? "hidden" : "";
  }

  function setBadge(n) {
    const v = String(Math.max(0, Number(n || 0)));
    d.querySelectorAll(SEL_BADGE).forEach((el) => {
      el.textContent = v;
      el.setAttribute("aria-label", `${v} productos`);
    });
  }

  function normalizeLines(cart) {
    const edges = cart?.lines?.edges || [];
    return edges.map((e) => e.node).filter(Boolean);
  }

  function cartCurrency(cart) {
    return cart?.cost?.totalAmount?.currencyCode || cart?.cost?.subtotalAmount?.currencyCode || "USD";
  }

  function cartTotal(cart) {
    const amt = cart?.cost?.totalAmount?.amount ?? cart?.cost?.subtotalAmount?.amount ?? 0;
    return Number(amt || 0);
  }

  function freeShippingThreshold(currencyCode) {
    // Ajustable luego. Valores típicos:
    // - COP: 200k (como tu promo)
    // - USD: 125 (similar a muchas stores)
    if (currencyCode === "COP") return 200000;
    if (currencyCode === "USD") return 125;
    return 0;
  }

  function renderShipping(cart) {
    const root = ensureUI();
    const wrap = root.querySelector("[data-nx-cart-ship]");
    const txt = root.querySelector("[data-nx-cart-ship-text]");
    const fill = root.querySelector("[data-nx-cart-ship-fill]");
    if (!wrap || !txt || !fill) return;

    const cur = cartCurrency(cart);
    const thr = freeShippingThreshold(cur);
    if (!thr) {
      wrap.hidden = true;
      return;
    }
    const total = cartTotal(cart);
    const remain = Math.max(0, thr - total);
    const pct = Math.max(0, Math.min(100, (total / thr) * 100));

    wrap.hidden = false;
    if (remain > 0) {
      txt.innerHTML = tpl(i18n.freeShippingMore, { amount: escapeHtml(money(remain, cur)) });
    } else {
      txt.textContent = i18n.freeShippingUnlocked;
    }
    fill.style.width = `${pct}%`;
  }

  function handlesInCart(cart) {
    const set = new Set();
    for (const l of normalizeLines(cart)) {
      const h = l?.merchandise?.product?.handle;
      if (h) set.add(String(h));
    }
    return set;
  }

  function renderRecs(cart) {
    const root = ensureUI();
    const sec = root.querySelector("[data-nx-cart-recs]");
    const track = root.querySelector("[data-nx-recs-track]");
    if (!sec || !track) return;

    const exclude = handlesInCart(cart);
    const list = (state.recs || []).filter((p) => p && !exclude.has(String(p.handle || ""))).slice(0, 3);
    if (!list.length) {
      sec.hidden = true;
      track.innerHTML = "";
      return;
    }

    sec.hidden = false;
    track.innerHTML = list
      .map((p) => {
        const img =
          p.imageUrl ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Crect fill='%23eee' width='100%25' height='100%25'/%3E%3C/svg%3E";
        const title = escapeHtml(p.title || "Producto");
        const price = escapeHtml(p.priceFormatted || "");
        const vid = escapeHtml(p.variantId || "");
        const disabled = !p.variantId || p.variantInStock === false ? "disabled" : "";
        return `
          <article class="nx-cart-rec">
            <div class="nx-cart-rec__img">
              <img src="${img}" alt="" loading="lazy" />
            </div>
            <div class="nx-cart-rec__meta">
              <div class="nx-cart-rec__name">${title}</div>
              <div class="nx-cart-rec__price">${price}</div>
            </div>
            <button class="nx-cart-rec__add" type="button" ${disabled} data-nx-rec-add data-variant-id="${vid}">${i18n.add}</button>
          </article>
        `;
      })
      .join("");
  }

  function render(cart, opts) {
    const root = ensureUI();
    const status = root.querySelector("[data-nx-cart-status]");
    const linesWrap = root.querySelector("[data-nx-cart-lines]");
    const count = root.querySelector("[data-nx-cart-count]");
    const total = root.querySelector("[data-nx-cart-total]");
    const btn = root.querySelector("[data-nx-cart-checkout]");

    const lines = normalizeLines(cart);
    const qty = Number(cart?.totalQuantity || lines.reduce((s, l) => s + Number(l.quantity || 0), 0) || 0);

    setBadge(qty);
    if (count) count.textContent = String(qty);

    const totalAmount = cart?.cost?.totalAmount;
    if (total) total.textContent = totalAmount ? money(totalAmount.amount, totalAmount.currencyCode) : "$0";

    if (!linesWrap || !status) return;

    if (opts?.loading) {
      status.hidden = false;
      status.textContent = i18n.loading;
      linesWrap.hidden = true;
      linesWrap.innerHTML = "";
      if (btn) btn.disabled = true;
      return;
    }

    if (opts?.error) {
      status.hidden = false;
      status.textContent = opts.error;
      linesWrap.hidden = true;
      linesWrap.innerHTML = "";
      if (btn) btn.disabled = true;
      return;
    }

    if (!lines.length) {
      status.hidden = false;
      status.textContent = i18n.emptyCart;
      linesWrap.hidden = true;
      linesWrap.innerHTML = "";
      if (btn) btn.disabled = true;
      renderShipping(cart);
      renderRecs(cart);
      return;
    }

    status.hidden = true;
    linesWrap.hidden = false;
    linesWrap.innerHTML = lines
      .map((l) => {
        const m = l.merchandise;
        const pTitle = m?.product?.title || "Producto";
        const vTitle = m?.title && m.title !== "Default Title" ? m.title : "";
        const img = m?.image?.url || "";
        const price = m?.price ? money(m.price.amount, m.price.currencyCode) : "";
        return `
          <div class="nx-cart-line">
            <div class="nx-cart-line__img">
              ${img ? `<img src="${img}" alt="" loading="lazy" />` : `<div class="nx-cart-line__ph"></div>`}
            </div>
            <div class="nx-cart-line__meta">
              <div class="nx-cart-line__name">${escapeHtml(pTitle)}</div>
              ${vTitle ? `<div class="nx-cart-line__variant">${escapeHtml(vTitle)}</div>` : ``}
              ${price ? `<div class="nx-cart-line__price">${escapeHtml(price)}</div>` : ``}
            </div>
            <div class="nx-cart-line__qty">
              <input class="nx-cart-line__qtyinput" type="number" min="0" step="1" value="${Number(l.quantity || 0)}" data-nx-line-qty data-line-id="${l.id}" />
              <button class="nx-cart-line__remove" type="button" data-nx-line-remove data-line-id="${l.id}">${i18n.remove}</button>
            </div>
          </div>
        `;
      })
      .join("");

    if (btn) {
      const url = cart?.checkoutUrl;
      btn.disabled = !lines.length || !url;
    }
    renderShipping(cart);
    renderRecs(cart);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function readRecsCache() {
    try {
      const raw = global.localStorage?.getItem(RECS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items) || !parsed.ts) return null;
      if (Date.now() - Number(parsed.ts) > RECS_CACHE_MS) return null;
      return parsed.items;
    } catch {
      return null;
    }
  }

  function writeRecsCache(items) {
    try {
      global.localStorage?.setItem(RECS_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items || [] }));
    } catch {}
  }

  async function loadRecs() {
    const cached = readRecsCache();
    if (cached && cached.length) {
      state.recs = cached;
      return cached;
    }
    const items = await global.NxShopify.fetchAllProducts(80);
    state.recs = items;
    writeRecsCache(items);
    return items;
  }

  async function refresh() {
    if (!global.NxShopify) throw new Error("Falta NxShopify");
    state.loading = true;
    render(state.cart, { loading: true });
    const cart = await global.NxShopify.getCart();
    state.cart = cart;
    state.loading = false;
    // recs (non-blocking)
    loadRecs()
      .then(() => render(cart, {}))
      .catch(() => {});
    render(cart, {});
    try {
      d.dispatchEvent(new CustomEvent("nexorien:cartupdated", { detail: { cart } }));
    } catch (_) {}
    return cart;
  }

  async function addVariant(variantId, quantity) {
    if (!variantId) throw new Error("Variant ID requerido");
    await global.NxShopify.addVariantToCart(variantId, quantity || 1);
    await refresh();
  }

  async function addByHandle(handle, quantity) {
    const p = await global.NxShopify.fetchProductByHandle(handle);
    const v = p?.variants?.[0];
    if (!v?.id) throw new Error("No pude obtener una variante para este producto");
    await addVariant(v.id, quantity || 1);
  }

  async function setQuantity(lineId, quantity) {
    render(state.cart, { loading: true });
    await global.NxShopify.updateCartLine(lineId, quantity);
    await refresh();
  }

  async function remove(lineId) {
    render(state.cart, { loading: true });
    await global.NxShopify.removeCartLine(lineId);
    await refresh();
  }

  function bindHeaderButtons() {
    // Any cart icon in header
    d.querySelectorAll('button[aria-label="Carrito"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        NxCart.open();
      });
    });
  }

  const NxCart = {
    open: async function () {
      setOpen(true);
      try {
        await refresh();
      } catch (e) {
        render(null, { error: e?.message || String(e) });
      }
    },
    close: function () {
      setOpen(false);
    },
    refresh,
    addVariantAndOpen: async function (variantId, quantity) {
      setOpen(true);
      try {
        render(state.cart, { loading: true });
        await addVariant(variantId, quantity || 1);
      } catch (e) {
        render(null, { error: e?.message || String(e) });
      }
    },
    addHandleAndOpen: async function (handle, quantity) {
      setOpen(true);
      try {
        render(state.cart, { loading: true });
        await addByHandle(handle, quantity || 1);
      } catch (e) {
        render(null, { error: e?.message || String(e) });
      }
    },
    setQuantity,
    remove,
  };

  global.NxCart = NxCart;

  // Init
  ensureUI();
  bindHeaderButtons();
  // Update badge in background
  global.NxShopify?.ready?.()
    .then(() => global.NxShopify.getCart())
    .then((cart) => {
      if (cart) setBadge(cart.totalQuantity || 0);
    })
    .catch(() => {});
})(typeof window !== "undefined" ? window : globalThis);

