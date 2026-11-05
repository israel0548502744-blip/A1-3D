// Core slicing: a triangle soup (world-space) -> closed contour polygons per
// layer. Framework-free and pure so it can be unit-tested in Node.

export interface Pt {
  x: number;
  y: number;
}
export interface Layer {
  z: number;
  contours: Pt[][]; // closed loops (first point != last)
}
export interface SliceOptions {
  layerHeight: number;
  firstLayerHeight: number;
}

const Q = 1000; // quantise to 1 micron for endpoint matching
const key = (x: number, y: number) => `${Math.round(x * Q)},${Math.round(y * Q)}`;

/** Intersect one triangle with the horizontal plane z=zp; returns 0 or 2 points. */
function triPlane(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
  zp: number,
  out: Pt[],
): void {
  out.length = 0;
  const edges: [number, number, number, number, number, number][] = [
    [ax, ay, az, bx, by, bz],
    [bx, by, bz, cx, cy, cz],
    [cx, cy, cz, ax, ay, az],
  ];
  for (const [x0, y0, z0, x1, y1, z1] of edges) {
    const below0 = z0 < zp;
    const below1 = z1 < zp;
    if (below0 === below1) continue; // edge doesn't cross the plane
    const t = (zp - z0) / (z1 - z0);
    out.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
  }
}

function stitch(segments: [Pt, Pt][]): Pt[][] {
  // adjacency: point key -> list of { seg, end }
  const map = new Map<string, { seg: number; from: Pt; to: Pt }[]>();
  segments.forEach(([p, q], i) => {
    const kp = key(p.x, p.y);
    const kq = key(q.x, q.y);
    if (!map.has(kp)) map.set(kp, []);
    if (!map.has(kq)) map.set(kq, []);
    map.get(kp)!.push({ seg: i, from: p, to: q });
    map.get(kq)!.push({ seg: i, from: q, to: p });
  });
  const used = new Array(segments.length).fill(false);
  const loops: Pt[][] = [];

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const start = segments[i][0];
    const loop: Pt[] = [start];
    let cur = segments[i][1];
    let guard = 0;
    while (guard++ < segments.length + 2) {
      loop.push(cur);
      if (key(cur.x, cur.y) === key(start.x, start.y)) {
        loop.pop(); // close without duplicating the first point
        break;
      }
      const cands = map.get(key(cur.x, cur.y)) ?? [];
      const next = cands.find((c) => !used[c.seg]);
      if (!next) break; // open contour (non-watertight) — keep what we have
      used[next.seg] = true;
      cur = next.to;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

export function sliceMesh(positions: Float32Array, opt: SliceOptions): Layer[] {
  // bounds in z
  let zmin = Infinity;
  let zmax = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i];
    if (z < zmin) zmin = z;
    if (z > zmax) zmax = z;
  }
  if (!isFinite(zmin)) return [];

  const layers: Layer[] = [];
  const buf: Pt[] = [];
  // Slice planes at the mid-height of each printed layer.
  let z = zmin + opt.firstLayerHeight / 2;
  let first = true;
  while (z < zmax) {
    const segs: [Pt, Pt][] = [];
    for (let t = 0; t < positions.length; t += 9) {
      const az = positions[t + 2];
      const bz = positions[t + 5];
      const cz = positions[t + 8];
      const minz = Math.min(az, bz, cz);
      const maxz = Math.max(az, bz, cz);
      if (z < minz || z > maxz) continue;
      triPlane(
        positions[t], positions[t + 1], az,
        positions[t + 3], positions[t + 4], bz,
        positions[t + 6], positions[t + 7], cz,
        z, buf,
      );
      if (buf.length === 2) segs.push([{ ...buf[0] }, { ...buf[1] }]);
    }
    if (segs.length > 0) {
      layers.push({ z, contours: stitch(segs) });
    }
    z += first ? opt.firstLayerHeight / 2 + opt.layerHeight / 2 : opt.layerHeight;
    first = false;
  }
  return layers;
}

export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  }
  return a / 2;
}
