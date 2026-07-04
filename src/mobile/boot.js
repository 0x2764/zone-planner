/* =====================================================================
 * MOBILE BOOT — wire up the touch page and deal the first year.
 *
 * Guarded on #board like the desktop shell so the shared logic can still
 * be loaded headlessly by the test harness without starting a game. No
 * hover, no R/F keydown — orientation is chosen by finger.
 * ===================================================================== */

if(document.getElementById("board")){
  buildBoardElements();

  document.getElementById("undoBtn").addEventListener("click", undoLastPlacement);
  document.getElementById("newBtn").addEventListener("click", newGame);
  document.getElementById("againBtn").addEventListener("click", newGame);

  newGame();
}
