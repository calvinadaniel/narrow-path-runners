import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { buildPhotoEntries } from "./upload-photos-helpers";

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: npm run upload-photos -- <folder-of-images>");
    process.exit(1);
  }

  const dir = path.resolve(folder);
  const filenames = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

  if (filenames.length === 0) {
    console.error(`No images found in ${dir}`);
    process.exit(1);
  }

  const urls: string[] = [];
  for (const filename of filenames) {
    const filePath = path.join(dir, filename);
    const buffer = fs.readFileSync(filePath);
    const blob = await put(filename, buffer, { access: "public" });
    urls.push(blob.url);
    console.log(`Uploaded ${filename} -> ${blob.url}`);
  }

  const entries = buildPhotoEntries(filenames, urls);
  console.log('\nPaste this into the race or gallery JSON\'s "photos" array:\n');
  console.log(JSON.stringify(entries, null, 2));
}

main();
