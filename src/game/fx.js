/* =====================================================================
 * FX — the end-of-season scoring tally.
 *
 * When a season banks, play pauses and playSeasonScoring replays the
 * result: each instruction in turn pulses the cells it scored, a kudo
 * floats off every contributing tile, the plan panel counts the line up
 * from zero, and a season that earned anything gets a small confetti
 * ploof as its banked stamp lands. Any tap skips to the banked state.
 *
 * The whole layer is presentational — the season is already banked
 * (state.js) before the animation starts, so skipping, reduced motion
 * or running headless (no #board) just reveals the result sooner.
 *
 * Every beat runs through fxClock, which the FX sandbox build (see
 * src/fx-sandbox.js) can slow down, pause and single-step. In the
 * shipped game the clock stays at scale 1 and is never paused. CSS
 * animation durations follow the same scale via --fx-scale.
 * ===================================================================== */

const FX_BEAT_PAUSE = 1000;   // breath after the final build lands
const FX_BEAT_INSTR = 3000;   // one instruction: pulse + kudos + count-up
const FX_BEAT_ZERO  = 1000;   // a 0-point instruction just holds its 0
const FX_BEAT_STAMP = 2000;   // banked stamp + confetti ploof

const FX_KUDO_HOLD       = 1500;  // coins rest on their tiles before sweeping
const FX_SWEEP_STAGGER   = 45;    // ms between successive coins launching
const FX_SWEEP_STAGGER_CAP = 900; // cap so a big feature's last coin still lands
                                  // inside the FX_BEAT_INSTR beat

const fxClock = { scale: 1, paused: false };

let fxTimers = [];        // pending beats: {fn, id, end} live, {fn, remaining} paused
let fxRafs = [];          // pending requestAnimationFrame ids
let fxNodes = [];         // floating kudos (confetti outlives the tally)
let fxSkipHandler = null;
let fxOnDone = null;
let fxBeatHook = null;    // QA sandbox: called with {phase, seasonIdx, ...} per beat

const fxAnnounce = info => { if(fxBeatHook) fxBeatHook(info); };

/** Schedule a beat on the fx clock (scaled, pausable). */
function fxDelay(fn, ms){
  const beat = { fn };
  const wait = ms * fxClock.scale;
  if(fxClock.paused){
    beat.remaining = wait;
  } else {
    beat.end = performance.now() + wait;
    beat.id = setTimeout(() => fxFire(beat), wait);
  }
  fxTimers.push(beat);
}

function fxFire(beat){
  fxTimers = fxTimers.filter(b => b !== beat);
  beat.fn();
}

/** Freeze or resume the fx clock: pending beats keep their remaining time,
 *  in-flight CSS animations pause via body.fx-paused, and fxCountUp stops
 *  accumulating. A no-op in the shipped game — only the sandbox calls it. */
function fxSetPaused(paused){
  if(fxClock.paused === paused) return;
  fxClock.paused = paused;
  const now = performance.now();
  for(const beat of fxTimers){
    if(paused){
      clearTimeout(beat.id);
      beat.remaining = Math.max(0, beat.end - now);
      beat.id = null;
    } else {
      beat.end = now + beat.remaining;
      beat.id = setTimeout(() => fxFire(beat), beat.remaining);
    }
  }
  if(document.body) document.body.classList.toggle("fx-paused", paused);
}

/** While paused, jump the clock to the next beat boundary and fire it. */
function fxStepBeat(){
  if(!fxClock.paused || fxTimers.length === 0) return;
  const jump = Math.min(...fxTimers.map(beat => beat.remaining));
  for(const beat of fxTimers) beat.remaining -= jump;
  for(const beat of [...fxTimers]){
    if(beat.remaining <= 0) fxFire(beat);
  }
}

function fxCleanup(){
  fxTimers.forEach(beat => clearTimeout(beat.id)); fxTimers = [];
  fxRafs.forEach(cancelAnimationFrame);  fxRafs = [];
  fxNodes.forEach(node => node.remove()); fxNodes = [];
  if(fxSkipHandler){
    document.removeEventListener("click", fxSkipHandler, true);
    fxSkipHandler = null;
  }
}

/** Abandon a running tally without resuming play (used by New year). */
function cancelSeasonScoring(){
  fxCleanup();
  fxSeasonIndex = -1;
  fxOnDone = null;
  fxAnnounce({phase: "idle"});
}

/** Land on the banked end state and resume play. */
function endSeasonScoring(){
  fxCleanup();
  fxSeasonIndex = -1;
  const done = fxOnDone;
  fxOnDone = null;
  fxAnnounce({phase: "idle"});
  if(done) done();
}

