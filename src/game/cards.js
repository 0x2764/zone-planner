/* =====================================================================
 * CARDS — creating, transforming and placing improvement cards.
 *
 * A CARD is { type, name, cells: [{row, col}, ...] } — offsets from the
 * card's own top-left corner. All cells share the card's single type.
 * ===================================================================== */

/** Build the year's 20-card deck. Types are uniform; shapes lean per type.
 *  No card (type+shape combination) appears more than once in a deck. */
function createDeck(){
  const deck = [];
  const seen = new Set();
  while(deck.length < TOTAL_TURNS){
    const type = randomItem(TYPES).id;
    const shape = randomShapeForType(type);
    const key = type + ":" + shape;
    if(seen.has(key)) continue;      // already dealt this card — redraw
    seen.add(key);
    deck.push({
      type,
      name: CARD_NAMES[type][shape],
      cells: SHAPES[shape].map(([row, col]) => ({row, col})),
    });
  }
  return deck;
}

/** The 1×1 the council grants when the dealt card fits nowhere. */
function createGrantCard(typeId){
  return {type: typeId, name:"Council Grant", cells:[{row:0, col:0}]};
}

function normaliseCells(cells){
  const minRow = Math.min(...cells.map(c => c.row));
  const minCol = Math.min(...cells.map(c => c.col));
  cells.forEach(c => { c.row -= minRow; c.col -= minCol; });
  return cells;
}

/** Return a new card rotated 90 degrees clockwise. */
function rotateCardClockwise(card){
  const height = Math.max(...card.cells.map(c => c.row)) + 1;
  const rotated = card.cells.map(c => ({row: c.col, col: height - 1 - c.row}));
  return {...card, cells: normaliseCells(rotated)};
}

/** Return a new card mirrored left-to-right. */
function flipCardHorizontally(card){
  const width = Math.max(...card.cells.map(c => c.col)) + 1;
  const flipped = card.cells.map(c => ({row: c.row, col: width - 1 - c.col}));
  return {...card, cells: normaliseCells(flipped)};
}

/** The cell nearest the centroid sits under the cursor. */
function findAnchorCellIndex(card){
  const cells = card.cells;
  const centroidRow = cells.reduce((s, c) => s + c.row, 0) / cells.length;
  const centroidCol = cells.reduce((s, c) => s + c.col, 0) / cells.length;
  let bestIndex = 0, bestDistance = Infinity;
  cells.forEach((cell, i) => {
    const d = (cell.row - centroidRow) ** 2 + (cell.col - centroidCol) ** 2;
    if(d < bestDistance){ bestDistance = d; bestIndex = i; }
  });
  return bestIndex;
}

/** Absolute board cells the card would cover if placed at the cursor. */
function getPlacementCells(card, cursorRow, cursorCol){
  const anchor = card.cells[findAnchorCellIndex(card)];
  return card.cells.map(cell => ({
    row: cursorRow + cell.row - anchor.row,
    col: cursorCol + cell.col - anchor.col,
  }));
}

/** Valid iff every cell is on the board and open land (not built, not mountain). */
function isPlacementValid(board, placementCells){
  return placementCells.every(({row, col}) =>
    isInsideGrid(row, col) && board[cellIndex(row, col)] === null
  );
}

/** Can this card be placed ANYWHERE, in any orientation? */
function cardFitsSomewhere(board, card){
  let candidate = card;
  for(let flip = 0; flip < 2; flip++){
    for(let rotation = 0; rotation < 4; rotation++){
      for(let row = 0; row < GRID_SIZE; row++){
        for(let col = 0; col < GRID_SIZE; col++){
          if(isPlacementValid(board, getPlacementCells(candidate, row, col))){
            return true;
          }
        }
      }
      candidate = rotateCardClockwise(candidate);
    }
    candidate = flipCardHorizontally(candidate);
  }
  return false;
}
