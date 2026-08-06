/** Generate logos + favicons from assets/np-logo-white-bg.jpeg */
import { copyFileSync, unlinkSync, existsSync } from "node:fs";
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
  return r > 240 && g > 240 && b > 240;
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
copyFileSync("public/logo.png", "public/npr-logo.png");

const cream = { r: 247, g: 243, b: 235 };
const mark = await sharp("public/npr-logo.png")
  .resize(512, 512, { fit: "contain", background: cream })
  .flatten({ background: cream })
  .png()
  .toBuffer();

await sharp(mark).resize(48, 48).png().toFile("app/icon.png");
await sharp(mark).resize(48, 48).png().toFile("public/icon.png");
await sharp(mark).resize(48, 48).png().toFile("public/favicon.ico");
await sharp(mark).resize(180, 180).png().toFile("app/apple-icon.png");
await sharp(mark).resize(180, 180).png().toFile("public/apple-icon.png");
await sharp(mark).png().toFile("public/icon-512.png");

if (existsSync("app/favicon.ico")) unlinkSync("app/favicon.ico");

console.log("logos + favicons generated");