/** Play the ~2s season tally, then call onDone to resume the year.
 *  Skipped outright headlessly and under prefers-reduced-motion. */
function playSeasonScoring(seasonIdx, onDone){
  const reduceMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!boardElement || reduceMotion){
    fxSeasonIndex = -1;
    onDone();
    return;
  }

  fxOnDone = onDone;
  // Any tap fast-forwards to the banked state (capture, so nothing under
  // the finger — cells, buttons — fires while the tally is skipped away).
  // Elements inside a [data-fx-noskip] container (the sandbox panel) are
  // exempt so QA controls stay clickable mid-tally.
  fxSkipHandler = event => {
    if(event.target && event.target.closest
        && event.target.closest("[data-fx-noskip]")) return;
    event.stopPropagation();
    event.preventDefault();
    endSeasonScoring();
  };
  document.addEventListener("click", fxSkipHandler, true);
  fxAnnounce({phase: "pause", seasonIdx});

  const banked = bankedSeasons[seasonIdx];
  const previousTotal = bankedSeasons
    .slice(0, seasonIdx)
    .reduce((sum, b) => sum + b.subtotal, 0);

  let at = FX_BEAT_PAUSE;
  let runningTotal = previousTotal;
  seasonPlans[seasonIdx].forEach((instr, i) => {
    const pts = banked.lines[i].pts;
    if(pts === 0){
      // No kudos for nothing — the 0 is already showing; just hold the beat.
      fxDelay(() => fxAnnounce(
        {phase: "zero", seasonIdx, instrIndex: i, name: instr.name, pts: 0}), at);
      at += FX_BEAT_ZERO;
      return;
    }
    const features = instr.details(board);
    const totalBase = runningTotal;
    fxDelay(() => {
      fxAnnounce({phase: "instruction", seasonIdx, instrIndex: i,
                  name: instr.name, pts, features: features.length});
      playInstructionBeat(seasonIdx, i, features, pts, totalBase);
    }, at);
    at += FX_BEAT_INSTR;
    runningTotal += pts;
  });

  // Stamp the season, ploof if it earned anything, then play on.
  fxDelay(() => {
    fxAnnounce({phase: "stamp", seasonIdx, pts: banked.subtotal});
    fxSeasonIndex = -1;
    renderPlan();
    if(banked.subtotal > 0) ploofConfetti(seasonIdx);
  }, at);
  fxDelay(endSeasonScoring, at + FX_BEAT_STAMP);
}

/** One instruction's beat: pulse its cells, fly its kudos, count its line up. */
function playInstructionBeat(seasonIdx, i, features, pts, totalBase){
  const pulsed = new Set();
  for(const feature of features) for(const index of feature.cells) pulsed.add(index);
  for(const index of pulsed) boardElement.children[index].classList.add("scored");
  fxDelay(() => {
    for(const index of pulsed) boardElement.children[index].classList.remove("scored");
  }, FX_BEAT_INSTR);

  // One kudo per contributing tile — see kudoLabelsForFeature for how each is
  // labelled. The numbers on screen always sum to the real score.
  let k = 0;
  const coins = [];
  for(const feature of features){
    for(const { index, text, isSpark } of kudoLabelsForFeature(feature)){
      coins.push({ el: spawnKudo(index, text, Math.min(k * 18, 320), isSpark), index });
      k++;
    }
  }

  // After a beat resting on their tiles, the coins sweep into the score box.
  fxDelay(() => sweepKudosToTotal(coins), FX_KUDO_HOLD);

  fxCountUp(document.getElementById(`ipts-${seasonIdx}-${i}`),
            document.getElementById("total"),
            totalBase, pts, FX_BEAT_INSTR * .9);
}

/** How each contributing tile of a feature is labelled. When the feature's
 *  points divide evenly across its tiles, every tile carries the share
 *  ("+2", "+1"…); otherwise the tile nearest the feature's centre carries the
 *  full "+pts" and the rest are wordless sparks ("✦"). Either way the numbers
 *  shown always sum to feature.pts. Returns [{index, text, isSpark}] in cell
 *  order — pure, so it is unit-tested directly. */
function kudoLabelsForFeature(feature){
  const perTile = feature.pts / feature.cells.length;
  const labelled = Number.isInteger(perTile) ? null : nearestToCentroid(feature.cells);
  return feature.cells.map(index => {
    const isSpark = labelled !== null && index !== labelled;
    return {
      index,
      isSpark,
      text: labelled === null ? `+${perTile}` : (isSpark ? "✦" : `+${feature.pts}`),
    };
  });
}

