/**
 * Shopify Storefront API (headless). Config via:
 * 1) npm run dev → GET /nx-shopify-config.json (from .env)
 * 2) Or window.__NEXORIEN_SHOPIFY__ set in nx-shopify-config.local.js (before this script)
 */
(function (global) {
  const CART_ID_KEY = "nexorien_storefront_cart_id";
  const DEFAULTS = {
    storeDomain: "nexorien-2.myshopify.com",
    apiVersion: "2026-04",
  };

  let cachedConfig = null;
  let configPromise = null;

  function mergeConfig(raw) {
    if (!raw || !raw.storefrontAccessToken) return null;
    return {
      ...DEFAULTS,
      ...raw,
      storeDomain: String(raw.storeDomain || DEFAULTS.storeDomain).replace(/^https?:\/\//, ""),
      apiVersion: String(raw.apiVersion || DEFAULTS.apiVersion),
      storefrontAccessToken: String(raw.storefrontAccessToken).trim(),
    };
  }

  function getConfigSync() {
    return cachedConfig || mergeConfig(global.__NEXORIEN_SHOPIFY__) || null;
  }

  let warnedStoreDomainReconnect = false;

  async function resolveConfig() {
    if (cachedConfig) return cachedConfig;
    const preset = mergeConfig(global.__NEXORIEN_SHOPIFY__);
    if (preset) {
      cachedConfig = preset;
      return cachedConfig;
    }
    try {
      const res = await fetch("/nx-shopify-config.json", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        const meta = j._meta;
        delete j._meta;
        const c = mergeConfig(j);
        if (
          typeof global.console !== "undefined" &&
          global.console.warn &&
          meta &&
          !meta.storeDomainFromEnv &&
          !warnedStoreDomainReconnect
        ) {
          warnedStoreDomainReconnect = true;
          global.console.warn(
            "[NxShopify] La tienda se toma desde el valor por defecto del servidor. " +
              "Para que coincida con tu Admin, define SHOPIFY_STORE_DOMAIN=xxx.myshopify.com en .env (el token debe ser de la misma tienda)."
          );
        }
        if (c) {
          cachedConfig = c;
          global.__NEXORIEN_SHOPIFY__ = c;
          return cachedConfig;
        }
      }
    } catch (_) {}
    return null;
  }

  function ready() {
    if (!configPromise) {
      configPromise = resolveConfig().then((c) => c);
    }
    return configPromise;
  }

  async function graphql(query, variables) {
    const cfg = await ready();
    if (!cfg) throw new Error("Shopify: falta configuración (token). Usa .env + npm run dev o nx-shopify-config.local.js.");

    const url = `https://${cfg.storeDomain}/api/${cfg.apiVersion}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": cfg.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables: variables || {} }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.errors?.[0]?.message || `HTTP ${res.status}`);
    if (json.errors && json.errors.length) throw new Error(json.errors[0].message || "Error de GraphQL");
    return json.data;
  }

  function stripHtml(html) {
    if (!html) return "";
    const d = global.document;
    if (!d) return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const t = d.createElement("div");
    t.innerHTML = html;
    return (t.textContent || "").replace(/\s+/g, " ").trim();
  }

  function money(amount, currencyCode) {
    const n = Number(amount);
    const code = currencyCode || "COP";
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: code,
        maximumFractionDigits: code === "COP" || code === "CLP" ? 0 : 2,
      }).format(Number.isFinite(n) ? n : 0);
    } catch {
      return `${n} ${code}`;
    }
  }

  const PRODUCTS_QUERY = `
    query NexorienProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            handle
            title
            category { name }
            collections(first: 5) {
              edges {
                node { handle title }
              }
            }
            featuredImage { url altText }
            availableForSale
            priceRange { minVariantPrice { amount currencyCode } }
            compareAtPriceRange { minVariantPrice { amount currencyCode } }
            options { name values }
            variants(first: 25) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price { amount currencyCode }
                  compareAtPrice { amount currencyCode }
                  image { url altText }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }
  `;

  const PRODUCT_BY_HANDLE = `
    query NexorienProduct($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        category { name }
        collections(first: 5) {
          edges {
            node { handle title }
          }
        }
        description
        descriptionHtml
        availableForSale
        featuredImage { url altText }
        images(first: 20) { edges { node { url altText } } }
        pdpGalleryDescUrl: metafield(namespace: "custom", key: "pdp_gallery_desc_url") { value }
        pdpGalleryNutUrl: metafield(namespace: "custom", key: "pdp_gallery_nutrition_url") { value }
        options { name values }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              image { url altText }
            }
          }
        }
      }
    }
  `;

  const COLLECTION_BY_HANDLE = `
    query NexorienCollection($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        id
        handle
        title
        image { url altText }
        products(first: $first) {
          edges {
            node {
              id
              handle
              title
              category { name }
              collections(first: 5) {
                edges {
                  node { handle title }
                }
              }
              featuredImage { url altText }
              availableForSale
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
              options { name values }
              variants(first: 25) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    image { url altText }
                    selectedOptions { name value }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  /** Handles que esperan navbar, mega menús y enlaces "?collection=". Deben existir colecciones con estos handles en Shopify. */
  const NAV_CATEGORY_COLLECTION_HANDLES = [
    "proteinas-1",
    "pre-entrenos-1",
    "construir-musculo-1",
    "salud-y-bienestar-1",
    "manejo-de-peso-1",
    "ropa-y-accesorios",
    "mas-vendidos",
  ];

  const COLLECTIONS_LIST_QUERY = `
    query NexorienCollectionsList($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  `;

  const SEARCH_PRODUCTS_QUERY = `
    query NexorienSearchProducts($query: String!, $first: Int!) {
      search(query: $query, first: $first, types: [PRODUCT]) {
        edges {
          node {
            ... on Product {
              id
              handle
              title
              category { name }
              collections(first: 5) {
                edges {
                  node { handle title }
                }
              }
              featuredImage { url altText }
              availableForSale
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
              options { name values }
              variants(first: 25) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    image { url altText }
                    selectedOptions { name value }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const CART_CREATE = `
    mutation NexorienCartCreate {
      cartCreate {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  const CART_LINES_ADD = `
    mutation NexorienCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  const CART_QUERY = `
    query NexorienCart($id: ID!) {
      cart(id: $id) {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image { url altText }
                  product { title handle }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `;

  const CART_LINES_UPDATE = `
    mutation NexorienCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;

  const CART_LINES_REMOVE = `
    mutation NexorienCartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;

  async function fetchCollectionsList(maxItems) {
    const first = Math.min(Math.max(maxItems ?? 60, 1), 250);
    const data = await graphql(COLLECTIONS_LIST_QUERY, { first });
    return (data.collections?.edges || []).map((e) => e?.node).filter(Boolean);
  }

  /**
   * Compara colecciones visibles por Storefront con las que usa el HTML.
   * Uso en consola: await NxShopify.ready(); await NxShopify.diagnoseNavCategoryMismatch();
   */
  async function diagnoseNavCategoryMismatch() {
    const nodes = await fetchCollectionsList(250);
    const have = new Set(nodes.map((n) => String(n.handle || "")));
    const missingExpectedHandles = NAV_CATEGORY_COLLECTION_HANDLES.filter((h) => !have.has(h));
    return {
      expectedNavHandles: NAV_CATEGORY_COLLECTION_HANDLES.slice(),
      storefrontCollectionCount: nodes.length,
      storefrontCollections: nodes.map((n) => ({ handle: n.handle, title: n.title })),
      missingExpectedHandles,
    };
  }

  async function searchProducts(query, maxItems) {
    const q = String(query || "").trim();
    if (!q) return [];
    const first = Math.max(1, Math.min(maxItems ?? 20, 50));
    const data = await graphql(SEARCH_PRODUCTS_QUERY, { query: q, first });
    const edges = data?.search?.edges || [];
    const out = [];
    for (const e of edges) {
      const node = e?.node;
      if (node && node.handle) out.push(normalizeProductCard(node));
    }
    return out;
  }

  async function fetchProductsPage(first, after) {
    const data = await graphql(PRODUCTS_QUERY, { first, after });
    return data.products;
  }

  async function fetchAllProducts(maxItems) {
    const cap = Math.min(maxItems || 250, 250);
    const all = [];
    let after = null;
    let guard = 0;
    while (all.length < cap && guard < 20) {
      guard += 1;
      const page = await fetchProductsPage(Math.min(50, cap - all.length), after);
      const edges = page?.edges || [];
      for (const e of edges) {
        if (e?.node) all.push(normalizeProductCard(e.node));
      }
      if (!page?.pageInfo?.hasNextPage || !page.pageInfo.endCursor) break;
      after = page.pageInfo.endCursor;
    }
    return all;
  }

  function productCategoryLabel(node) {
    const tax = String(node?.category?.name || "").trim();
    if (tax) return tax;
    const edges = node?.collections?.edges || [];
    for (const e of edges) {
      const t = String(e?.node?.title || "").trim();
      if (t) return t;
    }
    return "";
  }

  function normalizeProductCard(node) {
    const minP = node.priceRange?.minVariantPrice;
    const minC = node.compareAtPriceRange?.minVariantPrice;
    const amount = minP ? Number(minP.amount) : 0;
    const currency = minP?.currencyCode || "COP";
    const compare = minC ? Number(minC.amount) : null;
    const opts = node.options || [];
    const variants = (node.variants?.edges || []).map((e) => e?.node).filter(Boolean);
    const firstVariant = variants[0] || null;
    const variantId = firstVariant?.id || "";

    const hasSale = !!(compare && compare > amount);
    const compareAtAmount = hasSale ? Number(compare) : null;
    const saveAmount = hasSale ? Math.max(0, Number(compare) - Number(amount)) : null;

    let badgeClass = "nx-ap-badge--plain";
    let badgeText = "";
    if (hasSale && saveAmount && saveAmount > 0) {
      badgeClass = "nx-ap-badge--sale";
      badgeText = `AHORRA ${money(saveAmount, currency)}`;
    }

    return {
      handle: node.handle,
      title: node.title,
      imageUrl: node.featuredImage?.url || "",
      imageAlt: node.featuredImage?.altText || node.title,
      instock: !!node.availableForSale,
      variantId,
      variantInStock: firstVariant ? !!firstVariant.availableForSale : !!node.availableForSale,
      priceAmount: amount,
      currencyCode: currency,
      priceFormatted: money(amount, currency),
      compareAtAmount,
      compareAtFormatted: compareAtAmount ? money(compareAtAmount, currency) : "",
      saveAmount,
      saveFormatted: saveAmount ? money(saveAmount, currency) : "",
      badgeClass,
      badgeText,
      categoryLabel: productCategoryLabel(node),
      options: opts,
      variants: variants.map((v) => ({
        id: v.id,
        title: v.title,
        availableForSale: !!v.availableForSale,
        imageUrl: v.image?.url || "",
        imageAlt: v.image?.altText || "",
        selectedOptions: (v.selectedOptions || []).map((o) => ({ name: o.name, value: o.value })),
        priceAmount: Number(v.price?.amount || 0),
        currencyCode: v.price?.currencyCode || currency,
        compareAtAmount: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
      })),
    };
  }

  async function fetchProductByHandle(handle) {
    const data = await graphql(PRODUCT_BY_HANDLE, { handle: String(handle || "").trim() });
    const product = data.product;
    if (!product) return null;
    return normalizeProductDetail(product);
  }

  async function fetchCollectionByHandle(handle, limit) {
    const h = String(handle || "").trim();
    if (!h) throw new Error("Shopify: falta handle de colección");
    const first = Math.max(1, Math.min(Number(limit || 12), 250));
    const data = await graphql(COLLECTION_BY_HANDLE, { handle: h, first });
    const col = data?.collection;
    if (!col) return null;
    const products = (col.products?.edges || []).map((e) => e?.node).filter(Boolean).map(normalizeProductCard);
    return {
      id: col.id,
      handle: col.handle,
      title: col.title,
      imageUrl: col.image?.url || "",
      imageAlt: col.image?.altText || col.title,
      products,
    };
  }

  function normalizeProductDetail(product) {
    const imgEdges = product.images?.edges || [];
    const allImages = imgEdges.map((e) => e?.node?.url).filter(Boolean);
    const variantEdges = product.variants?.edges || [];
    const variants = variantEdges.map((e) => {
      const v = e.node;
      const imgs = [];
      if (v.image?.url) imgs.push(v.image.url);
      for (const u of allImages) if (!imgs.includes(u)) imgs.push(u);
      return {
        id: v.id,
        name: v.title === "Default Title" ? "Predeterminado" : v.title,
        swatch: "#d1d5db",
        imageUrl: v.image?.url || "",
        images: imgs.length ? imgs : allImages,
        availableForSale: !!v.availableForSale,
        priceAmount: Number(v.price?.amount || 0),
        currencyCode: v.price?.currencyCode || "COP",
        compareAtAmount: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
      };
    });

    const firstPrice = variants[0]?.priceAmount ?? 0;
    const firstCur = variants[0]?.currencyCode || "COP";

    const mfDesc = String(product.pdpGalleryDescUrl?.value || "").trim();
    const mfNut = String(product.pdpGalleryNutUrl?.value || "").trim();

    return {
      fromShopify: true,
      handle: product.handle,
      images: allImages,
      galleryDescImage: mfDesc,
      galleryNutritionImage: mfNut,
      badge: variants.some((v) => v.compareAtAmount && v.compareAtAmount > v.priceAmount) ? "Oferta" : "",
      title: product.title,
      subtitle: productCategoryLabel(product),
      rating: 0,
      reviewsCount: 0,
      price: firstPrice,
      currencyCode: firstCur,
      desc: stripHtml(product.descriptionHtml || product.description || ""),
      variants,
    };
  }

  function getCartId() {
    try {
      return global.localStorage?.getItem(CART_ID_KEY) || null;
    } catch {
      return null;
    }
  }

  function setCartId(id) {
    try {
      if (id) global.localStorage.setItem(CART_ID_KEY, id);
      else global.localStorage.removeItem(CART_ID_KEY);
    } catch (_) {}
  }

  async function ensureCart() {
    let id = getCartId();
    if (id) return id;
    const data = await graphql(CART_CREATE);
    const err = data.cartCreate?.userErrors?.[0];
    if (err) throw new Error(err.message || "Error en cartCreate");
    const cart = data.cartCreate?.cart;
    if (!cart?.id) throw new Error("cartCreate sin carrito");
    setCartId(cart.id);
    return cart.id;
  }

  async function getCart() {
    const cartId = await ensureCart();
    try {
      const data = await graphql(CART_QUERY, { id: cartId });
      return data.cart || null;
    } catch (e) {
      // If cart id became invalid, reset and retry once.
      const msg = String(e?.message || "");
      if (/cart/i.test(msg) && /not found|invalid/i.test(msg)) {
        setCartId(null);
        const fresh = await ensureCart();
        const data = await graphql(CART_QUERY, { id: fresh });
        return data.cart || null;
      }
      throw e;
    }
  }

  async function addVariantToCart(merchandiseId, quantity) {
    const cartId = await ensureCart();
    const data = await graphql(CART_LINES_ADD, {
      cartId,
      lines: [{ merchandiseId, quantity: quantity || 1 }],
    });
    const errs = data.cartLinesAdd?.userErrors || [];
    if (errs.length) {
      const msg = errs.map((e) => e.message).join("; ");
      if (/cart/i.test(msg) && /not found|invalid/i.test(msg)) {
        setCartId(null);
        return addVariantToCart(merchandiseId, quantity);
      }
      throw new Error(msg);
    }
    const cart = data.cartLinesAdd?.cart;

    // Si hay sesión activa, asociar cliente al carrito
    if (isLoggedIn()) {
      await associateCustomerToCart();
    }

    return { checkoutUrl: cart?.checkoutUrl || "", cartId: cart?.id || cartId };
  }

  async function updateCartLine(lineId, quantity) {
    const cartId = await ensureCart();
    const data = await graphql(CART_LINES_UPDATE, {
      cartId,
      lines: [{ id: lineId, quantity: Math.max(0, Number(quantity || 0)) }],
    });
    const errs = data.cartLinesUpdate?.userErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.cartLinesUpdate?.cart || null;
  }

  async function removeCartLine(lineId) {
    const cartId = await ensureCart();
    const data = await graphql(CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
    const errs = data.cartLinesRemove?.userErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.cartLinesRemove?.cart || null;
  }

  // =============================================
  // CART ↔ CUSTOMER — Asociar cliente al carrito
  // =============================================

  const CART_BUYER_IDENTITY_UPDATE = `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  async function associateCustomerToCart() {
    const token = getCustomerToken();
    const cartId = getCartId();
    if (!token || !cartId) return null;
    try {
      const data = await graphql(CART_BUYER_IDENTITY_UPDATE, {
        cartId,
        buyerIdentity: { customerAccessToken: token },
      });
      const errs = data.cartBuyerIdentityUpdate?.userErrors || [];
      if (errs.length) console.warn("[NxShopify] buyerIdentity error:", errs[0].message);
      return data.cartBuyerIdentityUpdate?.cart || null;
    } catch (e) {
      console.warn("[NxShopify] No se pudo asociar cliente al carrito:", e.message);
      return null;
    }
  }

  // =============================================
  // CUSTOMER / MI CUENTA — Shopify Storefront API
  // =============================================

  const CUSTOMER_TOKEN_KEY = "nexorien_customer_token";

  const CUSTOMER_CREATE = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id firstName lastName email }
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_LOGIN = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_LOGOUT = `
    mutation customerAccessTokenDelete($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        userErrors { field message }
      }
    }
  `;

  const CUSTOMER_RECOVER = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_QUERY = `
    query customer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id firstName lastName email phone
        defaultAddress { id address1 address2 city province country zip firstName lastName phone }
        addresses(first: 10) {
          edges { node { id address1 address2 city province country zip firstName lastName phone } }
        }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id orderNumber name processedAt
              financialStatus fulfillmentStatus
              totalPrice { amount currencyCode }
              lineItems(first: 20) {
                edges {
                  node {
                    title quantity
                    variant {
                      image { url altText }
                      price { amount currencyCode }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const CUSTOMER_UPDATE = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer { id firstName lastName email phone }
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_ADDRESS_CREATE = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
          id address1 address2 city province zip country phone firstName lastName
        }
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_ADDRESS_UPDATE = `
    mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress {
          id address1 address2 city province zip country phone firstName lastName
        }
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_ADDRESS_DELETE = `
    mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        customerUserErrors { field message code }
      }
    }
  `;

  const CUSTOMER_DEFAULT_ADDRESS_UPDATE = `
    mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customer { id }
        customerUserErrors { field message code }
      }
    }
  `;

  function getCustomerToken() {
    try {
      return global.localStorage?.getItem(CUSTOMER_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  }

  function setCustomerToken(token) {
    try {
      if (token) global.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
      else global.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    } catch (_) {}
  }

  function isLoggedIn() {
    return !!getCustomerToken();
  }

  async function newsletterSubscribe(email) {
    const normalized = String(email || "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Introduce un correo válido.");
    }

    function randomPassword() {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@%^*?_";
      const arr = new Uint8Array(28);
      crypto.getRandomValues(arr);
      let out = "";
      for (let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
      return out + "Aa1";
    }

    const data = await graphql(CUSTOMER_CREATE, {
      input: {
        email: normalized,
        password: randomPassword(),
        firstName: "Suscriptor",
        lastName: "Newsletter",
        acceptsMarketing: true,
      },
    });

    const errs = data.customerCreate?.customerUserErrors || [];
    if (errs.length) {
      const joined = errs.map((e) => e.message).join("; ");
      if (/taken|already|exist|registered|registrado/i.test(joined)) {
        throw new Error(
          "Este correo ya tiene cuenta en la tienda. Entra en «Mi cuenta» o usa «Recuperar contraseña»."
        );
      }
      throw new Error(joined);
    }

    return data.customerCreate?.customer || null;
  }

  async function customerRegister({ firstName, lastName, email, password }) {
    const data = await graphql(CUSTOMER_CREATE, {
      input: { firstName, lastName, email, password },
    });
    const errs = data.customerCreate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.customerCreate.customer;
  }

  async function customerLogin(email, password) {
    const data = await graphql(CUSTOMER_LOGIN, {
      input: { email, password },
    });
    const errs = data.customerAccessTokenCreate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    const token = data.customerAccessTokenCreate?.customerAccessToken;
    if (!token?.accessToken) throw new Error("No se pudo iniciar sesión");
    setCustomerToken(token.accessToken);
    return token;
  }

  async function customerLogout() {
    const token = getCustomerToken();
    if (token) {
      try {
        await graphql(CUSTOMER_LOGOUT, { customerAccessToken: token });
      } catch (_) {}
    }
    setCustomerToken(null);
  }

  async function customerRecover(email) {
    const data = await graphql(CUSTOMER_RECOVER, { email });
    const errs = data.customerRecover?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return true;
  }

  async function getCustomer() {
    const token = getCustomerToken();
    if (!token) return null;
    try {
      const data = await graphql(CUSTOMER_QUERY, { customerAccessToken: token });
      return data.customer || null;
    } catch (e) {
      if (/unauthorized|token/i.test(String(e?.message || ""))) setCustomerToken(null);
      return null;
    }
  }

  async function customerUpdate(fields) {
    const token = getCustomerToken();
    if (!token) throw new Error("No hay sesión activa");
    const data = await graphql(CUSTOMER_UPDATE, {
      customerAccessToken: token,
      customer: fields,
    });
    const errs = data.customerUpdate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.customerUpdate.customer;
  }

  /** Campos válidos para MailingAddressInput (Storefront API). */
  function normalizeMailingAddressInput(raw) {
    const r = raw || {};
    const out = {};
    const pairs = [
      ["firstName", r.firstName],
      ["lastName", r.lastName],
      ["address1", r.address1],
      ["address2", r.address2],
      ["city", r.city],
      ["company", r.company],
      ["country", r.country],
      ["province", r.province],
      ["zip", r.zip],
      ["phone", r.phone],
    ];
    for (const [key, val] of pairs) {
      const s = val == null ? "" : String(val).trim();
      if (s) out[key] = s;
    }
    return out;
  }

  async function customerAddressCreate(address) {
    const token = getCustomerToken();
    if (!token) throw new Error("No hay sesión activa");
    const input = normalizeMailingAddressInput(address);
    if (!input.address1) throw new Error("La dirección línea 1 es obligatoria.");
    if (!input.city) throw new Error("La ciudad es obligatoria.");
    if (!input.country) throw new Error("El país es obligatorio.");
    const data = await graphql(CUSTOMER_ADDRESS_CREATE, {
      customerAccessToken: token,
      address: input,
    });
    const errs = data.customerAddressCreate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.customerAddressCreate.customerAddress;
  }

  async function customerAddressUpdate(addressId, address) {
    const token = getCustomerToken();
    if (!token) throw new Error("No hay sesión activa");
    if (!addressId) throw new Error("Falta el id de dirección.");
    const input = normalizeMailingAddressInput(address);
    if (!input.address1) throw new Error("La dirección línea 1 es obligatoria.");
    if (!input.city) throw new Error("La ciudad es obligatoria.");
    if (!input.country) throw new Error("El país es obligatorio.");
    const data = await graphql(CUSTOMER_ADDRESS_UPDATE, {
      customerAccessToken: token,
      id: addressId,
      address: input,
    });
    const errs = data.customerAddressUpdate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.customerAddressUpdate.customerAddress;
  }

  async function customerAddressDelete(addressId) {
    const token = getCustomerToken();
    if (!token) throw new Error("No hay sesión activa");
    const data = await graphql(CUSTOMER_ADDRESS_DELETE, {
      customerAccessToken: token,
      id: addressId,
    });
    const errs = data.customerAddressDelete?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return true;
  }

  async function customerDefaultAddressUpdate(addressId) {
    const token = getCustomerToken();
    if (!token) throw new Error("No hay sesión activa");
    const data = await graphql(CUSTOMER_DEFAULT_ADDRESS_UPDATE, {
      customerAccessToken: token,
      addressId,
    });
    const errs = data.customerDefaultAddressUpdate?.customerUserErrors || [];
    if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
    return data.customerDefaultAddressUpdate.customer;
  }

  global.NxShopify = {
    ready,
    getConfigSync,
    graphql,
    fetchAllProducts,
    fetchProductByHandle,
    fetchCollectionByHandle,
    fetchCollectionsList,
    diagnoseNavCategoryMismatch,
    searchProducts,
    NAV_CATEGORY_COLLECTION_HANDLES,
    addVariantToCart,
    getCart,
    updateCartLine,
    removeCartLine,
    money,
    stripHtml,
    // Customer / Mi Cuenta
    isLoggedIn,
    customerRegister,
    customerLogin,
    customerLogout,
    customerRecover,
    getCustomer,
    customerUpdate,
    getCustomerToken,
    associateCustomerToCart,
    customerAddressCreate,
    customerAddressUpdate,
    customerAddressDelete,
    customerDefaultAddressUpdate,
    newsletterSubscribe,
  };
})(typeof window !== "undefined" ? window : globalThis);
