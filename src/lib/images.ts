import data from "../data/images.json";

export type Slot = keyof typeof data;
export type UnsplashImage = (typeof data)[Slot];

export const images = data;

/** Builds an imgix URL for an Unsplash raw photo URL. */
export function src(img: UnsplashImage, width: number, ratio?: number) {
  const params = new URLSearchParams({ w: String(width), q: "72", auto: "format", fit: "crop" });
  if (ratio) params.set("h", String(Math.round(width / ratio)));
  return `${img.url}&${params}`;
}

export function srcset(img: UnsplashImage, ratio?: number, widths = [480, 800, 1200, 1600]) {
  return widths.map((w) => `${src(img, w, ratio)} ${w}w`).join(", ");
}
