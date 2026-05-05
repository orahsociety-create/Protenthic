import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const inputPath = getArg("--in");
const outputPath = getArg("--out");
const mode = (getArg("--mode") ?? "remove-black").toLowerCase();
const threshold = Number(getArg("--threshold") ?? "22"); // 0..255
const feather = Number(getArg("--feather") ?? "28"); // 0..255

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/make-logo-transparent.mjs --in <input> --out <output> [--mode remove-black|remove-white] [--threshold N] [--feather N]"
  );
  process.exit(2);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(2);
}

const removeBlack = mode === "remove-black";
const removeWhite = mode === "remove-white";
if (!removeBlack && !removeWhite) {
  console.error(`Unknown --mode: ${mode}`);
  process.exit(2);
}

function clampByte(n) {
  return Math.max(0, Math.min(255, n | 0));
}

function alphaFromDistance(d) {
  // d <= threshold   => alpha 0
  // d >= threshold+feather => alpha 255
  const t0 = threshold;
  const t1 = threshold + feather;
  if (d <= t0) return 0;
  if (d >= t1) return 255;
  const x = (d - t0) / (t1 - t0);
  return clampByte(Math.round(x * 255));
}

const img = sharp(inputPath, { failOn: "none" }).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

const out = Buffer.from(data); // RGBA
for (let i = 0; i < out.length; i += 4) {
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];

  // Distance to key color (black or white) in RGB space.
  const dr = removeBlack ? r : 255 - r;
  const dg = removeBlack ? g : 255 - g;
  const db = removeBlack ? b : 255 - b;
  const d = Math.max(dr, dg, db); // cheaper than sqrt

  const a = alphaFromDistance(d);
  out[i + 3] = Math.min(out[i + 3], a);
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(
  `Wrote ${outputPath} (${info.width}x${info.height}) mode=${mode} threshold=${threshold} feather=${feather}`
);
