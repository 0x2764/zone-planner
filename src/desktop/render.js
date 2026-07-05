/* =====================================================================
 * RENDERING & UI — painting the board, the plan and the build panel,
 * and translating clicks/hovers into moves.
 * ===================================================================== */

const boardElement = document.getElementById("board");

function buildBoardElements(){
  boardElement.innerHTML = "";
  for(let row = 0; row < GRID_SIZE; row++){
    for(let col = 0; col < GRID_SIZE; col++){
      const cellDiv = document.createElement("div");
      cellDiv.className = "cell";
      cellDiv.addEventListener("pointerenter", () => {
        if(!isTouchDevice) showHoverPreview(row, col);
      });
      cellDiv.addEventListener("click", () => handleCellTap(row, col));
      boardElement.appendChild(cellDiv);
    }
  }
  boardElement.addEventListener("pointerleave", () => {
    if(!isTouchDevice){
      previewPlacement = null;
      renderBoard();
      renderPlan();
    }
  });
}

function showHoverPreview(row, col){
  previewPlacement = (isGameOver || !currentCard)
    ? null : getPlacementCells(currentCard, row, col);
  renderBoard();
  renderPlan(); // live "+n" against the current season's instructions
}

function handleCellTap(row, col){
  if(isGameOver || !currentCard) return;

  const placementCells = getPlacementCells(currentCard, row, col);
  const valid = isPlacementValid(board, placementCells);

  if(isTouchDevice){
    const tapKey = row + "," + col;
    if(lastTappedCellKey !== tapKey){
      lastTappedCellKey = tapKey;
      previewPlacement = placementCells;
      renderBoard();
      renderPlan();
      return;
    }
  }

  if(valid) placeCurrentCard(placementCells);
}

function renderBoard(){
  const cellDivs = boardElement.children;

  // Pass 1: committed land.
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

  // Pass 2: ghost preview of the card being placed.
  if(previewPlacement && currentCard){
    const valid = isPlacementValid(board, previewPlacement);
    for(const {row, col} of previewPlacement){
      if(!isInsideGrid(row, col)) continue;
      const cellDiv = cellDivs[cellIndex(row, col)];
      if(valid){
        cellDiv.classList.add("ghost");
        cellDiv.style.background = TYPE_HEX[currentCard.type];
      } else if(board[cellIndex(row, col)] === null){
        cellDiv.classList.add("ghost-bad");
      }
    }
  }
}

/**
 * The mayor's plan panel: all four seasons at once.
 *   past    — banked scores, stamped
 *   current — live scores with "+n" deltas for the hovered placement
 *   future  — instructions visible with live projected scores (no hover delta)
 */
function renderPlan(){
  const csi = currentSeasonIndex();

  let hypotheticalBoard = null;
  if(previewPlacement && currentCard && isPlacementValid(board, previewPlacement)){
    hypotheticalBoard = board.slice();
    for(const {row, col} of previewPlacement){
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
      ? `<span class="stamp">✓ banked ${bankedSeasons[s].subtotal}</span>`
      : (isCurrent
          ? `build ${turnWithinSeason()} of ${season.turns}`
          : `${season.turns} builds`);

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
        // Future season: live projected score on the committed board. No
        // hover delta — it only moves when a tile actually lands.
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

  // Total = banked points + the current season's live score.
  const bankedTotal = bankedSeasons.reduce((sum, b) => sum + b.subtotal, 0);
  const totalDeltaHtml = hypotheticalDelta > 0
    ? `<span class="delta">+${hypotheticalDelta}</span>` : "";
  document.getElementById("total").innerHTML =
    (bankedTotal + liveCurrentSeasonTotal) + totalDeltaHtml;
}

/** The "This turn's build" panel: the current card, or the grant picker. */
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
      `<div class="grant-msg">The <b>${deck[turnIndex].name}</b> doesn't fit anywhere
        on the block. The council grants you a <b>1×1 improvement of your choice</b> instead:</div>
       <div class="grant-btns">${TYPES.map(t =>
         `<button data-grant="${t.id}"><span class="chip" style="background:${t.hex}"></span>${t.name}</button>`
       ).join("")}</div>`;
    buildElement.querySelectorAll("[data-grant]").forEach(btn =>
      btn.addEventListener("click", () => chooseGrantType(btn.dataset.grant)));
  } else {
    // Mini preview of the card, sized to its bounding box.
    const height = Math.max(...currentCard.cells.map(c => c.row)) + 1;
    const width  = Math.max(...currentCard.cells.map(c => c.col)) + 1;
    const cellPixels = Math.floor(72 / Math.max(height, width));
    const occupied = new Set(currentCard.cells.map(c => c.row + "," + c.col));

    let miniCells = "";
    for(let row = 0; row < height; row++){
      for(let col = 0; col < width; col++){
        const filled = occupied.has(row + "," + col);
        miniCells += `<div style="${filled ? `background:${TYPE_HEX[currentCard.type]}` : ""}"></div>`;
      }
    }

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
          <div class="controls">
            <button id="rotBtn" ${currentCard.cells.length < 2 ? "disabled" : ""}>Rotate (R)</button>
            <button id="flipBtn" ${currentCard.cells.length < 2 ? "disabled" : ""}>Flip (F)</button>
          </div>
        </div>
      </div>`;
    document.getElementById("rotBtn").addEventListener("click",
      () => transformCurrentCard(rotateCardClockwise));
    document.getElementById("flipBtn").addEventListener("click",
      () => transformCurrentCard(flipCardHorizontally));
  }

  const s = currentSeasonIndex();
  turnlineElement.textContent =
    `${SEASONS[s].name} · build ${turnWithinSeason()} of ${SEASONS[s].turns}`
    + ` · ${TOTAL_TURNS - turnIndex} builds left in the year`;

  document.getElementById("undoBtn").disabled = undoHistory.length === 0;
}

function transformCurrentCard(transform){
  if(isGameOver || !currentCard || grantPending || currentCard.cells.length < 2) return;
  currentCard = transform(currentCard);
  previewPlacement = null;
  lastTappedCellKey = null;
  renderAll();
}

function renderAll(){
  renderBoard();
  renderPlan();
  renderBuild();
}
