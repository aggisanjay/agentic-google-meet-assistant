// Bakes real land geography (Natural Earth 110m via world-atlas) into a compact binary of lon/lat points.
// Output: public/data/land.bin  (Int16 pairs: lon*100, lat*100). Run: node scripts/make-land-points.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("world-atlas/land-110m.json"), "utf8"));
const land = feature(topo, topo.objects.land);

const N = 30000; // Fibonacci lattice => near-uniform density on the sphere
const golden = Math.PI * (3 - Math.sqrt(5));
const pts = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const lat = (Math.asin(y) * 180) / Math.PI;
  let lon = ((i * golden * 180) / Math.PI) % 360;
  if (lon > 180) lon -= 360;
  if (geoContains(land, [lon, lat])) pts.push(lon, lat);
}
const arr = new Int16Array(pts.length);
for (let i = 0; i < pts.length; i++) arr[i] = Math.round(pts[i] * 100);
mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/land.bin", Buffer.from(arr.buffer));
console.log(`land points: ${pts.length / 2} (${(arr.byteLength / 1024).toFixed(0)} KB)`);
