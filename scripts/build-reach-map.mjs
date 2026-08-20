// Regenerates src/data/reach-map.ts from authoritative country borders.
//
//   node scripts/build-reach-map.mjs /tmp/geo
//
// Source: github.com/mledoze/countries (<cca3>.geo.json). Projection is equirectangular
// with x = lon * 0.9, y = -lat, chosen because cos(25 deg) is 0.906 and the map is centred
// on the Gulf, so shapes stay close to true at the latitudes that matter here.
//
// Simplification is Douglas-Peucker at TOL degrees. The map draws ~700px across a 69.8 deg
// span, so one pixel is about 0.1 deg; a tolerance an order of magnitude finer than that is
// beyond what any screen can resolve. Rings smaller than MIN_RING are dropped, which removes
// slivers no larger than a pixel while keeping real islands such as Socotra.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2] || '/tmp/geo';
const TOL = 0.01;      // degrees
const MIN_RING = 0.02; // degrees, bounding-box diagonal

const perp = (p, a, b) => {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const cx = x1 + Math.max(0, Math.min(1, t)) * dx;
  const cy = y1 + Math.max(0, Math.min(1, t)) * dy;
  return Math.hypot(x - cx, y - cy);
};
const simplify = (pts, tol) => {
  if (pts.length < 3) return pts;
  let idx = 0, max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
};

const ringsOf = (geom) => geom.type === 'Polygon' ? geom.coordinates
  : geom.type === 'MultiPolygon' ? geom.coordinates.flat() : [];

const paths = {};
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
  const cc = file.replace('.json', '');
  const fc = JSON.parse(readFileSync(join(SRC, file), 'utf8'));
  let d = '';
  for (const feat of fc.features) {
    for (const ring of ringsOf(feat.geometry)) {
      const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
      const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      if (diag < MIN_RING) continue;                    // sliver, sub-pixel at any size
      const pts = simplify(ring.map(([lon, lat]) => [lon * 0.9, -lat]), TOL);
      if (pts.length < 3) continue;
      d += 'M' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L') + 'Z';
    }
  }
  paths[cc] = d;
}

const src = readFileSync('src/data/reach-map.ts', 'utf8');
const head = src.slice(0, src.indexOf('  paths: {'));
const body = '  paths: {\n' + Object.entries(paths)
  .map(([cc, d]) => `    ${cc}: ${JSON.stringify(d)},`).join('\n') + '\n  },\n};\n';
writeFileSync('src/data/reach-map.ts', head + body);
console.log(`regenerated ${Object.keys(paths).length} countries, tol ${TOL} deg`);
