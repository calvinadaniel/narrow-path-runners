import fs from "fs";
import path from "path";

export function getAboutContent(): string {
  const filePath = path.join(process.cwd(), "content", "about.mdx");
  return fs.readFileSync(filePath, "utf-8");
}
