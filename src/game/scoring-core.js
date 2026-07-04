/* =====================================================================
 * SCORING CORE — shared helpers and the instruction registry.
 *
 * Each instruction is { name, desc, score(board) } where score is a
 * pure function of the board. Mountains count as FILLED for row
 * completion, but they are never part of any improvement: group
 * finding, adjacency and type counts all skip them.
 *
 * The registry below is how instructions plug in. Every file in
 * src/instructions/ calls registerInstruction({ deal() { ... } }); the
 * build concatenates those files after this one, so INSTRUCTION_TEMPLATES
 * ends up holding all of them. To add a new instruction, drop a new file
 * in that folder — nothing here needs to change.
 * ===================================================================== */

const INSTRUCTION_TEMPLATES = [];

/** Register one instruction template. `template.deal()` returns a concrete
 *  instruction ({name, desc, score}) with any random target locked in. */
function registerInstruction(template){
  INSTRUCTION_TEMPLATES.push(template);
}

/** Flood fill: contiguous same-type improvement groups (mountains excluded). */
function findTypeGroups(board){
  const visited = new Array(GRID_SIZE * GRID_SIZE).fill(false);
  const groups = [];
  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      const startIndex = cellIndex(row, col);
      const value = board[startIndex];
      if(visited[startIndex] || value === null || value === MOUNTAIN) continue;

      const groupCells = [];
      const stack = [[row, col]];
      visited[startIndex] = true;
      while(stack.length){
        const [r, c] = stack.pop();
        groupCells.push([r, c]);
        for(const [dr, dc] of ORTHOGONAL_NEIGHBOURS){
          const nr = r + dr, nc = c + dc;
          if(isInsideGrid(nr, nc)
              && !visited[cellIndex(nr, nc)]
              && board[cellIndex(nr, nc)] === value){
            visited[cellIndex(nr, nc)] = true;
            stack.push([nr, nc]);
          }
        }
      }
      groups.push({type: value, cells: groupCells});
    }
  }
  return groups;
}

const chipHtml = typeId =>
  `<span class="chip" style="background:${TYPE_HEX[typeId]}"></span>${TYPE_NAME[typeId]}`;

/** Count tiles of `typeId` that have at least one neighbour passing `test`. */
function countTilesWithNeighbour(board, typeId, test){
  let count = 0;
  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      if(board[cellIndex(row, col)] !== typeId) continue;
      const hasIt = ORTHOGONAL_NEIGHBOURS.some(([dr, dc]) => {
        const nr = row + dr, nc = col + dc;
        return isInsideGrid(nr, nc) && test(board[cellIndex(nr, nc)]);
      });
      if(hasIt) count++;
    }
  }
  return count;
}
