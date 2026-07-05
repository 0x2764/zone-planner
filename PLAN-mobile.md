# Mobile version of Zone Planner

## Context

Zone Planner is a dependency-free HTML5 polyomino solitaire that builds from small
`src/` fragments into a self-contained `dist/zone-planner.html`. Desktop play uses
hover-to-preview plus **Rotate (R)** / **Flip (F)** buttons to orient a card, then a
click to place it — a mechanic that is awkward on touch screens.

PLAN.md job #7 asks for a dedicated mobile build with a different layout and a
touch-native placement mechanic. Per the user's direction:

- The mobile version is a **separate built file**, `dist/zone-planner.mobile.html`.
- It has its own layout + stylesheet but shares the desktop theme (colours, type, feel).
- Placement is by **finger, not rotate/flip**: the player taps an open tile and every
  valid placement of the current shape that covers that tile is previewed; each further
  tap narrows the possibilities; once one placement remains, a tap on the shape confirms
  it. Two successive taps on the same open tile *outside* the possibility zone clears the
  selection (two taps, to avoid accidental clears).

Decisions confirmed with the user: **symmetric source split** (`src/game` shared,
`src/desktop`, `src/mobile`); **zoom deferred** to a follow-up (compact panels this pass);
and the deployed index **auto-redirects small touch screens** to the mobile file, with
manual cross-links both ways.

## Approach

The insight is that everything below the UI layer is already layout-agnostic. The four
game-logic groups plus `state.js` are shared; only `render.js` + `boot.js` + the HTML
template + the CSS are desktop-specific. `state.js` couples to the UI only through
`renderAll()` and the year-end overlay element IDs — so a mobile shell that defines
`renderAll()` and reuses those IDs needs **zero changes to `state.js` or any game logic.**

### 1. Restructure the source (symmetric split)

Move the desktop shell out of `src/game/` so the folders read as *shared / desktop / mobile*:

- `src/game/render.js`   → `src/desktop/render.js`
- `src/game/boot.js`     → `src/desktop/boot.js`
- `src/template.html`    → `src/desktop/template.html`
- `src/styles.css`       → **split** (see below)

`src/game/` keeps the shared fragments (`constants, types, shapes, utils, cards,
mountains, scoring-core, state`); `src/instructions/` is unchanged. Add `src/mobile/`
with `render.js`, `boot.js`, `template.html`, `styles.css`.

**Shared stylesheet.** The current `src/styles.css` splits by responsibility:

- `src/game/styles.css` (**new, shared**) — theme tokens (`:root`), the reset, base
  typography, `button`, `.chip`, the cell base + `.mountain`/committed-land/`.ghost`
  colours, and the **entire year-end review modal** (`.overlay`/`.modal`/`.grand`/…),
  which both shells render from the same `state.js` markup and so must style identically.
- `src/desktop/styles.css` — desktop **layout only** (`.layout`, `.side`, `.toprow`,
  `.main`, board sizing, plan/build panel arrangement, hover/ghost specifics).
- `src/mobile/styles.css` — mobile **layout only** (bottom-anchored grid, stacked compact
  panels, selection-zone/constraint/ready classes).

### 2. Rework `build.js` for two shells

Split the fragment lists and parameterise the concatenation:

- `GAME_CORE` = `constants, types, shapes, utils, cards, mountains, scoring-core` (in `game/`)
- `SHARED_STATE` = `state.js` (in `game/`)
- `buildGameJs(uiFiles)` = `"use strict"` + `GAME_CORE` + instruction files + `SHARED_STATE` + `uiFiles`

Each template's `{{STYLES}}` slot receives the **shared `game/styles.css` concatenated
with that shell's layout sheet** (shared first, so shell rules can override). Produce three
outputs:
- `dist/zone-planner.html`        — `desktop/template.html` + (`game/styles.css` + `desktop/styles.css`) + `buildGameJs([desktop/render.js, desktop/boot.js])`
- `dist/zone-planner.mobile.html` — `mobile/template.html`  + (`game/styles.css` + `mobile/styles.css`)  + `buildGameJs([mobile/render.js, mobile/boot.js])`
- `dist/zone-planner.tests.html`  — unchanged wiring, using the **desktop** bundle (the boot guard keeps it from starting a game with no `#board`, exactly as today)

