/* =====================================================================
 * CONSTANTS — the fixed dimensions and rhythm of the year.
 *
 * (Improvement types and their per-type data live in types.js; the
 * polyomino shape library lives in shapes.js.)
 * ===================================================================== */

const GRID_SIZE = 11;
const TOTAL_TURNS = 21;
const MOUNTAIN_COUNT = 5;
const MOUNTAIN = "mountain";

const SEASONS = [
  {name:"Spring", turns:6},
  {name:"Summer", turns:6},
  {name:"Autumn", turns:5},
  {name:"Winter", turns:4},
];
// Turn index (0-based) at which each season ENDS: after these many
// placements, that season's instructions are scored and banked.
const SEASON_END = [6, 12, 17, 21];

const ORTHOGONAL_NEIGHBOURS = [[-1,0],[1,0],[0,-1],[0,1]];
