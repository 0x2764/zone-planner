/* =====================================================================
 * FX SANDBOX — the QA harness behind dist/zone-planner.fx.html.
 *
 * Concatenated AFTER the game fragments, and only into the fx build —
 * the shipped game never sees this file. It drives the hooks fx.js
 * exposes (fxClock, fxSetPaused, fxStepBeat, fxBeatHook) and adds an
 * overlay panel that shows which tally beat is playing.
 *
 *   Space  pause / resume the fx clock
 *   n      step to the next beat while paused
 *   1-4    time scale ×1 / ×2 / ×4 / ×8
 *   r      replay the last banked season's tally on the current board
 *   a      auto-deal random placements until the next tally starts
 * ===================================================================== */

if(document.getElementById("board")){
  document.title += " — FX sandbox";

  const FX_SCALES = { "1": 1, "2": 2, "3": 4, "4": 8 };

  /* ------------------------------ panel ----------------------------- */

  const style = document.createElement("style");
  style.textContent = `
    #fxPanel {
      position: fixed; top: 12px; left: 12px; z-index: 30;
      width: 240px; padding: 10px 12px;
      background: var(--panel); border: 1px solid var(--gold);
      border-radius: var(--radius);
      font-family: "IBM Plex Mono", monospace; font-size: .68rem;
      letter-spacing: .04em; color: var(--text);
      box-shadow: 0 4px 14px rgba(45, 33, 22, .25);
    }
    #fxPanel h3 {
      font-size: .62rem; font-weight: 500; letter-spacing: .18em;
      text-transform: uppercase; color: var(--gold); margin-bottom: 6px;
    }
    #fxPanel .fx-line { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
    #fxPanel .fx-line .k { color: var(--muted); }
    #fxPanel .fx-beat { min-height: 2.2em; padding: 4px 0; font-weight: 600; }
    #fxPanel .fx-paused-badge { color: #A8482C; font-weight: 700; }
    #fxPanel .fx-btns { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    #fxPanel button { padding: 4px 7px; font-size: .62rem; border-radius: 6px; }
    #fxPanel button.on { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }
    #fxPanel .fx-keys { margin-top: 7px; color: var(--muted); font-size: .6rem; line-height: 1.5; }
    /* Freeze in-flight tally visuals while the fx clock is paused; kudos
       frozen at their first frame (opacity 0) are forced visible. */
    body.fx-paused .kudo, body.fx-paused .confetti, body.fx-paused .cell.scored {
      animation-play-state: paused;
    }
    body.fx-paused .kudo { opacity: 1 !important; }
  `;
  document.head.appendChild(style);

  const scaleBtns = Object.values(FX_SCALES)
    .map(s => `<button data-action="scale" data-scale="${s}">×${s}</button>`).join("");

  const panel = document.createElement("div");
  panel.id = "fxPanel";
  panel.setAttribute("data-fx-noskip", "");   // clicks here never skip the tally
  panel.innerHTML = `
    <h3>FX sandbox</h3>
    <div class="fx-beat" id="fxBeat">idle</div>
    <div class="fx-line"><span class="k">clock</span><span id="fxClockLine"></span></div>
    <div class="fx-btns">${scaleBtns}</div>
    <div class="fx-btns">
      <button data-action="pause" id="fxPauseBtn">pause</button>
      <button data-action="step">step</button>
      <button data-action="replay">replay</button>
      <button data-action="deal">deal to tally</button>
    </div>
    <div class="fx-keys">space pause · n step · 1-4 speed<br>r replay · a deal to tally</div>
  `;
  document.body.appendChild(panel);

  let lastBeat = { phase: "idle" };

  function beatLabel(){
    const season = lastBeat.seasonIdx !== undefined
      ? SEASONS[lastBeat.seasonIdx].name : "";
    switch(lastBeat.phase){
      case "pause":
        return `${season} · settling`;
      case "instruction":
        return `${season} · instr ${lastBeat.instrIndex + 1}/2 — ${lastBeat.name}`
          + `<br>+${lastBeat.pts} pts, ${lastBeat.features} feature${lastBeat.features === 1 ? "" : "s"}`;
      case "zero":
        return `${season} · instr ${lastBeat.instrIndex + 1}/2 — ${lastBeat.name}<br>0 pts, holding`;
      case "stamp":
        return `${season} · stamp &amp; ploof (+${lastBeat.pts})`;
      default:
        return "idle";
    }
  }

  function refreshPanel(){
    document.getElementById("fxBeat").innerHTML = beatLabel();
    document.getElementById("fxClockLine").innerHTML =
      `×${fxClock.scale}${fxClock.paused ? ' · <span class="fx-paused-badge">PAUSED</span>' : ""}`;
    document.getElementById("fxPauseBtn").textContent = fxClock.paused ? "resume" : "pause";
    panel.querySelectorAll("[data-scale]").forEach(btn =>
      btn.classList.toggle("on", Number(btn.dataset.scale) === fxClock.scale));
  }

  fxBeatHook = info => { lastBeat = info; refreshPanel(); };

  /* ----------------------------- actions ---------------------------- */

  function setScale(scale){
    fxClock.scale = scale;
    document.documentElement.style.setProperty("--fx-scale", scale);
    refreshPanel();
  }

  function togglePause(){
    fxSetPaused(!fxClock.paused);
    refreshPanel();
  }

  function stepBeat(){
    fxStepBeat();
    refreshPanel();
  }

  /** Re-run the most recently banked season's tally on the current board.
   *  Kudos replay against today's tiles, so counts can drift from the
   *  banked line if builds have landed since — fine for QA. */
  function replayLastTally(){
    if(fxSeasonIndex !== -1 || isGameOver || bankedSeasons.length === 0) return;
    const season = bankedSeasons.length - 1;
    const heldCard = currentCard;
    const heldGrant = grantPending;
    currentCard = null;
    grantPending = false;
    fxSeasonIndex = season;
    refreshPlacements();
    renderAll();
    playSeasonScoring(season, () => {
      currentCard = heldCard;
      grantPending = heldGrant;
      refreshPlacements();
      renderAll();
    });
  }

  /** Place random valid placements until the next tally starts. */
  function autoDealToSeasonEnd(){
    for(let i = 0; i < 30 && fxSeasonIndex === -1 && !isGameOver; i++){
      if(grantPending){
        chooseGrantType(randomItem(TYPES).id);
        continue;
      }
      if(!currentCard || allPlacements.length === 0) break;
      placeCurrentCard(randomItem(allPlacements).map(cellRowCol));
    }
  }

  /* ----------------------------- wiring ----------------------------- */

  panel.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if(!button) return;
    switch(button.dataset.action){
      case "scale":  setScale(Number(button.dataset.scale)); break;
      case "pause":  togglePause(); break;
      case "step":   stepBeat(); break;
      case "replay": replayLastTally(); break;
      case "deal":   autoDealToSeasonEnd(); break;
    }
  });

  document.addEventListener("keydown", event => {
    if(event.repeat) return;
    if(event.key === " "){
      event.preventDefault();   // no page scroll — space is the pause key
      togglePause();
    }
    else if(event.key === "n" || event.key === "N") stepBeat();
    else if(FX_SCALES[event.key]) setScale(FX_SCALES[event.key]);
    else if(event.key === "r" || event.key === "R") replayLastTally();
    else if(event.key === "a" || event.key === "A") autoDealToSeasonEnd();
  });

  refreshPanel();
}
