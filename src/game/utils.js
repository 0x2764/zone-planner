/* =====================================================================
 * SMALL UTILITIES — pure helpers shared across the game.
 * ===================================================================== */

const randomItem = array => array[Math.floor(Math.random() * array.length)];
const cellIndex = (row, col) => row * GRID_SIZE + col;
const cellRowCol = index => ({row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE});
const isInsideGrid = (row, col) =>
  row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
const deepClone = value => JSON.parse(JSON.stringify(value));

function shuffledCopy(array){
  const copy = [...array];
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick a shape key using the weight table for the given type. */
function randomShapeForType(typeId){
  const weights = SHAPE_WEIGHTS[typeId];
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let remaining = Math.random() * totalWeight;
  for(const [shape, weight] of entries){
    remaining -= weight;
    if(remaining <= 0) return shape;
  }
  return entries[0][0];
}
