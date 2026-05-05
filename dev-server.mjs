import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const FALLBACK_STORE_DOMAIN = "nexorien-2.myshopify.com";

function warnWhenStoreDomainMissing() {
  const d = String(process.env.SHOPIFY_STORE_DOMAIN || "").trim();
  if (d) return;
  console.warn("");
  console.warn("━━━━━━━━ SHOPIFY · reconexión");
  console.warn("  Falta SHOPIFY_STORE_DOMAIN en tu archivo .env");
  console.warn(`  Se usa "${FALLBACK_STORE_DOMAIN}" solo como respaldo (proyecto antiguo).`);
  console.warn("  Si TU tienda es otra → Admin → … → Información → copia xxx.myshopify.com");
  console.warn("  En .env: SHOPIFY_STORE_DOMAIN=xxx.myshopify.com (y el token de ESA tienda)");
  console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.warn("");
}

const PREFERRED_PORT = Number(process.env.PORT || 5173);
/** Puerto real tras arrancar (puede subir si el preferido está ocupado). */
let listeningPort = PREFERRED_PORT;
/** Raíz del proyecto: cualquier URL `/ruta/archivo` sirve `ROOT/ruta/archivo` (HTML, CSS, JS, `/assets/…`, fuentes, etc.). */
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const abs = path.join(ROOT, rel);
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", `http://127.0.0.1:${listeningPort}`);

  if (u.pathname === "/nx-shopify-config.json") {
    // Releer .env en cada petición: si pegaste el token después de arrancar el servidor,
    // así se aplica sin reiniciar (override: true actualiza vars que quedaron vacías al inicio).
    dotenv.config({ path: path.join(__dirname, ".env"), override: true });
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
    const fromEnvDomain = String(process.env.SHOPIFY_STORE_DOMAIN || "").trim();
    const storeDomain = fromEnvDomain || FALLBACK_STORE_DOMAIN;
    const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-04";
    const body = JSON.stringify({
      storefrontAccessToken: token,
      storeDomain,
      apiVersion,
      _meta: {
        storeDomainFromEnv: Boolean(fromEnvDomain),
        fallbackStoreDomain: !fromEnvDomain ? FALLBACK_STORE_DOMAIN : "",
      },
    });
    return send(res, 200, body, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
  }

  let filePath = safePath(u.pathname);
  if (!filePath) return send(res, 404, "Not found");

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      const indexHtml = path.join(ROOT, "index.html");
      if (u.pathname === "/" && fs.existsSync(indexHtml)) {
        filePath = indexHtml;
      } else return send(res, 404, "Not found");
    }

    fs.readFile(filePath, (e, data) => {
      if (e) return send(res, 500, "Error");
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";
      send(res, 200, data, { "Content-Type": type });
    });
  });
});

const MAX_PORT_TRIES = 30;
let startupBannerPrinted = false;

function onListening() {
  if (startupBannerPrinted) return;
  startupBannerPrinted = true;
  warnWhenStoreDomainMissing();
  if (listeningPort !== PREFERRED_PORT) {
    console.warn(`(El puerto preferido ${PREFERRED_PORT} estaba en uso.)`);
  }
  console.log(`Nexorien dev: http://127.0.0.1:${listeningPort}/`);
  console.log("Config Storefront: .env → SHOPIFY_STOREFRONT_ACCESS_TOKEN");
}

server.on("error", (err) => {
  if (err.code !== "EADDRINUSE") throw err;
  const next = listeningPort + 1;
  if (next > PREFERRED_PORT + MAX_PORT_TRIES) {
    console.error(
      `No hay puerto libre entre ${PREFERRED_PORT} y ${PREFERRED_PORT + MAX_PORT_TRIES}. Cierra otros "npm run dev" o define PORT en .env.`
    );
    process.exit(1);
  }
  console.warn(`Puerto ${listeningPort} ocupado; probando ${next}…`);
  listeningPort = next;
  server.listen(listeningPort, onListening);
});

server.listen(listeningPort, onListening);
