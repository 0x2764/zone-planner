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
      cellDiv.addEventListener("click", () => handleCellTap(row, col));
      boardElement.appendChild(cellDiv);
    }
  }
}

/**
 * Tap-to-draw. Each tap either confirms the resolved placement, narrows the
 * working set to the placements covering the tapped cell, or — when the tap
 * lands outside the current possibility zone — clears the in-progress draw.
 */
function handleCellTap(row, col){
  if(isGameOver || !currentCard) return;
  const idx = cellIndex(row, col);

  // Confirm: only one placement remains and the tap lands on it.
  if(candidatePlacements.length === 1 && candidatePlacements[0].includes(idx)){
    placeCurrentCard(candidatePlacements[0].map(cellRowCol));
    return;
  }

  // Narrow: keep the placements that also cover this cell.
  const narrowed = candidatePlacements.filter(p => p.includes(idx));
  if(narrowed.length > 0){
    selectedCells.push(idx);
    candidatePlacements = narrowed;
  } else {
    // Outside the possibility zone (or a filled/mountain tile): start over.
    selectedCells = [];
    candidatePlacements = allPlacements;
  }
  renderAll();
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

  // Pass 2: the tap-to-draw preview.
  if(currentCard && !isGameOver){
    if(candidatePlacements.length === 1){
      // Resolved to one placement — a solid ghost the next tap confirms.
      for(const index of candidatePlacements[0]){
        cellDivs[index].classList.add("ghost");
        cellDivs[index].style.background = TYPE_HEX[currentCard.type];
      }
    } else if(selectedCells.length > 0){
      // Still narrowing — wash the union of the surviving placements.
      const zone = new Set();
      for(const placement of candidatePlacements){
        for(const index of placement) zone.add(index);
      }
      for(const index of zone){
        cellDivs[index].classList.add("possible");
        cellDivs[index].style.background = TYPE_HEX[currentCard.type];
      }
    }
    // Mark the tiles the player has locked in as constraints.
    for(const index of selectedCells){
      cellDivs[index].classList.add("selected");
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
  // While the season tally is playing, the just-banked season still renders
  // as "current" with its scores at 0 — the fx layer counts them up and the
  // banked stamp lands when the animation clears fxSeasonIndex.
  const csi = fxSeasonIndex !== -1 ? fxSeasonIndex : currentSeasonIndex();

  // Score the "+n" delta only once the draw has resolved to a single placement.
  const resolved = candidatePlacements.length === 1 ? candidatePlacements[0] : null;
  let hypotheticalBoard = null;
  if(resolved && currentCard){
    hypotheticalBoard = board.slice();
    for(const index of resolved) hypotheticalBoard[index] = currentCard.type;
  }

  let liveCurrentSeasonTotal = 0;
  let hypotheticalDelta = 0;

  document.getElementById("plan").innerHTML = SEASONS.map((season, s) => {
    const isTallying = s === fxSeasonIndex;
    const isBanked = s < bankedSeasons.length && !isTallying;
    const isCurrent = !isGameOver && s === csi;
    const cls = isBanked ? "past" : (isTallying ? "tallying" : (isCurrent ? "current" : "future"));

    const headRight = isBanked
      ? `<span class="stamp">✓ banked ${bankedSeasons[s].subtotal}</span>`
      : (isTallying
          ? `scoring…`
          : (isCurrent
              ? `build ${turnWithinSeason()} of ${season.turns}`
              : `${season.turns} builds`));

    const instrHtml = seasonPlans[s].map((instr, i) => {
      let ptsHtml;
      if(isTallying){
        ptsHtml = `<span class="ipts" id="ipts-${s}-${i}">0</span>`;
      } else if(isBanked){
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

  // Total = banked points + the current season's live score. A season mid-
  // tally is left out — the fx layer ticks it into the total as it counts.
  const bankedTotal = bankedSeasons.reduce((sum, b, s) =>
    s === fxSeasonIndex ? sum : sum + b.subtotal, 0);
  const totalDeltaHtml = hypotheticalDelta > 0
    ? `<span class="delta">+${hypotheticalDelta}</span>` : "";
  document.getElementById("total").innerHTML =
    (bankedTotal + liveCurrentSeasonTotal) + totalDeltaHtml;
}

/** The card's mini preview row (shape thumbnail + name + type), sized to its
 *  bounding box. Shared by the live build panel and the tally's "Season review". */
function improvementCardHtml(card){
  const height = Math.max(...card.cells.map(c => c.row)) + 1;
  const width  = Math.max(...card.cells.map(c => c.col)) + 1;
  const cellPixels = Math.floor(72 / Math.max(height, width));
  const occupied = new Set(card.cells.map(c => c.row + "," + c.col));

  let miniCells = "";
  for(let row = 0; row < height; row++){
    for(let col = 0; col < width; col++){
      const filled = occupied.has(row + "," + col);
      miniCells += `<div style="${filled ? `background:${TYPE_HEX[card.type]}` : ""}"></div>`;
    }
  }

  return `<div class="build-row">
      <div class="build-shape">
        <div class="mini" style="grid-template-rows:repeat(${height},${cellPixels}px);
                                 grid-template-columns:repeat(${width},${cellPixels}px)">
          ${miniCells}
        </div>
      </div>
      <div class="build-info">
        <div class="build-name">${card.name}</div>
        <div class="build-type">${chipHtml(card.type)} · ${card.cells.length} tile${card.cells.length > 1 ? "s" : ""}</div>
      </div>
    </div>`;
}

/** The "This turn's build" panel: the current card, or the grant picker. */
function renderBuild(){
  const buildElement = document.getElementById("build");
  const turnlineElement = document.getElementById("turnline");
  const titleElement = document.getElementById("buildTitle");
  titleElement.textContent = "This turn's build";

  if(fxSeasonIndex !== -1){
    titleElement.textContent = "Season review";
    buildElement.innerHTML = lastPlacedCard
      ? improvementCardHtml(lastPlacedCard)
      : `<div class="grant-msg">The mayor tallies the ${SEASONS[fxSeasonIndex].name.toLowerCase()} plan…</div>`;
    turnlineElement.textContent = "tap anywhere to skip";
    document.getElementById("undoBtn").disabled = true;
    return;
  }

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
    buildElement.innerHTML = improvementCardHtml(currentCard);
  }

  const s = currentSeasonIndex();
  turnlineElement.textContent =
    `${SEASONS[s].name} · build ${turnWithinSeason()} of ${SEASONS[s].turns}`
    + ` · ${TOTAL_TURNS - turnIndex} builds left in the year`;

  document.getElementById("undoBtn").disabled = undoHistory.length === 0;
}

function renderAll(){
  renderBoard();
  renderPlan();
  renderBuild();
}
