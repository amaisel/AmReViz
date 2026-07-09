/**
 * Downloads a public-domain lead image for each event from Wikipedia /
 * Wikimedia Commons into public/events/, so the app serves them locally
 * instead of hotlinking. Run once (and re-run after adding events):
 *
 *   npm run fetch:images
 *
 * Writes public/events/manifest.json with the source file and attribution
 * for every image. Events whose image can't be resolved are reported and
 * fall back to in-browser resolution at runtime.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { events } = await import('../src/data/events.js');

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'events');
mkdirSync(outDir, { recursive: true });

const TARGET_WIDTH = 1200;
const UA = 'AmReViz/1.0 (https://github.com/amaisel/AmReViz; educational visualization)';

// Turn a Commons original-file URL into a width-limited thumbnail URL.
function thumbUrl(originalUrl, width) {
  const m = originalUrl.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/(.+\/)?([^/]+)$/);
  if (!m) return originalUrl;
  const [, base, hash = '', name] = m;
  if (hash.startsWith('thumb/')) return originalUrl; // already a thumb
  let thumbName = `${width}px-${name}`;
  // Non-JPEG originals (PNG/TIF/SVG) are re-rendered; keep MediaWiki's naming
  if (/\.(tiff?|png|svg)$/i.test(name)) thumbName += /\.svg$/i.test(name) ? '.png' : '.jpg';
  return `${base}/thumb/${hash}${name}/${thumbName}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};
let failures = 0;

for (const event of events) {
  if (!event.wiki || !event.image) continue;
  const fileName = event.image.split('/').pop();
  const dest = join(outDir, fileName);
  if (existsSync(dest) && manifest[fileName]) {
    console.log(`- ${event.title}: already downloaded, skipping`);
    continue;
  }
  try {
    const summary = await fetchJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(event.wiki)}`
    );
    const original = summary.originalimage?.source;
    if (!original) throw new Error('article has no lead image');

    if (!existsSync(dest)) {
      const url = thumbUrl(original, TARGET_WIDTH);
      let res = await fetch(url, { headers: { 'User-Agent': UA } });
      // MediaWiki rejects thumb requests wider than the original — take the original
      if (!res.ok && url !== original) {
        res = await fetch(original, { headers: { 'User-Agent': UA } });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} downloading image`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }

    manifest[fileName] = {
      event: event.title,
      article: `https://en.wikipedia.org/wiki/${event.wiki}`,
      source: original,
    };
    console.log(`✓ ${event.title} → ${fileName}`);
  } catch (err) {
    failures++;
    console.error(`✗ ${event.title}: ${err.message}`);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nDone. ${Object.keys(manifest).length} images saved to public/events/` +
  (failures ? `, ${failures} FAILED (app falls back to Wikipedia at runtime for those)` : ''));
