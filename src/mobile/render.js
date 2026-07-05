/* =====================================================================
 * MOBILE RENDERING & UI — a touch-native shell over the shared game.
 *
 * Placement is by finger, not rotate/flip: the player taps an open tile
 * and every valid placement of the current card that covers that tile is
 * previewed; each further tap narrows the set; once one placement remains
 * a tap on the shape confirms it. Two taps on the same tile OUTSIDE the
 * possibility zone clear the selection.
 *
 * This layer defines its own renderAll/renderBoard/renderPlan/renderBuild
 * and reuses the desktop element IDs, so state.js — which only calls
 * renderAll() and the year-end overlay IDs — needs no changes at all.
 * ===================================================================== */

const boardElement = document.getElementById("board");

// Selection state, local to the mobile layer and reset whenever the card
// in hand changes (see syncSelectionToCard).
let constraintCells = [];        // the tapped "must-cover" tiles, in order
let mobileValidPlacements = [];   // allValidPlacements(board, currentCard), cached per turn
let pendingClearKey = null;       // armed by the first out-of-zone tap
let lastCardRef = null;           // identity of the last-rendered card

function buildBoardElements(){
  boardElement.innerHTML = "";
  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      const cellDiv = document.createElement("div");
      cellDiv.className = "cell";
      cellDiv.addEventListener("click", () => handleMobileTap(row, col));
      boardElement.appendChild(cellDiv);
    }
  }
}

/** Place/undo/new-year/grant all swap currentCard for a fresh reference, so
 *  an identity change is exactly the moment to reset the selection and
 *  recompute the valid placements. Mid-turn taps leave the cache intact. */
function syncSelectionToCard(){
  if(currentCard === lastCardRef) return;
  lastCardRef = currentCard;
  constraintCells = [];
  pendingClearKey = null;
  mobileValidPlacements = (currentCard && !isGameOver)
    ? allValidPlacements(board, currentCard) : [];
}

/** The placements still consistent with every constraint tapped so far. */
function currentCandidates(){
  return placementsCovering(mobileValidPlacements, constraintCells);
}

function handleMobileTap(row, col){
  if(isGameOver || !currentCard) return;

  const candidates = currentCandidates();
  const key = row + "," + col;

  // 1. Confirm — one placement remains and the tap lands on it.
  if(constraintCells.length > 0 && candidates.length === 1){
    const covered = new Set(candidates[0].map(c => c.row + "," + c.col));
    if(covered.has(key)){
      placeCurrentCard(candidates[0]);   // state.js advances the turn + re-renders
      return;
    }
  }

  // 2. Ignore taps on non-open tiles (built / mountain) that weren't a confirm.
  if(board[cellIndex(row, col)] !== null) return;

  const inZone = candidates.some(cells =>
    cells.some(c => c.row === row && c.col === col));
  const alreadyConstraint = constraintCells.some(c => c.row === row && c.col === col);

  // 3. Narrow / start — a fresh open tile inside the possibility zone.
  //    (Restricting to zone tiles means candidates can never narrow to zero.)
  if(inZone && !alreadyConstraint){
    constraintCells.push({row, col});
    pendingClearKey = null;
    renderAll();
    return;
  }

  // 4. Clear — an out-of-zone tile with a selection in progress. The first
  //    such tap arms the tile; a second tap on the SAME tile clears.
  if(!inZone && constraintCells.length > 0){
    if(pendingClearKey === key){
      constraintCells = [];
      pendingClearKey = null;
    } else {
      pendingClearKey = key;
    }
    renderAll();
  }
}

function renderBoard(){
  const cellDivs = boardElement.children;

  // Pass 1: committed land (identical to desktop).
  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      const cellDiv = cellDivs[cellIndex(row, col)];
      const value = board[cellIndex(row, col)];
      if(value === MOUNTAIN){
        cellDiv.className = "cell mountain";
        cellDiv.style.background = "";
        cellDiv.textContent = "▲";
      } else {
        cellDiv.className = "cell" + (value ? " filled" : "");
        cellDiv.style.background = value ? TYPE_HEX[value] : "";
        cellDiv.textContent = "";
      }
    }
  }

  // Pass 2: the live selection.
  if(!currentCard || isGameOver) return;
  const candidates = currentCandidates();
  const typeHex = TYPE_HEX[currentCard.type];
  const paint = (row, col, cls) => {
    const cellDiv = cellDivs[cellIndex(row, col)];
    cellDiv.classList.add(cls);
    cellDiv.style.background = typeHex;
  };

  if(constraintCells.length > 0 && candidates.length === 1){
    // One placement left: render it solid, ready to confirm.
    for(const {row, col} of candidates[0]) paint(row, col, "ready");
  } else {
    // Tint the possibility-zone union lightly…
    const zone = new Set();
    for(const cells of candidates)
      for(const c of cells) zone.add(c.row + "," + c.col);
    for(const cellKey of zone){
      const [row, col] = cellKey.split(",").map(Number);
      paint(row, col, "zone");
    }
    // …and the constraint tiles more strongly.
    for(const {row, col} of constraintCells){
      cellDivs[cellIndex(row, col)].classList.remove("zone");
      paint(row, col, "constraint");
    }
  }

  if(pendingClearKey){
    const [row, col] = pendingClearKey.split(",").map(Number);
    cellDivs[cellIndex(row, col)].classList.add("clear-armed");
  }
}

/**
 * The mayor's plan: all four seasons, compact. Deltas show only when
 * exactly one candidate placement is known — the hypothetical board is
 * built from it, matching desktop's "delta only when a placement is real."
 */
