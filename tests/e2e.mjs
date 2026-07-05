/* =====================================================================
 *  ZONE PLANNER — end-to-end smoke + tally test.
 *
 *  The unit suite (node build.js --test) exercises the pure logic with a
 *  DOM shim; it never opens a browser, so it can't catch a boot failure or
 *  confirm the scoring tally actually runs. This does: it launches the
 *  built game in headless Chromium, checks it boots clean, then drives a
 *  full season to its scoring animation via the ?test=1 window.__zp hook
 *  and screenshots the shimmering scored tiles.
 *
 *    npm run test:e2e        (needs `npx playwright install chromium`)
 *
 *  Exits non-zero on any failure — CI-friendly. Requires a fresh build:
 *  run `node build.js` first (the CI job and the README both do).
 * ===================================================================== */

import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GAME = join(HERE, "..", "dist", "zone-planner.html");
const ARTIFACTS = join(HERE, "__artifacts__");

/** Deterministic, driveable load: fixed year + the headless test hook. */
const url = pathToFileURL(GAME).href + "?seed=1&test=1";

const failures = [];
const check = (ok, message) => { if(!ok){ failures.push(message); console.log("  ✗ " + message); }
                                 else console.log("  ✓ " + message); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });

// Any console error or uncaught exception fails the smoke test.
const consoleErrors = [];
page.on("console", msg => { if(msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", err => consoleErrors.push(String(err)));

try {
  await page.goto(url);

  // ---- boot smoke test --------------------------------------------------
  const cellCount = await page.locator("#board").evaluate(el => el.children.length);
  check(cellCount === 121, `board renders 121 cells (got ${cellCount})`);
  check(await page.evaluate(() => typeof window.__zp === "object"),
        "?test=1 exposes the window.__zp driver");

  // ---- reach the scoring tally -----------------------------------------
  // Play the first season out; the closing placement banks it and starts the
  // tally, which pulses scored tiles a beat later.
  await page.evaluate(() => window.__zp.playSeason());
  const state = await page.evaluate(() => window.__zp.state());
  check(state.fxSeasonIndex !== -1, `a season banked and its tally is playing (season ${state.fxSeasonIndex})`);
  check(state.bankedTotal >= 0, `banked total is a number (${state.bankedTotal})`);

  // The shimmer lands on scored tiles after the opening beat.
  await page.locator(".cell.scored").first().waitFor({ state: "attached", timeout: 8000 });
  const scored = await page.locator(".cell.scored").count();
  check(scored > 0, `scored tiles are shimmering (${scored} cells)`);

  mkdirSync(ARTIFACTS, { recursive: true });
  const shot = join(ARTIFACTS, "tally.png");
  await page.locator("#board").screenshot({ path: shot });
  console.log("  → screenshot: " + shot);

  check(consoleErrors.length === 0,
        `no console errors (${consoleErrors.length}${consoleErrors.length ? ": " + consoleErrors.join(" | ") : ""})`);
} catch (err) {
  failures.push("threw: " + (err && err.message ? err.message : String(err)));
  console.log("  ✗ " + failures.at(-1));
} finally {
  await browser.close();
}

if(failures.length){
  console.log(`\nFAIL — ${failures.length} e2e check(s) failed`);
  process.exit(1);
}
console.log("\nPASS — e2e boot + tally");
