/* =====================================================================
 * MOUNTAINS — the permanent, unbuildable peaks.
 * ===================================================================== */

/**
 * Scatter MOUNTAIN_COUNT single peaks: each at least two cells from
 * the board edge (rows/cols 2..8) and no two within touching range
 * of each other (Chebyshev distance >= 2), so they read as distinct
 * peaks rather than a range.
 */
function generateMountainCells(){
  for(let attempt = 0; attempt < 200; attempt++){
    const peaks = [];
    let guard = 0;
    while(peaks.length < MOUNTAIN_COUNT && guard++ < 500){
      const row = 2 + Math.floor(Math.random() * 7);
      const col = 2 + Math.floor(Math.random() * 7);
      const clear = peaks.every(([pr, pc]) =>
        Math.max(Math.abs(pr - row), Math.abs(pc - col)) >= 2);
      if(clear) peaks.push([row, col]);
    }
    if(peaks.length === MOUNTAIN_COUNT) return peaks;
  }
  // Deterministic fallback (practically unreachable).
  return [[2,2],[2,8],[5,5],[8,2],[8,8]];
}