/** The cell index nearest the centroid of a feature's cells. */
function nearestToCentroid(cellIndices){
  const coords = cellIndices.map(cellRowCol);
  const midRow = coords.reduce((sum, c) => sum + c.row, 0) / coords.length;
  const midCol = coords.reduce((sum, c) => sum + c.col, 0) / coords.length;
  let best = cellIndices[0], bestDistance = Infinity;
  coords.forEach((c, i) => {
    const d = (c.row - midRow) ** 2 + (c.col - midCol) ** 2;
    if(d < bestDistance){ bestDistance = d; best = cellIndices[i]; }
  });
  return best;
}

/** A "+n" coin (or spark) that pops onto one board cell and rests there.
 *  It settles in place and holds until sweepKudosToTotal flies it away (or
 *  fxCleanup sweeps it at tally end). Returns the element. */
function spawnKudo(cellIdx, text, delayMs, isSpark){
  const rect = boardElement.children[cellIdx].getBoundingClientRect();
  const el = document.createElement("span");
  el.className = isSpark ? "kudo spark" : "kudo";
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top + rect.height / 2}px`;
  el.style.animationDelay = `${delayMs * fxClock.scale}ms`;
  document.body.appendChild(el);
  fxNodes.push(el);
  return el;
}

/** Fly the beat's coins into the "Total score" box, rapid-fire and ordered
 *  top-left → bottom-right (ascending cell index). Each coin translates from
 *  where it rests to the box's centre and removes itself on arrival. */
function sweepKudosToTotal(coins){
  const totalEl = document.getElementById("total");
  if(!totalEl) return;
  const target = totalEl.getBoundingClientRect();
  const tx = target.left + target.width / 2;
  const ty = target.top + target.height / 2;

  [...coins].sort((a, b) => a.index - b.index).forEach(({ el }, rank) => {
    const restX = parseFloat(el.style.left);
    const restY = parseFloat(el.style.top);
    el.style.setProperty("--sweep-dx", `${tx - restX}px`);
    el.style.setProperty("--sweep-dy", `${ty - restY}px`);
    el.style.animationDelay =
      `${Math.min(rank * FX_SWEEP_STAGGER, FX_SWEEP_STAGGER_CAP) * fxClock.scale}ms`;
    el.addEventListener("animationend", () => el.remove());
    el.classList.add("sweeping");
  });
}

/** Count a plan line up from 0 to pts, ticking the grand total along.
 *  Time accumulates frame by frame so the fx clock's scale and pause hold. */
function fxCountUp(lineEl, totalEl, totalBase, pts, duration){
  let progress = 0;
  let last = performance.now();
  const step = now => {
    if(!fxClock.paused) progress += (now - last) / fxClock.scale;
    last = now;
    const t = Math.min(1, progress / duration);
    const eased = 1 - (1 - t) * (1 - t);   // fast start, soft landing
    const value = Math.round(pts * eased);
    if(lineEl) lineEl.textContent = value;
    if(totalEl) totalEl.textContent = totalBase + value;
    if(t < 1) fxRafs.push(requestAnimationFrame(step));
  };
  fxRafs.push(requestAnimationFrame(step));
}

/** A low-key burst of council-coloured paper over the season's stamp.
 *  Pieces clean themselves up, so they may drift on past the tally. */
function ploofConfetti(seasonIdx){
  const seasonEl = document.getElementById("plan").children[seasonIdx];
  // Burst from just above the surveyor's tick — the "✓ banked" stamp on the
  // card's right edge — falling back to the card or board if it isn't there.
  const stampEl = seasonEl && seasonEl.querySelector(".stamp");
  const anchor = (stampEl || seasonEl || boardElement).getBoundingClientRect();
  const originX = anchor.left + anchor.width / 2;
  const originY = anchor.top - 2;
  const colours = [...TYPES.map(t => t.hex), "#9A6A1C"];
  const S = 1.25;   // a burst a quarter bigger than the original ploof
  for(let i = 0; i < 26; i++){
    const el = document.createElement("span");
    el.className = "confetti";
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    el.style.background = randomItem(colours);
    el.style.width = `${(4 + Math.random() * 4) * S}px`;
    el.style.height = `${(6 + Math.random() * 4) * S}px`;
    el.style.setProperty("--dx", `${Math.round((Math.random() * 140 - 70) * S)}px`);
    el.style.setProperty("--pop", `${Math.round((-30 - Math.random() * 40) * S)}px`);
    el.style.setProperty("--fall", `${Math.round((40 + Math.random() * 50) * S)}px`);
    el.style.setProperty("--spin", `${Math.round(Math.random() * 540 - 270)}deg`);
    el.style.animationDelay = `${Math.floor(Math.random() * 90) * fxClock.scale}ms`;
    el.addEventListener("animationend", () => el.remove());
    document.body.appendChild(el);
  }
}
