// Pure, unit-testable snapping engine for the canvas editor.
//
// All values are in a single 1-D coordinate space per axis (canvas pixels).
// The caller is responsible for converting screen<->canvas and
// parent-relative<->absolute before calling in, and for converting the
// returned delta back to whatever space it needs.

export interface SnapResult {
  /** Amount to ADD to `candidate` to land it exactly on `target`. */
  delta: number;
  /** The target value that was snapped to. */
  target: number;
  /** The candidate value that snapped. */
  candidate: number;
}

/**
 * Find the single best snap across every (candidate, target) pair.
 *
 * "Best" = smallest absolute distance that is still within `threshold`.
 * Returns null when no pair is within threshold (or either list is empty).
 *
 * The returned `delta` is `target - candidate`, i.e. add it to the moving
 * geometry to snap it onto the target.
 */
export function computeSnap(
  candidates: number[],
  targets: number[],
  threshold: number,
): SnapResult | null {
  let best: SnapResult | null = null;
  let bestDist = Infinity;

  for (const c of candidates) {
    for (const t of targets) {
      const delta = t - c;
      const dist = Math.abs(delta);
      if (dist <= threshold && dist < bestDist) {
        bestDist = dist;
        best = { delta, target: t, candidate: c };
      }
    }
  }

  return best;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoxSnapResult {
  /** Snapped top-left x (may equal box.x if no x snap). */
  x: number;
  /** Snapped top-left y (may equal box.y if no y snap). */
  y: number;
  /** True when the x-axis snapped to a vertical target. */
  snappedX: boolean;
  /** True when the y-axis snapped to a horizontal target. */
  snappedY: boolean;
  /** The vertical target hit (x value), or null. */
  targetX: number | null;
  /** The horizontal target hit (y value), or null. */
  targetY: number | null;
}

/**
 * Snap a moving box's left/center/right edges against vertical targets and its
 * top/middle/bottom edges against horizontal targets. Returns the adjusted
 * top-left plus which targets were hit (for snap-line feedback).
 *
 * `vTargets` are x positions (vertical guide lines); `hTargets` are y positions
 * (horizontal guide lines). The box's width/height are preserved — only the
 * origin moves.
 */
export function snapBox(
  box: Box,
  vTargets: number[],
  hTargets: number[],
  threshold: number,
): BoxSnapResult {
  const xCandidates = [box.x, box.x + box.w / 2, box.x + box.w];
  const yCandidates = [box.y, box.y + box.h / 2, box.y + box.h];

  const sx = computeSnap(xCandidates, vTargets, threshold);
  const sy = computeSnap(yCandidates, hTargets, threshold);

  return {
    x: box.x + (sx ? sx.delta : 0),
    y: box.y + (sy ? sy.delta : 0),
    snappedX: !!sx,
    snappedY: !!sy,
    targetX: sx ? sx.target : null,
    targetY: sy ? sy.target : null,
  };
}
