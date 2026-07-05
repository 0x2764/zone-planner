/* =====================================================================
 * GAME STATE — the year in progress, and the moves that advance it.
 *
 * Everything here is plain JSON data (instruction score functions live
 * in seasonPlans, which is rebuilt each game and never mutated mid-game),
 * so undo snapshots are simple deep clones.
 * ===================================================================== */

let board;            // 121 slots: null | "mountain" | type id
let deck;             // the year's 20 improvement cards (never mutated)
let turnIndex;        // how many builds have been placed (0..20)
let currentCard;      // the card in hand (a clone, so rotation is safe)
let lastPlacedCard;   // the just-placed card, kept on show during the tally
let grantPending;     // true when the dealt card fits nowhere
let seasonPlans;      // [ [instr, instr], x4 ] — dealt at game start
let bankedSeasons;    // [{lines:[{name,pts}], subtotal}] in season order
let undoHistory;
let tilesPlacedCount;
let isGameOver;
let fxSeasonIndex = -1;  // season being replayed by the scoring tally, -1 when idle

// Tap-to-draw placement. `allPlacements` is every valid placement of the
// current card; each tap on a cell constrains the working set down to the
// `candidatePlacements` that cover all `selectedCells`, until one remains.
let allPlacements = [];        // [[cellIndex, ...], ...] — every valid placement
let selectedCells = [];        // cell indices the player has tapped as constraints
let candidatePlacements = [];  // allPlacements still covering every selectedCell

/** Recompute the placement working set for the current card and board,
 *  clearing any in-progress selection. Call whenever the card or board changes. */
function refreshPlacements(){
  allPlacements = (currentCard && !grantPending)
    ? allValidPlacements(board, currentCard) : [];
  selectedCells = [];
  candidatePlacements = allPlacements;
}

/** Which season is currently being played? Returns 4 after winter. */
function currentSeasonIndex(){
  for(let s = 0; s < SEASONS.length; s++){
    if(turnIndex < SEASON_END[s]) return s;
  }
  return SEASONS.length;
}

/** 1-based build number within the current season. */
function turnWithinSeason(){
  const s = currentSeasonIndex();
  const seasonStart = s === 0 ? 0 : SEASON_END[s - 1];
  return turnIndex - seasonStart + 1;
}

/** Reset everything and start a fresh year. */
function newGame(){
  cancelSeasonScoring();
  board = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  for(const [row, col] of generateMountainCells()){
    board[cellIndex(row, col)] = MOUNTAIN;
  }

  deck = createDeck();

  // Deal 8 distinct instruction templates, two per season, letting
  // each lock in its random parameters for the year.
  const dealt = shuffledCopy(INSTRUCTION_TEMPLATES).slice(0, 8).map(t => t.deal());
  seasonPlans = [dealt.slice(0,2), dealt.slice(2,4), dealt.slice(4,6), dealt.slice(6,8)];

  turnIndex = 0;
  bankedSeasons = [];
  undoHistory = [];
  tilesPlacedCount = 0;
  isGameOver = false;

  startTurn();
  document.getElementById("overlay").classList.add("hidden");
  renderAll();
}

/**
 * Deal the next card from the deck. If it fits nowhere in any
 * orientation, the council instead grants a 1×1 of the player's
 * choice — grantPending puts the UI into type-picker mode.
 */
function startTurn(){
  currentCard = deepClone(deck[turnIndex]);
  grantPending = !cardFitsSomewhere(board, currentCard);
  if(grantPending) currentCard = null;
  refreshPlacements();
}

/** The player picked the type for their council grant. */
function chooseGrantType(typeId){
  if(!grantPending || isGameOver) return;
  currentCard = createGrantCard(typeId);
  grantPending = false;
  refreshPlacements();
  renderAll();
}

function saveUndoSnapshot(){
  undoHistory.push(deepClone({
    board, turnIndex, currentCard, grantPending, tilesPlacedCount, bankedSeasons
  }));
}

function undoLastPlacement(){
  if(undoHistory.length === 0 || isGameOver || fxSeasonIndex !== -1) return;
  ({board, turnIndex, currentCard, grantPending,
    tilesPlacedCount, bankedSeasons} = undoHistory.pop());
  refreshPlacements();
  renderAll();
}

/** Score a season's two instructions on the current board and freeze it. */
function bankSeason(seasonIdx){
  const lines = seasonPlans[seasonIdx].map(instr =>
    ({name: instr.name, pts: instr.score(board)}));
  bankedSeasons.push({
    lines,
    subtotal: lines.reduce((sum, l) => sum + l.pts, 0),
  });
}

/** Commit a placement, bank the season if it just ended, deal the next card. */
function placeCurrentCard(placementCells){
  saveUndoSnapshot();

  for(const {row, col} of placementCells){
    board[cellIndex(row, col)] = currentCard.type;
  }
  tilesPlacedCount += placementCells.length;
  turnIndex++;

  // Did that placement close out a season? Bank it immediately (state
  // stays correct even headlessly), then pause play while the tally
  // animation replays the result before the year moves on.
  const seasonJustEnded = SEASON_END.indexOf(turnIndex);
  if(seasonJustEnded !== -1){
    bankSeason(seasonJustEnded);
    lastPlacedCard = currentCard;     // keep the piece on show during the tally
    currentCard = null;               // nothing in hand during the tally
    fxSeasonIndex = seasonJustEnded;
    refreshPlacements();
    renderAll();
    playSeasonScoring(seasonJustEnded, () => {
      if(turnIndex >= TOTAL_TURNS) finishGame();
      else startTurn();
      renderAll();
    });
    return;
  }

  startTurn();
  renderAll();
}

/** Show the annual review. */
function finishGame(){
  isGameOver = true;
  currentCard = null;

  document.getElementById("overLines").innerHTML = bankedSeasons.map((banked, s) =>
    `<div class="season-block">
      <div class="season-title"><span>${SEASONS[s].name}</span><span class="pts">${banked.subtotal}</span></div>
      ${banked.lines.map(l =>
        `<div class="line"><span>${l.name}</span><span class="pts">${l.pts}</span></div>`).join("")}
    </div>`
  ).join("");

  const grandTotal = bankedSeasons.reduce((sum, b) => sum + b.subtotal, 0);
  document.getElementById("overSub").textContent =
    `${tilesPlacedCount} parcels zoned across the year`;
  document.getElementById("overTotal").textContent = grandTotal;
  document.getElementById("overlay").classList.remove("hidden");
}
