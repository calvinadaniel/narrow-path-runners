/** Generate favicons + sync logos from assets/np-logo-white-bg.jpeg */
import { copyFileSync } from "node:fs";
import sharp from "sharp";

const src = "assets/np-logo-white-bg.jpeg";
copyFileSync(src, "public/logo.jpeg");

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const px = Buffer.from(data);
const at = (x, y) => (y * w + x) * 4;
const isBg = (i) => {
  const r = px[i],
    g = px[i + 1],
    b = px[i + 2];
  return r > 220 && g > 220 && b > 210 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
};
const seen = new Uint8Array(w * h);
const q = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const p = y * w + x;
  if (seen[p] || !isBg(at(x, y))) return;
  seen[p] = 1;
  q.push(p);
};
for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}
for (let i = 0; i < q.length; i++) {
  const p = q[i];
  const x = p % w;
  const y = (p / w) | 0;
  px[p * 4 + 3] = 0;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}
await sharp(px, { raw: { width: w, height: h, channels: 4 } })
  .trim()
  .png()
  .toFile("public/logo.png");

const meta = await sharp(src).metadata();
const crop = Math.round(Math.min(meta.width, meta.height) * 0.55);
const left = Math.round((meta.width - crop) / 2);
const top = Math.round(meta.height * 0.12);
const square = sharp(src).extract({ left, top, width: crop, height: crop });
await square.clone().resize(32, 32).png().toFile("app/icon.png");
await square.clone().resize(180, 180).png().toFile("app/apple-icon.png");
await square.clone().resize(32, 32).png().toFile("public/favicon.ico");

console.log("logos + favicons generated");