`runTests()` continues to run against the desktop bundle.

### 3. Shared placement enumeration (new pure logic in `src/game/cards.js`)

Add small, testable helpers alongside the existing `getPlacementCells` /
`isPlacementValid` / `cardFitsSomewhere` (reusing `rotateCardClockwise`,
`flipCardHorizontally`, `isPlacementValid`, `GRID_SIZE`):

- `normalisedCellsKey(cells)` — sorted `"r,c r,c"` signature of a cell list.
- `cardOrientations(card)` — the unique orientations (4 rotations × 2 flips, deduped by
  signature), mirroring the loop already in `cardFitsSomewhere`.
- `allValidPlacements(board, card)` — every valid on-board placement across all
  orientations, deduped by covered-cell signature; each is an array of `{row,col}`.
- `placementsCovering(placements, mustCover)` — the placements whose covered set contains
  every cell in `mustCover`.

### 4. Mobile UI layer (`src/mobile/render.js` + `src/mobile/boot.js`)

Defines its own `renderAll`, `renderBoard`, `renderPlan`, `renderBuild` (the only name
`state.js` depends on is `renderAll`). Reuses the same element IDs as desktop
(`board, plan, build, turnline, total, undoBtn, newBtn, overlay, overLines, overSub,
overTotal, againBtn`) so `newGame()`/`finishGame()`/`bankSeason()` in `state.js` work
untouched — the annual-review modal is shared.

**Selection state** (module-local to the mobile layer):
- `constraintCells` — the tapped "must-cover" tiles, in order.
- `mobileValidPlacements` — cached `allValidPlacements(board, currentCard)` for this turn.
- `pendingClearKey` — armed by the first out-of-zone tap.
- `lastCardRef` — identity of the last-rendered card.

**Selection reset without touching `state.js`:** at the top of `renderAll()`, if
`currentCard !== lastCardRef`, clear `constraintCells`/`pendingClearKey` and recompute
`mobileValidPlacements`. Because place/undo/new-year/grant all swap `currentCard` for a
fresh reference (deep clones / new object), this resets the selection at exactly the right
moments while leaving mid-turn taps cached.

**Tap handling** — `handleMobileTap(row, col)`, given `candidates = placementsCovering(mobileValidPlacements, constraintCells)`:
1. **Confirm** — if `constraintCells` is non-empty, `candidates.length === 1`, and the tap
   lands on that placement → `placeCurrentCard(candidates[0])` (state.js advances the turn
   and re-renders).
2. Ignore taps on non-open tiles (built / mountain) that aren't a confirm.
3. **Narrow / start** — if the open tile is in the possibility zone (covered by some
   candidate) and not already a constraint → push it to `constraintCells` and re-render.
   With no constraints yet, the zone is the union of all placements, so the first tap is
   just this branch.
4. **Clear** — if the open tile is *outside* the zone and `constraintCells` is non-empty:
   first such tap arms `pendingClearKey`; a second tap on the **same** tile clears the
   selection. (Restricting narrowing to zone tiles means candidates can never narrow to
   zero.)

**Board rendering** — pass 1 paints committed land (identical to desktop). Pass 2 paints
the selection: with one candidate left, render it as a solid, "ready-to-confirm" ghost;
otherwise tint the possibility-zone union lightly and the constraint tiles more strongly,
with the armed clear tile flagged. Colours derive from `TYPE_HEX[currentCard.type]`.

**Plan rendering** — a compact version of the desktop plan reusing the same
`instr.score(board)` calls and banked/current/future logic; show the `+n` deltas only when
exactly one candidate placement is known (build the hypothetical board from it), matching
desktop's "delta only when a real placement is known."

