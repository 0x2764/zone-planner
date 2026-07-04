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
 *    node build.js          build dist/zone-planner.html
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

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const GAME_DIR = path.join(SRC, "game");
const INSTR_DIR = path.join(SRC, "instructions");
const TESTS_DIR = path.join(ROOT, "tests");
const DIST = path.join(ROOT, "dist");

// The game fragments, in dependency order. Instructions slot in between
// scoring-core (which declares the registry array) and the fragments that
// read it (state.js deals from INSTRUCTION_TEMPLATES).
const GAME_HEAD = [
  "constants.js", "types.js", "shapes.js", "utils.js",
  "cards.js", "mountains.js", "scoring-core.js",
];
const GAME_TAIL = ["state.js", "render.js", "boot.js"];

const read = p => fs.readFileSync(p, "utf8");

/** All instruction fragments, sorted for a deterministic build. */
function instructionFiles(){
  return fs.readdirSync(INSTR_DIR)
    .filter(name => name.endsWith(".js"))
    .sort()
    .map(name => path.join(INSTR_DIR, name));
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

/** Build both self-contained HTML files. Returns the concatenated sources. */
function build(){
  const gameJs = buildGameJs();
  const css = read(path.join(SRC, "styles.css"));
  const testsJs = read(path.join(TESTS_DIR, "zone-planner.tests.js"));

  fs.mkdirSync(DIST, { recursive: true });

  const gameHtml = inline(
    inline(read(path.join(SRC, "template.html")), "{{STYLES}}", css),
    "{{GAME_JS}}", gameJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.html"), gameHtml);

  const testHtml = inline(
    inline(read(path.join(TESTS_DIR, "template.html")), "{{GAME_JS}}", gameJs),
    "{{TESTS_JS}}", testsJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.tests.html"), testHtml);

  return { gameJs, testsJs };
}

/**
 * Run the suite headlessly: execute the game + test scripts together in a
 * single vm context (mirroring a browser's shared global scope) with a tiny
 * DOM shim. The test file reports via document.title and console.log and
 * guards its DOM rendering, so it runs unmodified here.
 */
function runTests(){
  const { gameJs, testsJs } = build();

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

if(process.argv.includes("--test")){
  process.exit(runTests() ? 0 : 1);
} else {
  build();
  console.log("Built dist/zone-planner.html and dist/zone-planner.tests.html");
}
