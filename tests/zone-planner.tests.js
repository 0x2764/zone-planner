"use strict";

/* =====================================================================
 *  ZONE PLANNER — unit tests
 *
 *  A zero-dependency, browser-run test suite. It loads alongside
 *  zone-planner.js (which, on this page, only exposes its functions as
 *  globals — the game never boots because there is no #board element)
 *  and exercises the pure logic: card geometry, placement/fit checks,
 *  deck and mountain generation, and every scoring instruction.
 *
 *  Open zone-planner.tests.html in a browser to see the results, or run
 *  it headlessly and read the <title> (set to "PASS n/n" or "FAIL f/n").
 * ===================================================================== */

/* ----------------------------- harness ---------------------------- */

const RESULTS = [];

function test(name, fn){
  try {
    fn();
    RESULTS.push({name, ok: true});
  } catch (err) {
    RESULTS.push({name, ok: false, message: err && err.message ? err.message : String(err)});
  }
}

function assert(condition, message){
  if(!condition) throw new Error(message || "expected truthy value");
}

function assertEqual(actual, expected, message){
  if(actual !== expected){
    throw new Error(`${message || "values differ"} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message){
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if(a !== e){
    throw new Error(`${message || "structures differ"} — expected ${e}, got ${a}`);
  }
}

/** Run `fn` with Math.random pinned to a constant, then restore it. */
function withMockedRandom(value, fn){
  const original = Math.random;
  Math.random = () => value;
  try { return fn(); }
  finally { Math.random = original; }
}

/* --------------------------- test helpers ------------------------- */

/** A fresh, empty 121-slot board. */
const emptyBoard = () => new Array(GRID_SIZE * GRID_SIZE).fill(null);

/** Set one board cell (mutating) and return the board for chaining. */
function set(board, row, col, value){
  board[cellIndex(row, col)] = value;
  return board;
}

/** Build a card from [[r,c],...] offsets. */
function makeCard(type, cellPairs, name){
  return { type, name: name || "Test", cells: cellPairs.map(([row, col]) => ({row, col})) };
}

/** Order-independent signature of a cell list ({row,col} objects or [r,c] pairs). */
const cellKey = c => Array.isArray(c) ? `${c[0]},${c[1]}` : `${c.row},${c.col}`;
const sig = cells => cells.map(cellKey).sort().join(" ");

/**
 * Deal the instruction whose produced name matches `name`, with
 * Math.random pinned to `randomValue` so any random target type is
 * deterministic (0 → farm, .25 → lake, .5 → forest, .75 → city).
 */
function dealByName(name, randomValue){
  return withMockedRandom(randomValue === undefined ? 0 : randomValue, () => {
    for(const template of INSTRUCTION_TEMPLATES){
      const instruction = template.deal();
      if(instruction.name === name) return instruction;
    }
    throw new Error(`no instruction named "${name}" (random=${randomValue})`);
  });
}

/* =====================================================================
 * GEOMETRY
 * ===================================================================== */

test("cellIndex maps row/col to a flat index", () => {
  assertEqual(cellIndex(0, 0), 0);
  assertEqual(cellIndex(1, 0), GRID_SIZE);
  assertEqual(cellIndex(10, 10), GRID_SIZE * GRID_SIZE - 1);
});

test("isInsideGrid accepts on-board cells and rejects the rest", () => {
  assert(isInsideGrid(0, 0));
  assert(isInsideGrid(10, 10));
  assert(!isInsideGrid(-1, 0));
  assert(!isInsideGrid(0, -1));
  assert(!isInsideGrid(11, 0));
  assert(!isInsideGrid(0, 11));
});

/* =====================================================================
 * CARD TRANSFORMS
 * ===================================================================== */

test("normaliseCells shifts a shape to the origin", () => {
  const out = normaliseCells([{row: 2, col: 3}, {row: 2, col: 4}]);
  assertDeepEqual(out, [{row: 0, col: 0}, {row: 0, col: 1}]);
});

test("rotateCardClockwise turns a horizontal I3 into a vertical column", () => {
  const rotated = rotateCardClockwise(makeCard("farm", SHAPES.I3));
  assertEqual(sig(rotated.cells), sig([[0, 0], [1, 0], [2, 0]]));
  assertEqual(rotated.cells.length, 3);
});

test("rotateCardClockwise four times returns to the original shape", () => {
  const original = makeCard("forest", SHAPES.L3);
  let card = original;
  for(let i = 0; i < 4; i++) card = rotateCardClockwise(card);
  assertEqual(sig(card.cells), sig(original.cells));
});

test("flipCardHorizontally mirrors an L3 and is its own inverse", () => {
  const original = makeCard("city", SHAPES.L3);
  const flipped = flipCardHorizontally(original);
  assertEqual(sig(flipped.cells), sig([[0, 1], [1, 0], [1, 1]]));
  const twice = flipCardHorizontally(flipped);
  assertEqual(sig(twice.cells), sig(original.cells));
});

test("transforms preserve tile count for every shape in the library", () => {
  for(const key of Object.keys(SHAPES)){
    const card = makeCard("lake", SHAPES[key]);
    assertEqual(rotateCardClockwise(card).cells.length, SHAPES[key].length, `rotate ${key}`);
    assertEqual(flipCardHorizontally(card).cells.length, SHAPES[key].length, `flip ${key}`);
  }
});

/* =====================================================================
 * PLACEMENT
 * ===================================================================== */

test("findAnchorCellIndex picks the only cell of a 1×1 card", () => {
  assertEqual(findAnchorCellIndex(makeCard("farm", SHAPES.M1)), 0);
});

test("getPlacementCells translates a card under the cursor", () => {
  const cells = getPlacementCells(makeCard("lake", SHAPES.O4), 5, 5);
  assertEqual(sig(cells), sig([[5, 5], [5, 6], [6, 5], [6, 6]]));
});

test("isPlacementValid accepts open land", () => {
  assert(isPlacementValid(emptyBoard(), [{row: 0, col: 0}, {row: 0, col: 1}]));
});

test("isPlacementValid rejects off-board cells", () => {
  assert(!isPlacementValid(emptyBoard(), [{row: 0, col: 10}, {row: 0, col: 11}]));
});

test("isPlacementValid rejects mountains and existing tiles", () => {
  const board = emptyBoard();
  set(board, 5, 5, MOUNTAIN);
  set(board, 3, 3, "farm");
  assert(!isPlacementValid(board, [{row: 5, col: 5}]), "over a mountain");
  assert(!isPlacementValid(board, [{row: 3, col: 3}]), "over a built tile");
});

test("cardFitsSomewhere: true on an empty board, false on a full one", () => {
  assert(cardFitsSomewhere(emptyBoard(), makeCard("city", SHAPES.P5)));
  const full = new Array(GRID_SIZE * GRID_SIZE).fill("city");
  assert(!cardFitsSomewhere(full, makeCard("city", SHAPES.I3)));
});

test("cardFitsSomewhere respects the exact open space", () => {
  // Fill everything, then reopen a single horizontal 2-cell gap.
  const board = new Array(GRID_SIZE * GRID_SIZE).fill("city");
  set(board, 0, 0, null);
  set(board, 0, 1, null);
  assert(cardFitsSomewhere(board, makeCard("farm", SHAPES.D2)), "domino fits the gap");
  assert(!cardFitsSomewhere(board, makeCard("farm", SHAPES.I3)), "triomino cannot");
});

test("allValidPlacements enumerates every footprint, deduped by symmetry", () => {
  // I3 on an empty board: 11×9 horizontal + 9×11 vertical = 198 distinct
  // footprints (the 180° rotation and both flips land on cells already seen).
  assertEqual(allValidPlacements(emptyBoard(), makeCard("farm", SHAPES.I3)).length, 198);
  // O4 is fully symmetric — one footprint per top-left corner, not four.
  assertEqual(allValidPlacements(emptyBoard(), makeCard("lake", SHAPES.O4)).length, 100);
  // A 1×1 fits on every open cell.
  assertEqual(allValidPlacements(emptyBoard(), makeCard("city", SHAPES.M1)).length, 121);
});

test("allValidPlacements returns only valid, correctly-sized placements", () => {
  const card = makeCard("forest", SHAPES.L3);
  const placements = allValidPlacements(emptyBoard(), card);
  assert(placements.length > 0, "L3 fits on an empty board");
  for(const placement of placements){
    assertEqual(placement.length, card.cells.length, "one cell per tile");
    const cells = placement.map(cellRowCol);
    assert(isPlacementValid(emptyBoard(), cells), "every placement is valid");
    assertEqual(new Set(placement).size, placement.length, "no repeated cell");
  }
});

test("allValidPlacements shrinks as the board fills", () => {
  const open = allValidPlacements(emptyBoard(), makeCard("farm", SHAPES.D2)).length;
  const blocked = emptyBoard();
  set(blocked, 5, 5, MOUNTAIN);
  assert(allValidPlacements(blocked, makeCard("farm", SHAPES.D2)).length < open,
    "a mountain removes every domino that would cover it");
  assertEqual(allValidPlacements(new Array(GRID_SIZE * GRID_SIZE).fill("city"),
    makeCard("farm", SHAPES.D2)).length, 0, "no room on a full board");
});

/* =====================================================================
 * DECK & GRANT
 * ===================================================================== */

test("createDeck deals 20 well-formed cards", () => {
  const validTypes = new Set(TYPES.map(t => t.id));
  const validShapes = new Set(Object.values(SHAPES).map(sig));
  const deck = createDeck();
  assertEqual(deck.length, TOTAL_TURNS);
  for(const card of deck){
    assert(validTypes.has(card.type), `unknown type ${card.type}`);
    assert(card.cells.length >= 1 && card.cells.length <= 5, "1–5 tiles");
    assert(validShapes.has(sig(card.cells)), "cells match a library shape");
  }
});

test("createDeck never deals the same card twice", () => {
  for(let iteration = 0; iteration < 100; iteration++){
    const deck = createDeck();
    const keys = deck.map(card => card.type + ":" + sig(card.cells));
    assertEqual(new Set(keys).size, deck.length, "all 20 cards distinct");
  }
});

test("createGrantCard is a 1×1 of the requested type", () => {
  const grant = createGrantCard("lake");
  assertEqual(grant.type, "lake");
  assertEqual(grant.cells.length, 1);
  assertDeepEqual(grant.cells[0], {row: 0, col: 0});
});

test("randomShapeForType always returns a real shape key", () => {
  const keys = new Set(Object.keys(SHAPES));
  for(const type of TYPES.map(t => t.id)){
    for(let i = 0; i < 200; i++){
      assert(keys.has(randomShapeForType(type)), `bad shape for ${type}`);
    }
  }
});

/* =====================================================================
 * MOUNTAINS
 * ===================================================================== */

test("generateMountainCells always yields valid, well-spaced peaks", () => {
  for(let iteration = 0; iteration < 300; iteration++){
    const peaks = generateMountainCells();
    assertEqual(peaks.length, MOUNTAIN_COUNT, "peak count");
    for(const [row, col] of peaks){
      assert(row >= 2 && row <= 8 && col >= 2 && col <= 8, `peak ${row},${col} off the interior`);
    }
    for(let i = 0; i < peaks.length; i++){
      for(let j = i + 1; j < peaks.length; j++){
        const chebyshev = Math.max(Math.abs(peaks[i][0] - peaks[j][0]), Math.abs(peaks[i][1] - peaks[j][1]));
        assert(chebyshev >= 2, "peaks too close together");
      }
    }
  }
});

/* =====================================================================
 * SCORING HELPERS
 * ===================================================================== */

test("findTypeGroups separates non-touching blobs and excludes mountains", () => {
  const board = emptyBoard();
  set(board, 0, 0, "farm"); set(board, 0, 1, "farm");   // one domino
  set(board, 8, 8, "farm"); set(board, 8, 9, "farm");   // another, far away
  set(board, 5, 5, MOUNTAIN);
  const groups = findTypeGroups(board);
  assertEqual(groups.length, 2, "two groups");
  assert(groups.every(g => g.type === "farm"), "no mountain group");
  assert(groups.every(g => g.cells.length === 2), "each is size 2");
});

test("findTypeGroups does not connect diagonally", () => {
  const board = emptyBoard();
  set(board, 0, 0, "lake");
  set(board, 1, 1, "lake");
  assertEqual(findTypeGroups(board).length, 2);
});

test("countTilesWithNeighbour counts tiles with a matching neighbour", () => {
  const board = emptyBoard();
  set(board, 5, 5, "farm"); set(board, 5, 6, "lake");
  set(board, 0, 0, "farm"); // no lake beside it
  assertEqual(countTilesWithNeighbour(board, "farm", v => v === "lake"), 1);
});

/* =====================================================================
 * FIXED-TARGET INSTRUCTIONS
 * ===================================================================== */

test("Irrigation scores two points per farm–lake edge", () => {
  const board = emptyBoard();
  set(board, 5, 5, "farm");
  set(board, 5, 4, "lake"); set(board, 5, 6, "lake"); set(board, 4, 5, "lake");
  assertEqual(dealByName("Irrigation").score(board), 6);
});

test("Greenbelt counts only forest tiles on the edge", () => {
  const board = emptyBoard();
  set(board, 0, 0, "forest"); set(board, 0, 5, "forest"); // edge
  set(board, 5, 5, "forest");                             // interior
  assertEqual(dealByName("Greenbelt").score(board), 2);
});

test("Moat counts only lake tiles on the edge", () => {
  const board = emptyBoard();
  set(board, 0, 0, "lake"); set(board, 10, 10, "lake"); // edge
  set(board, 5, 5, "lake");                             // interior
  assertEqual(dealByName("Moat").score(board), 2);
});

test("Downtown scores 2 per city tile inside the central 7×7", () => {
  const board = emptyBoard();
  set(board, 2, 2, "city"); set(board, 8, 8, "city"); set(board, 5, 5, "city"); // inside
  set(board, 0, 0, "city");                                                     // outside
  assertEqual(dealByName("Downtown").score(board), 6);
});

test("Districts scores overlapping 2×2 squares", () => {
  const solid = emptyBoard();
  for(let r = 0; r < 3; r++) for(let c = 0; c < 3; c++) set(solid, r, c, "farm");
  assertEqual(dealByName("Districts").score(solid), 12, "3×3 has four overlapping squares");

  const single = emptyBoard();
  set(single, 4, 4, "lake"); set(single, 4, 5, "lake");
  set(single, 5, 4, "lake"); set(single, 5, 5, "lake");
  assertEqual(dealByName("Districts").score(single), 3, "one 2×2");

  const mountains = emptyBoard();
  for(let r = 0; r < 2; r++) for(let c = 0; c < 2; c++) set(mountains, r, c, MOUNTAIN);
  assertEqual(dealByName("Districts").score(mountains), 0, "mountains never form a district");
});

test("Reservoirs scores lake groups of 3+ tiles only", () => {
  const big = emptyBoard();
  set(big, 5, 5, "lake"); set(big, 5, 6, "lake"); set(big, 5, 7, "lake"); // size 3
  assertEqual(dealByName("Reservoirs").score(big), 6);

  const small = emptyBoard();
  set(small, 5, 5, "lake"); set(small, 5, 6, "lake"); // size 2
  assertEqual(dealByName("Reservoirs").score(small), 0);
});

test("Through Streets scores filled rows, counting mountains as filled", () => {
  const clean = emptyBoard();
  for(let c = 0; c < GRID_SIZE; c++) set(clean, 0, c, "city");
  assertEqual(dealByName("Through Streets").score(clean), 8, "a fully built row");

  const withPeak = emptyBoard();
  for(let c = 0; c < GRID_SIZE; c++) set(withPeak, 3, c, "city");
  set(withPeak, 3, 5, MOUNTAIN);
  assertEqual(dealByName("Through Streets").score(withPeak), 8, "mountain counts as filled");

  const gappy = emptyBoard();
  for(let c = 0; c < GRID_SIZE; c++) set(gappy, 4, c, "city");
  set(gappy, 4, 5, null);
  assertEqual(dealByName("Through Streets").score(gappy), 0, "one gap breaks the row");
});

test("Avenues scores filled columns", () => {
  const board = emptyBoard();
  for(let r = 0; r < GRID_SIZE; r++) set(board, r, 2, "lake");
  assertEqual(dealByName("Avenues").score(board), 8);
});

test("Mixed Use rewards rows with 3+ types, ignoring mountains", () => {
  const three = emptyBoard();
  set(three, 0, 0, "farm"); set(three, 0, 1, "lake"); set(three, 0, 2, "forest");
  assertEqual(dealByName("Mixed Use").score(three), 4);

  const twoPlusMountain = emptyBoard();
  set(twoPlusMountain, 0, 0, "farm"); set(twoPlusMountain, 0, 1, "lake");
  set(twoPlusMountain, 0, 2, MOUNTAIN);
  assertEqual(dealByName("Mixed Use").score(twoPlusMountain), 0, "mountain is not a type");
});

/* =====================================================================
 * RANDOM-TARGET INSTRUCTIONS (target pinned via mocked Math.random)
 * ===================================================================== */

test("Alpine Resorts scores 2 per target tile adjacent to a mountain", () => {
  const instruction = dealByName("Alpine Resorts", 0); // target = farm
  const board = emptyBoard();
  set(board, 5, 5, MOUNTAIN);
  set(board, 5, 4, "farm"); set(board, 5, 6, "farm"); // both adjacent
  set(board, 0, 0, "farm");                           // not adjacent
  assertEqual(instruction.score(board), 4);
});

test("Homesteads scores 8 per target shape, whatever its size", () => {
  const instruction = dealByName("Homesteads", 0); // target = farm
  const board = emptyBoard();
  set(board, 0, 0, "farm");                            // one-tile shape
  set(board, 10, 10, "farm");                          // one-tile shape
  set(board, 3, 3, "farm"); set(board, 3, 4, "farm");  // a touching pair — one shape
  assertEqual(instruction.score(board), 24);           // 3 shapes × 8
});

test("Largest-group instruction scores 2 per tile in the biggest target group", () => {
  const instruction = dealByName("Bread Basket", 0); // target = farm
  const board = emptyBoard();
  set(board, 0, 0, "farm"); set(board, 0, 1, "farm");
  set(board, 1, 0, "farm"); set(board, 1, 1, "farm");  // a 4-tile group
  set(board, 9, 9, "farm"); set(board, 9, 10, "farm"); // a 2-tile group
  assertEqual(instruction.score(board), 8, "largest group is 4 tiles");
  assertEqual(instruction.score(emptyBoard()), 0, "no group scores nothing");
});

/* =====================================================================
 * SCORING DETAILS — the per-feature breakdown behind the tally animation
 * ===================================================================== */

/** Assert details() is well-formed and its points sum to score(). */
function assertDetailsConsistent(instruction, board, message){
  const details = instruction.details(board);
  for(const feature of details){
    assert(feature.pts > 0, `${message} — every feature scores points`);
    assert(feature.cells.length > 0, `${message} — every feature names its cells`);
  }
  assertEqual(scoreFromDetails(details), instruction.score(board),
    `${message} — details sum to score`);
  return details;
}

test("Irrigation details: one feature per farm–lake edge, both banks named", () => {
  const board = emptyBoard();
  set(board, 5, 5, "farm");
  set(board, 5, 4, "lake"); set(board, 5, 6, "lake"); set(board, 4, 5, "lake");
  const details = assertDetailsConsistent(dealByName("Irrigation"), board, "irrigation");
  assertEqual(details.length, 3);
  for(const feature of details){
    assertEqual(feature.pts, 2);
    assert(feature.cells.includes(cellIndex(5, 5)), "the farm is in every edge feature");
  }
});

test("Greenbelt details: one 1-point feature per edge forest tile", () => {
  const board = emptyBoard();
  set(board, 0, 0, "forest"); set(board, 0, 5, "forest"); set(board, 5, 5, "forest");
  const details = assertDetailsConsistent(dealByName("Greenbelt"), board, "greenbelt");
  assertEqual(details.length, 2);
  assertDeepEqual(details.flatMap(f => f.cells).sort((a, b) => a - b),
    [cellIndex(0, 0), cellIndex(0, 5)]);
});

test("Districts details: each overlapping 2×2 is its own 3-point feature", () => {
  const board = emptyBoard();
  for(let r = 0; r < 3; r++) for(let c = 0; c < 3; c++) set(board, r, c, "farm");
  const details = assertDetailsConsistent(dealByName("Districts"), board, "districts");
  assertEqual(details.length, 4);
  for(const feature of details) assertEqual(feature.cells.length, 4);
});

test("Through Streets details include the mountain that completed the row", () => {
  const board = emptyBoard();
  for(let c = 0; c < GRID_SIZE; c++) set(board, 3, c, "city");
  set(board, 3, 5, MOUNTAIN);
  const details = assertDetailsConsistent(dealByName("Through Streets"), board, "through streets");
  assertEqual(details.length, 1);
  assertEqual(details[0].cells.length, GRID_SIZE);
  assert(details[0].cells.includes(cellIndex(3, 5)), "the mountain helped fill the row");
});

test("Mixed Use details name only the improvement tiles in the row", () => {
  const board = emptyBoard();
  set(board, 0, 0, "farm"); set(board, 0, 1, "lake"); set(board, 0, 2, "forest");
  set(board, 0, 3, MOUNTAIN);
  const details = assertDetailsConsistent(dealByName("Mixed Use"), board, "mixed use");
  assertEqual(details.length, 1);
  assertEqual(details[0].cells.length, 3, "the mountain is not an improvement");
});

test("Largest-group details: one feature, the biggest group's tiles", () => {
  const instruction = dealByName("Bread Basket", 0); // target = farm
  const board = emptyBoard();
  set(board, 0, 0, "farm"); set(board, 0, 1, "farm");
  set(board, 1, 0, "farm"); set(board, 1, 1, "farm");  // a 4-tile group
  set(board, 9, 9, "farm"); set(board, 9, 10, "farm"); // a 2-tile group
  const details = assertDetailsConsistent(instruction, board, "largest group");
  assertEqual(details.length, 1);
  assertEqual(details[0].cells.length, 4);
  assertEqual(details[0].pts, 8);
  assertDeepEqual(instruction.details(emptyBoard()), [], "no group, no features");
});

test("Homesteads details: one 8-point feature per shape", () => {
  const instruction = dealByName("Homesteads", 0); // target = farm
  const board = emptyBoard();
  set(board, 0, 0, "farm"); set(board, 10, 10, "farm");
  set(board, 3, 3, "farm"); set(board, 3, 4, "farm");
  const details = assertDetailsConsistent(instruction, board, "homesteads");
  assertEqual(details.length, 3);
  assert(details.every(f => f.pts === 8), "8 points per shape, whatever its size");
});

test("every instruction's details sum to its score on a busy board", () => {
  const board = emptyBoard();
  // A bit of everything: a full mixed row, a lake blob, a city district,
  // farms round a mountain, forest on the bottom edge.
  for(let c = 0; c < GRID_SIZE; c++) set(board, 0, c, ["farm", "lake", "forest", "city"][c % 4]);
  set(board, 5, 5, MOUNTAIN);
  set(board, 5, 4, "farm"); set(board, 4, 5, "farm"); set(board, 5, 6, "lake");
  set(board, 6, 5, "lake"); set(board, 6, 6, "lake"); set(board, 7, 6, "lake");
  set(board, 2, 2, "city"); set(board, 2, 3, "city");
  set(board, 3, 2, "city"); set(board, 3, 3, "city");
  set(board, 10, 0, "forest"); set(board, 10, 1, "forest");
  for(const template of INSTRUCTION_TEMPLATES){
    for(const randomValue of [0, .3, .6, .9]){
      const instruction = withMockedRandom(randomValue, () => template.deal());
      assertDetailsConsistent(instruction, board, instruction.name);
    }
  }
});

/* =====================================================================
 * REPORTING
 * ===================================================================== */

(function report(){
  const passed = RESULTS.filter(r => r.ok).length;
  const failed = RESULTS.length - passed;
  const allGreen = failed === 0;

  document.title = (allGreen ? "PASS " : "FAIL ") + passed + "/" + RESULTS.length;

  const root = document.getElementById("results");
  if(root){
    const rows = RESULTS.map(r =>
      `<li class="${r.ok ? "ok" : "fail"}">
         <span class="mark">${r.ok ? "✓" : "✗"}</span>
         <span class="name">${r.name}</span>
         ${r.ok ? "" : `<div class="msg">${r.message}</div>`}
       </li>`).join("");
    root.innerHTML =
      `<div class="banner ${allGreen ? "ok" : "fail"}">
         ${allGreen ? "PASS" : "FAIL"} — ${passed}/${RESULTS.length} tests passed
       </div>
       <ul class="list">${rows}</ul>`;
  }

  // Also surface a one-line summary on the console for headless runs.
  console.log((allGreen ? "PASS" : "FAIL") + " " + passed + "/" + RESULTS.length);
  RESULTS.filter(r => !r.ok).forEach(r => console.log("  ✗ " + r.name + " — " + r.message));
})();
