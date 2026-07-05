"use strict";

/* =====================================================================
 *  ZONE PLANNER — build script (zero dependencies).
 *
 *  The game source lives as plain-script FRAGMENTS under src/ — no
 *  import/export, just shared globals, exactly like one big file split
 *  for maintainability. src/game/ is shared; src/desktop/ and src/mobile/
 *  each add a UI layer (render + boot + template + layout CSS). This script
 *  concatenates the shared core with each shell's UI and inlines the result
 *  (plus shared + shell CSS) into self-contained, shippable HTML in dist/.
 *
 *    node build.js          build dist/zone-planner.html,
 *                                 dist/zone-planner.mobile.html
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
const DESKTOP_DIR = path.join(SRC, "desktop");
const MOBILE_DIR = path.join(SRC, "mobile");
const INSTR_DIR = path.join(SRC, "instructions");
const TESTS_DIR = path.join(ROOT, "tests");
const DIST = path.join(ROOT, "dist");

// The shared game fragments, in dependency order. Everything below the UI
// layer is layout-agnostic and lives in src/game/. Instructions slot in
// between scoring-core (which declares the registry array) and state.js
// (which deals from INSTRUCTION_TEMPLATES). The UI layer — render + boot —
// is supplied per shell (desktop or mobile) as `uiFiles`.
const GAME_CORE = [
  "constants.js", "types.js", "shapes.js", "utils.js",
  "cards.js", "mountains.js", "scoring-core.js",
];
const SHARED_STATE = "state.js";

const read = p => fs.readFileSync(p, "utf8");

/** All instruction fragments, sorted for a deterministic build. */
function instructionFiles(){
  return fs.readdirSync(INSTR_DIR)
    .filter(name => name.endsWith(".js"))
    .sort()
    .map(name => path.join(INSTR_DIR, name));
}

/** Concatenate the shared core + instructions + state + a shell's UI files
 *  into one strict-mode script. `uiFiles` are absolute paths. */
function buildGameJs(uiFiles){
  const files = [
    ...GAME_CORE.map(f => path.join(GAME_DIR, f)),
    ...instructionFiles(),
    path.join(GAME_DIR, SHARED_STATE),
    ...uiFiles,
  ];
  return `"use strict";\n${files.map(read).join("\n")}`;
}

/** Replace a {{MARKER}} with content. A function replacement is used so
 *  `$` sequences in the code/CSS (e.g. template literals) are left alone. */
const inline = (template, marker, content) =>
  template.replace(marker, () => content);

/** The shared theme sheet, concatenated ahead of a shell's layout sheet. */
function shellStyles(shellDir){
  return read(path.join(GAME_DIR, "styles.css")) + "\n" +
         read(path.join(shellDir, "styles.css"));
}

/** Inline a template's {{STYLES}} + {{GAME_JS}} slots and return the HTML. */
function renderShell(templatePath, css, gameJs){
  return inline(
    inline(read(templatePath), "{{STYLES}}", css),
    "{{GAME_JS}}", gameJs);
}

/** Build all three self-contained HTML files. Returns the desktop bundle
 *  sources (used by the headless test run). */
function build(){
  const desktopJs = buildGameJs(
    [path.join(DESKTOP_DIR, "render.js"), path.join(DESKTOP_DIR, "boot.js")]);
  const mobileJs = buildGameJs(
    [path.join(MOBILE_DIR, "render.js"), path.join(MOBILE_DIR, "boot.js")]);
  const testsJs = read(path.join(TESTS_DIR, "zone-planner.tests.js"));

  fs.mkdirSync(DIST, { recursive: true });

  fs.writeFileSync(path.join(DIST, "zone-planner.html"),
    renderShell(path.join(DESKTOP_DIR, "template.html"), shellStyles(DESKTOP_DIR), desktopJs));

  fs.writeFileSync(path.join(DIST, "zone-planner.mobile.html"),
    renderShell(path.join(MOBILE_DIR, "template.html"), shellStyles(MOBILE_DIR), mobileJs));

  // The test page reuses the desktop bundle; its boot guard keeps it from
  // starting a game with no #board, exactly as before.
  const testHtml = inline(
    inline(read(path.join(TESTS_DIR, "template.html")), "{{GAME_JS}}", desktopJs),
    "{{TESTS_JS}}", testsJs);
  fs.writeFileSync(path.join(DIST, "zone-planner.tests.html"), testHtml);

  return { gameJs: desktopJs, testsJs };
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
  console.log("Built dist/zone-planner.html, dist/zone-planner.mobile.html and dist/zone-planner.tests.html");
}
