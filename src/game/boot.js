/* =====================================================================
 * BOOT — wire up the page and deal the first year.
 *
 * Only boot when the board markup is present. This lets the same code be
 * loaded by the test harness (which has no #board) purely to expose the
 * logic functions, without rendering or starting a game.
 * ===================================================================== */

if(document.getElementById("board")){
  buildBoardElements();

  document.getElementById("undoBtn").addEventListener("click", undoLastPlacement);
  document.getElementById("newBtn").addEventListener("click", newGame);
  document.getElementById("againBtn").addEventListener("click", newGame);

  document.addEventListener("keydown", event => {
    if(event.key === "r" || event.key === "R") transformCurrentCard(rotateCardClockwise);
    if(event.key === "f" || event.key === "F") transformCurrentCard(flipCardHorizontally);
  });

  newGame();
}
