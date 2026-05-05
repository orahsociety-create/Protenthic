/**
 * Copia este archivo a: nx-shopify-config.local.js (misma carpeta que index.html)
 * y reemplaza el token. Ese archivo está en .gitignore.
 *
 * Úsalo si abres los HTML con file:// o sin npm run dev.
 * Con "npm run dev", basta con .env (ver .env.example).
 */
window.__NEXORIEN_SHOPIFY__ = {
  storeDomain: "nexorien-2.myshopify.com",
  apiVersion: "2026-04",
  storefrontAccessToken: "PASTE_STOREFRONT_ACCESS_TOKEN_HERE",
};
