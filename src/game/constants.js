/* =====================================================================
 * CONSTANTS — the fixed dimensions and rhythm of the year.
 *
 * (Improvement types and their per-type data live in types.js; the
 * polyomino shape library lives in shapes.js.)
 * ===================================================================== */

const GRID_SIZE = 11;
const MOUNTAIN_COUNT = 5;
const MOUNTAIN = "mountain";

const SEASONS = [
  {name:"Spring", turns:6},
  {name:"Summer", turns:6},
  {name:"Autumn", turns:5},
  {name:"Winter", turns:4},
];
// Turn index (0-based) at which each season ENDS: after these many
// placements, that season's instructions are scored and banked. Built as
// the running total of per-season turns, so SEASONS is the single source
// of truth for the rhythm of the year.
const SEASON_END = SEASONS.reduce((ends, season) => {
  ends.push((ends[ends.length - 1] || 0) + season.turns);
  return ends;
}, []);
// The year's length is the last season's end — the sum of all season turns.
const TOTAL_TURNS = SEASON_END[SEASON_END.length - 1];

const ORTHOGONAL_NEIGHBOURS = [[-1,0],[1,0],[0,-1],[0,1]];