function renderPlan(){
  const csi = currentSeasonIndex();
  const candidates = (currentCard && !isGameOver) ? currentCandidates() : [];

  let hypotheticalBoard = null;
  if(currentCard && candidates.length === 1){
    hypotheticalBoard = board.slice();
    for(const {row, col} of candidates[0]){
      hypotheticalBoard[cellIndex(row, col)] = currentCard.type;
    }
  }

  let liveCurrentSeasonTotal = 0;
  let hypotheticalDelta = 0;

  document.getElementById("plan").innerHTML = SEASONS.map((season, s) => {
    const isBanked = s < bankedSeasons.length;
    const isCurrent = !isGameOver && s === csi;
    const cls = isBanked ? "past" : (isCurrent ? "current" : "future");

    const headRight = isBanked
      ? `<span class="stamp">✓ ${bankedSeasons[s].subtotal}</span>`
      : (isCurrent
          ? `${turnWithinSeason()}/${season.turns}`
          : `${season.turns}`);

    const instrHtml = seasonPlans[s].map((instr, i) => {
      let ptsHtml;
      if(isBanked){
        ptsHtml = `<span class="ipts banked">${bankedSeasons[s].lines[i].pts}</span>`;
      } else if(isCurrent){
        const currentPoints = instr.score(board);
        liveCurrentSeasonTotal += currentPoints;
        let deltaHtml = "";
        if(hypotheticalBoard){
          const hypotheticalPoints = instr.score(hypotheticalBoard);
          if(hypotheticalPoints > currentPoints){
            hypotheticalDelta += hypotheticalPoints - currentPoints;
            deltaHtml = `<span class="delta">+${hypotheticalPoints - currentPoints}</span>`;
          }
        }
        ptsHtml = `<span class="ipts">${currentPoints}${deltaHtml}</span>`;
      } else {
        ptsHtml = `<span class="ipts" style="color:var(--muted)">${instr.score(board)}</span>`;
      }
      return `<div class="instr">
        <div><div class="iname">${instr.name}</div><div class="idesc">${instr.desc}</div></div>
        ${ptsHtml}
      </div>`;
    }).join("");

    return `<div class="season ${cls}">
      <div class="season-head"><span>${season.name}</span><span>${headRight}</span></div>
      ${instrHtml}
    </div>`;
  }).join("");

  const bankedTotal = bankedSeasons.reduce((sum, b) => sum + b.subtotal, 0);
  const totalDeltaHtml = hypotheticalDelta > 0
    ? `<span class="delta">+${hypotheticalDelta}</span>` : "";
  document.getElementById("total").innerHTML =
    (bankedTotal + liveCurrentSeasonTotal) + totalDeltaHtml;
}

/** The "this turn's build" panel: the card mini + tracing hint, or the
 *  grant picker. No Rotate/Flip — placement is by finger. */
function renderBuild(){
  const buildElement = document.getElementById("build");
  const turnlineElement = document.getElementById("turnline");

  if(isGameOver){
    buildElement.innerHTML =
      `<div class="grant-msg">The year is over. The mayor is reviewing your work…</div>`;
    turnlineElement.textContent = "";
    document.getElementById("undoBtn").disabled = true;
    return;
  }

  if(grantPending){
    buildElement.innerHTML =
      `<div class="grant-msg">The <b>${deck[turnIndex].name}</b> doesn't fit anywhere.
        The council grants you a <b>1×1 of your choice</b>:</div>
       <div class="grant-btns">${TYPES.map(t =>
         `<button data-grant="${t.id}"><span class="chip" style="background:${t.hex}"></span>${t.name}</button>`
       ).join("")}</div>`;
    buildElement.querySelectorAll("[data-grant]").forEach(btn =>
      btn.addEventListener("click", () => chooseGrantType(btn.dataset.grant)));
  } else {
    const height = Math.max(...currentCard.cells.map(c => c.row)) + 1;
    const width  = Math.max(...currentCard.cells.map(c => c.col)) + 1;
    const cellPixels = Math.floor(56 / Math.max(height, width));
    const occupied = new Set(currentCard.cells.map(c => c.row + "," + c.col));

    let miniCells = "";
    for(let row = 0; row < height; row++){
      for(let col = 0; col < width; col++){
        const filled = occupied.has(row + "," + col);
        miniCells += `<div style="${filled ? `background:${TYPE_HEX[currentCard.type]}` : ""}"></div>`;
      }
    }

    const ready = constraintCells.length > 0 && currentCandidates().length === 1;
    const hint = ready
      ? "One spot left — tap the shape to build."
      : (constraintCells.length > 0
          ? "Tap another tile to narrow it down."
          : "Tap the land to trace where it fits.");

    buildElement.innerHTML =
      `<div class="build-row">
        <div class="build-shape">
          <div class="mini" style="grid-template-rows:repeat(${height},${cellPixels}px);
                                   grid-template-columns:repeat(${width},${cellPixels}px)">
            ${miniCells}
          </div>
        </div>
        <div class="build-info">
          <div class="build-name">${currentCard.name}</div>
          <div class="build-type">${chipHtml(currentCard.type)} · ${currentCard.cells.length} tile${currentCard.cells.length > 1 ? "s" : ""}</div>
          <div class="build-hint${ready ? " ready" : ""}">${hint}</div>
        </div>
      </div>`;
  }

  const s = currentSeasonIndex();
  turnlineElement.textContent =
    `${SEASONS[s].name} · build ${turnWithinSeason()} of ${SEASONS[s].turns}`
    + ` · ${TOTAL_TURNS - turnIndex} left`;

  document.getElementById("undoBtn").disabled = undoHistory.length === 0;
}

function renderAll(){
  syncSelectionToCard();
  renderBoard();
  renderPlan();
  renderBuild();
}
