export interface PhotoEntry {
  url: string;
  caption: string;
}

export function captionFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]/g, " ").trim();
}

export function buildPhotoEntries(filenames: string[], urls: string[]): PhotoEntry[] {
  if (filenames.length !== urls.length) {
    throw new Error("filenames and urls must be the same length");
  }
  return filenames.map((filename, i) => ({
    url: urls[i],
    caption: captionFromFilename(filename),
  }));
}
