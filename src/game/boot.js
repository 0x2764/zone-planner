/* =====================================================================
 * BOOT — wire up the page and deal the first year.
 *
 * Only boot when the board markup is present. This lets the same code be
 * loaded by the test harness (which has no #board) purely to expose the
 * logic functions, without rendering or starting a game.
 * ===================================================================== */

/** Verification hooks, gated behind ?test=1 so normal play is untouched.
 *  Exposes a driver that reaches real game states — placements, banked
 *  seasons, the scoring tally — by calling the same functions the UI does,
 *  without a headless agent having to synthesise tap gestures. */
function installTestHooks(){
  window.__zp = {
    state: () => ({ turnIndex, fxSeasonIndex, isGameOver,
                    bankedTotal: bankedSeasons.reduce((sum, b) => sum + b.subtotal, 0) }),
    // Place the current card at its first valid placement (taking a farm grant
    // if the deal fits nowhere). Returns false when there's nothing to place —
    // game over, or a tally is mid-play (fxSeasonIndex set by the last place).
    placeOne(){
      if(isGameOver || fxSeasonIndex !== -1) return false;
      if(grantPending) chooseGrantType("farm");
      if(!candidatePlacements.length) return false;
      placeCurrentCard(candidatePlacements[0].map(cellRowCol));
      return true;
    },
    // Build until the next placement closes a season and starts its tally.
    playSeason(){ while(this.placeOne()){} },
  };
}

if(document.getElementById("board")){
  buildBoardElements();

  document.getElementById("undoBtn").addEventListener("click", undoLastPlacement);
  document.getElementById("newBtn").addEventListener("click", newGame);
  document.getElementById("againBtn").addEventListener("click", newGame);

  // Rules modal: open from the header, close via the button, a backdrop click,
  // or Escape. It only overlays the reference rulebook — it never touches game
  // state, so open/close is pure show/hide.
  const rulesOverlay = document.getElementById("rulesOverlay");
  const setRulesOpen = open => rulesOverlay.classList.toggle("hidden", !open);
  document.getElementById("rulesBtn").addEventListener("click", () => setRulesOpen(true));
  document.getElementById("rulesCloseBtn").addEventListener("click", () => setRulesOpen(false));
  rulesOverlay.addEventListener("click", e => {
    if(e.target === rulesOverlay) setRulesOpen(false);
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && !rulesOverlay.classList.contains("hidden")) setRulesOpen(false);
  });

  // ?seed=N — deterministic Math.random for a repeatable year (must be set
  // before newGame deals). ?test=1 — install the headless driver above.
  const params = new URLSearchParams(location.search);
  const seed = params.get("seed");
  if(seed !== null) Math.random = seededRandom(Number(seed));
  if(params.get("test") === "1") installTestHooks();

  newGame();
}
