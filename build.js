"use strict";

/* =====================================================================
 *  ZONE PLANNER — build script (zero dependencies).
 *
 *  The game source lives as plain-script FRAGMENTS under src/ — no
 *  import/export, just shared globals, exactly like one big file split
 *  for maintainability. This script concatenates them in dependency
 *  order and inlines the result (plus the CSS) into self-contained,
 *  shippable HTML in dist/.
 *
 *    node build.js          build dist/zone-planner.html,
 *                                 dist/zone-planner.fx.html (QA sandbox)
 *                                 and dist/zone-planner.tests.html
 *    node build.js --test   build, then run the test suite headlessly
 *                           (exits non-zero on any failure — CI-friendly)
 *
 *  ADDING AN INSTRUCTION: drop a file in src/instructions/ that calls
 *  registerInstruction({ deal() { ... } }). It is globbed in automatically.
 *
 *  ADDING AN IMPROVEMENT: add one entry to the TYPES array in
 *  src/game/types.js; the derived tables and every consumer follow.
 * ===================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { marked } = require("marked");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const GAME_DIR = path.join(SRC, "game");
const INSTR_DIR = path.join(SRC, "instructions");
const TESTS_DIR = path.join(ROOT, "tests");
const DIST = path.join(ROOT, "dist");
const RULES = path.join(ROOT, "RULES.md");

// The game fragments, in dependency order. Instructions slot in between
// scoring-core (which declares the registry array) and the fragments that
// read it (state.js deals from INSTRUCTION_TEMPLATES).
const GAME_HEAD = [
  "constants.js", "types.js", "shapes.js", "utils.js",
  "cards.js", "mountains.js", "scoring-core.js",
];
const GAME_TAIL = ["state.js", "render.js", "fx.js", "boot.js"];

const read = p => fs.readFileSync(p, "utf8");

/** All instruction fragments, sorted for a deterministic build. */
function instructionFiles(){
  return fs.readdirSync(INSTR_DIR)
    .filter(name => name.endsWith(".js"))
    .sort()
    .map(name => path.join(INSTR_DIR, name));
}

/** Per-type board CSS, generated from the TYPES table so types.js stays the
 *  single source of truth for improvement colours. Evaluates the (self-
 *  contained) types.js fragment in a vm and reads back TYPES — the top-level
 *  `const TYPES` isn't a sandbox property, so we surface it via `this`. */
function typeStylesCss(){
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${read(path.join(GAME_DIR, "types.js"))}\nthis.__TYPES = TYPES;`,
    sandbox, { filename: "types.fragment.js" });
  const types = sandbox.__TYPES;
  const vars = types.map(t => `--${t.id}:${t.hex}`).join(";");
  const rules = types.map(t => `.cell.${t.id}{background-color:var(--${t.id})}`).join("\n");
  return `:root{${vars}}\n${rules}`;
}

/** Concatenate every fragment into one strict-mode script. */
function buildGameJs(){
  const files = [
    ...GAME_HEAD.map(f => path.join(GAME_DIR, f)),
    ...instructionFiles(),
    ...GAME_TAIL.map(f => path.join(GAME_DIR, f)),
  ];
  return `"use strict";\n${files.map(read).join("\n")}`;
}

/** Replace a {{MARKER}} with content. A function replacement is used so
 *  `$` sequences in the code/CSS (e.g. template literals) are left alone. */
const inline = (template, marker, content) =>
  template.replace(marker, () => content);

/** Build the self-contained HTML files. Returns the concatenated sources. */
function build(){
  const gameJs = buildGameJs();
  const css = inline(read(path.join(SRC, "styles.css")), "{{TYPE_STYLES}}", typeStylesCss());
  const testsJs = read(path.join(TESTS_DIR, "zone-planner.tests.js"));
  // The FX sandbox: the same game plus the QA harness appended.
  const fxJs = `${gameJs}\n${read(path.join(SRC, "fx-sandbox.js"))}`;
  // RULES.md rendered to HTML for the in-game rules modal — RULES.md stays the
  // single source of truth; marked's default GFM handles its tables.
  const rulesHtml = marked.parse(read(RULES));

  fs.mkdirSync(DIST, { recursive: true });

  const template = read(path.join(SRC, "template.html"));

  // Shared markers for both playable builds; each then inlines its own script.
  const page = inline(inline(template, "{{STYLES}}", css), "{{RULES_HTML}}", rulesHtml);

  const gameHtml = inline(page, "{{GAME_JS}}", gameJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.html"), gameHtml);

  const fxHtml = inline(page, "{{GAME_JS}}", fxJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.fx.html"), fxHtml);

  const testHtml = inline(
    inline(read(path.join(TESTS_DIR, "template.html")), "{{GAME_JS}}", gameJs),
    "{{TESTS_JS}}", testsJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.tests.html"), testHtml);

  return { gameJs, testsJs, fxJs };
}

/**
 * Run the suite headlessly: execute the game + test scripts together in a
 * single vm context (mirroring a browser's shared global scope) with a tiny
 * DOM shim. The test file reports via document.title and console.log and
 * guards its DOM rendering, so it runs unmodified here.
 */
function runTests(){
  const { gameJs, testsJs, fxJs } = build();

  // The sandbox harness can't run headlessly (it needs #board), but a
  // syntax error in it should still fail CI — compile without executing.
  new vm.Script(fxJs, { filename: "zone-planner.fx.bundle.js" });

  let pageTitle = "";
  const sandbox = {
    console,
    window: { matchMedia: () => ({ matches: false }) },
    document: {
      getElementById: () => null,          // no #board, no #results
      get title(){ return pageTitle; },
      set title(value){ pageTitle = value; },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(`${gameJs}\n${testsJs}`, sandbox, { filename: "zone-planner.bundle.js" });

  return pageTitle.startsWith("PASS");
}

/**
 * Guard the built HTML: every {{MARKER}} must have been substituted, and the
 * per-type CSS generated from TYPES must be present. Catches a broken marker
 * or empty generation — which the JS-only test suite can't see — before it
 * ships green. Logs each failure and returns whether the output is sound.
 */
function checkBuiltOutput(){
  const outputs = ["zone-planner.html", "zone-planner.fx.html", "zone-planner.tests.html"];
  let ok = true;
  const fail = msg => { console.log("  ✗ build output — " + msg); ok = false; };
  for(const name of outputs){
    const html = read(path.join(DIST, name));
    const leftover = html.match(/\{\{[A-Z_]+\}\}/);
    if(leftover) fail(`${name} has an unreplaced marker ${leftover[0]}`);
  }
  // The two HTMLs that carry CSS must show the generated type styles, and the
  // rendered rules — a stable phrase and the GFM table markup marked emits.
  for(const name of ["zone-planner.html", "zone-planner.fx.html"]){
    const html = read(path.join(DIST, name));
    if(!html.includes("--farm:")) fail(`${name} is missing the generated :root type vars`);
    if(!html.includes(".cell.farm{background-color:var(--farm)}"))
      fail(`${name} is missing the generated .cell.<type> rules`);
    if(!html.includes("The instruction library"))
      fail(`${name} is missing the rendered RULES.md content`);
    if(!html.includes("<table>"))
      fail(`${name} is missing the RULES.md tables (marked GFM output)`);
  }
  return ok;
}

if(process.argv.includes("--test")){
  const testsPass = runTests();
  const outputOk = checkBuiltOutput();
  process.exit(testsPass && outputOk ? 0 : 1);
} else {
  build();
  console.log("Built dist/zone-planner.html, dist/zone-planner.fx.html and dist/zone-planner.tests.html");
}
