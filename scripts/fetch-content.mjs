// Prebuild step: refresh db/seed.json from the published content snapshot, and write every
// uploaded picture out as a real file, before Astro builds. Runs via `npm run build`.
//
// - If CONTENT_URL is set (Cloudflare production build), fetch that JSON (served by
//   functions/content.js out of D1) and write it to db/seed.json IN THE BUILD WORKSPACE. On
//   Cloudflare the workspace is ephemeral, so the committed seed.json is never changed.
// - Then download each /uploads/<key> the content refers to from /media/<key> and write it
//   into public/uploads/, so Astro copies it into the site. After this step the pictures are
//   ordinary static files: visitors are served them by the CDN and never touch the database.
// - If CONTENT_URL is not set (local dev/build), do nothing: the site builds from the
//   committed db/seed.json baseline.
import { writeFileSync, mkdirSync } from 'node:fs';

const url = process.env.CONTENT_URL;
const seedPath = new URL('../db/seed.json', import.meta.url);
const uploadsDir = new URL('../public/uploads/', import.meta.url);

/** Every distinct "/uploads/<key>" appearing anywhere in the content. */
function uploadKeys(data) {
  const keys = new Set();
  const walk = (v) => {
    if (typeof v === 'string') {
      const m = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(v);
      if (m) keys.add(m[1]);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(data);
  return [...keys];
}

if (!url) {
  console.log('[content] no CONTENT_URL set; building from committed db/seed.json');
} else {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data || !data.entries || !data.singletons) throw new Error('snapshot missing entries/singletons');
    writeFileSync(seedPath, JSON.stringify(data, null, 2));
    console.log('[content] built from the published snapshot at ' + url);

    const keys = uploadKeys(data);
    if (keys.length) {
      mkdirSync(uploadsDir, { recursive: true });
      const base = new URL('./media/', new URL(url));
      let done = 0, failed = 0;
      // Sequential on purpose: a few dozen small files, and it keeps the build log readable.
      for (const key of keys) {
        try {
          const r = await fetch(new URL(key, base));
          if (!r.ok) throw new Error('HTTP ' + r.status);
          writeFileSync(new URL(key, uploadsDir), Buffer.from(await r.arrayBuffer()));
          done++;
        } catch (e) {
          // A missing picture must not fail the whole site; the page renders without it and
          // the build log says which one.
          console.warn('[content] could not fetch /uploads/' + key + ' (' + e.message + ')');
          failed++;
        }
      }
      console.log('[content] wrote ' + done + ' uploaded picture(s)' + (failed ? ', ' + failed + ' missing' : ''));
    }
  } catch (e) {
    // Fail loudly rather than quietly shipping the committed baseline. CONTENT_URL being set
    // means this is a real production build, and the baseline is months behind the database:
    // a transient blip here used to revert the whole live site to old content, with the build
    // reported as successful and nothing to say why the site had changed on its own. A failed
    // build leaves the previous deploy serving, which is the safe outcome.
    console.error('[content] snapshot fetch FAILED (' + e.message + ')');
    console.error('[content] refusing to build from the stale committed baseline. Retry the deploy.');
    process.exit(1);
  }
}
