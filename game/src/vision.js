// Emberveil — sight maths: segment tests, line of sight, and vision-cone polygons
// clipped ray by ray against the solid blocks of a level.

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // endpoints inside counts as touching the block
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  return segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y)
    || segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h)
    || segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h)
    || segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y);
}

/** True when nothing solid stands between two points. */
export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (const s of solids) if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  return true;
}

/** Distance a ray travels before it meets a solid (or reaches maxDist). */
export function rayDistance(x, y, angle, maxDist, solids) {
  const steps = 24;
  let last = 0;
  for (let i = 1; i <= steps; i += 1) {
    const d = (maxDist * i) / steps;
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    let inside = false;
    for (const s of solids) if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) { inside = true; break; }
    if (inside) return last + (d - last) / 2;
    last = d;
  }
  return maxDist;
}

/** The visible cone as a polygon: fan of rays around the guard's facing. */
export function conePolygon(guard, range, halfAngle, solids) {
  const points = [{ x: guard.x, y: guard.y }];
  const rays = 22;
  for (let i = 0; i <= rays; i += 1) {
    const a = guard.angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = rayDistance(guard.x, guard.y, a, range, solids);
    points.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return points;
}

/** Can this guard see the point right now (range, angle, line of sight)? */
export function guardSees(guard, x, y, range, halfAngle, solids) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  if (dist > 14 && Math.abs(angleDifference(Math.atan2(dy, dx), guard.angle)) > halfAngle) return { seen: false, dist };
  if (!lineOfSightClear(guard.x, guard.y, x, y, solids)) return { seen: false, dist };
  return { seen: true, dist };
}