**Build panel** — the mini card shape + name + type + tile count (reusing the desktop
rendering approach), **no Rotate/Flip buttons**, plus a one-line hint ("Tap the land to
trace where it fits; tap the shape to build") and the Undo / New-year controls.

**Boot** — guard on `#board`; build the board cells with tap (no hover, no R/F keydown);
wire Undo / New year / Play-again; `newGame()`.

### 5. Layout & theme (`src/mobile/template.html` + `src/mobile/styles.css`)

The shared `game/styles.css` supplies the theme custom properties (`--bg, --panel, --cell,
--line, --gold, --banked`, type-family vars, etc.), so `mobile/styles.css` carries only
layout: grid **anchored to the bottom** of the viewport for thumb reach, with the compact
plan + build panels stacked above it (scrollable; true pinch/tap-to-zoom deferred per
decision). Header carries the title and a **"Desktop version"** link to
`zone-planner.html?desktop`.

### 6. Entry point (auto-redirect + links)

- `src/desktop/template.html`: a tiny inline `<head>` script redirects to
  `zone-planner.mobile.html` when `matchMedia("(max-width: 760px) and (pointer: coarse)")`
  matches, unless a `?desktop` query param (or a matching `localStorage` flag) opts out.
  Add a **"Mobile version"** link in the header. The deployed `index.html` is a copy of
  this file, so the redirect works from the site root (relative paths resolve there).
- `.github/workflows/ci.yml` needs **no change**: it uploads all of `dist/`, so the new
  mobile file ships automatically once `build.js` emits it.

### 7. Tests & docs

- Add unit tests to `tests/zone-planner.tests.js` for `cardOrientations` (e.g. I4 → 2
  unique, O4 → 1, L4 → 8), `allValidPlacements` (count on an empty board; exactly one
  placement through a single 2-cell gap; dedupe of symmetric orientations), and
  `placementsCovering` (constraint filtering). Uses the existing `sig`/`makeCard`/`set`
  helpers and headless harness.
- Update `README.md` (source-layout paragraph → shared/desktop/mobile; note the mobile
  build output and mechanic) and tick PLAN.md job #7 (or note the deferred zoom follow-up).

## Critical files

- `build.js` — split fragment lists; concatenate shared + shell CSS; add the mobile build target.
- `src/game/cards.js` — add `cardOrientations`, `allValidPlacements`, `placementsCovering`, `normalisedCellsKey`.
- `src/game/styles.css` — **new shared stylesheet** (theme + chrome + year-end modal), carved out of the old `src/styles.css`.
- `src/desktop/{render.js,boot.js,template.html,styles.css}` — moved from `src/game` / `src/`; `styles.css` is desktop layout only; template gains the redirect + cross-link.
- `src/mobile/{render.js,boot.js,template.html,styles.css}` — new mobile shell; `styles.css` is mobile layout only.
- `tests/zone-planner.tests.js` — new placement-enumeration tests.
- `README.md`, `PLAN.md` — docs.
- `src/game/state.js`, `src/instructions/*`, `src/game/{constants,types,shapes,utils,mountains,scoring-core}.js` — **unchanged**.

## Verification

1. `node build.js --test` — headless suite passes (existing + new placement tests), exit 0.
2. `node build.js` — confirms all three files emit, including `dist/zone-planner.mobile.html`.
3. Open `dist/zone-planner.mobile.html` in a mobile-sized viewport and drive a full turn:
   - tap open land → the possibility zone lights up; each further tap narrows it;
   - once one placement remains it shows solid; tap it → the tile(s) commit and the next
     card deals;
   - tap twice on the same out-of-zone tile → selection clears;
   - force a council grant (fill the board so a card can't fit) → the type picker appears
     and a 1×1 places via the same tap-tap flow;
   - Undo and New year reset the selection; the year-end review modal shows the banked
     season breakdown.
4. Open `dist/zone-planner.html` on a narrow touch viewport → it redirects to the mobile
   file; `?desktop` stays on desktop; the header cross-links work both ways.
