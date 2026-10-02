// Fetches photos from the Unsplash API once and stores URLs + attribution
// in src/data/images.json, so the site never calls the API at runtime.
// Usage: pnpm images   (needs UNSPLASH_ACCESS_KEY in .env)
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) throw new Error("UNSPLASH_ACCESS_KEY missing (add it to .env)");

// slot: [search query, orientation (or null), result index]
// Pass slot names as arguments to refetch only those: pnpm images hero yoga
const SLOTS = {
  hero: ["group running city", "portrait", 0],
  heroAlt: ["group yoga outdoors", null, 1],
  heroThird: ["outdoor group workout", null, 9],
  member: ["running group together", null, 0],
  trainer: ["outdoor group workout", null, 5],
  yoga: ["yoga park", "landscape", 0],
  vereniging: ["football training team", "landscape", 0],
  sportschool: ["gym strength training", "landscape", 0],
  buurt: ["people walking park", "landscape", 0],
  cycling: ["group cycling road", "landscape", 0],
  boxing: ["boxing gym", "portrait", 0],
  swimming: ["swimming pool lanes", "landscape", 0],
  footer: ["friends running sunset", "landscape", 0],
};

const api = (path) =>
  fetch(`https://api.unsplash.com${path}`, {
    headers: { Authorization: `Client-ID ${KEY}`, "Accept-Version": "v1" },
  }).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${path}`);
    return r.json();
  });

const file = new URL("../src/data/images.json", import.meta.url);
const only = process.argv.slice(2);
const out = only.length ? JSON.parse(await readFile(file, "utf8")) : {};
for (const [slot, [query, orientation, index]] of Object.entries(SLOTS)) {
  if (only.length && !only.includes(slot)) continue;
  const q = new URLSearchParams({ query, per_page: "12", content_filter: "high" });
  if (orientation) q.set("orientation", orientation);
  const { results } = await api(`/search/photos?${q}`);
  const p = results[index];
  if (!p) throw new Error(`No result for "${query}"`);
  out[slot] = {
    id: p.id,
    url: p.urls.raw,
    alt: p.alt_description ?? query,
    color: p.color,
    width: p.width,
    height: p.height,
    author: p.user.name,
    authorUrl: `${p.user.links.html}?utm_source=unclub&utm_medium=referral`,
    photoUrl: `${p.links.html}?utm_source=unclub&utm_medium=referral`,
  };
  // Unsplash API guidelines: register usage of the photo.
  await api(new URL(p.links.download_location).pathname + new URL(p.links.download_location).search);
  console.log(`${slot.padEnd(12)} ${p.id}  ${out[slot].alt}  (${p.user.name})`);
}

await writeFile(file, JSON.stringify(out, null, 2) + "\n");
