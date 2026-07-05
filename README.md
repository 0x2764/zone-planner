### Zone Planner

> You are an employee at the local council, and you've been tasked with creating the plan for a new block of land. The council is able to build four types of improvement: **farm**, **lake**, **forest**, or **city**. It builds one per turn, and your job is to place it according to the instructions of the mayor, who awards you points at the end of the season for clever placement of improvements. The mayor has a plan for the year, with different instructions for each season. Earn the most points and become a **legendary Zone Planner**!

This is a simple, HTML5 polyominoes game inspired by Cryptographers. 

Play it online — every push to `main` is published to [dist/zone-planner.html](https://0x2764.github.io/zone-planner/zone-planner.html). 

Or build it yourself: it compiles to a single, self-contained `dist/zone-planner.html` you can open in a browser or copy anywhere.

### Developing

The game is written as small, focused source fragments under `src/` and compiled into the self-contained `dist/` files by a small Node script. 

#### Build and test

The shipped game has no dependencies; the dev dependencies are `marked` (used at build time to render `RULES.md` into the in-game rules modal) and Playwright (used solely by the end-to-end test). Run `npm ci` (or `npm install`) once before building so `marked` is available.

```
npm ci                  # install build/test dependencies (first time only)
node build.js          # build dist/zone-planner.html + dist/zone-planner.fx.html + dist/zone-planner.tests.html
node build.js --test    # build, run the unit suite headlessly, and check the built HTML (non-zero exit on failure)
npm run test:e2e        # boot dist/ in headless Chromium, drive a season to its scoring tally, screenshot it
                        # (first time: npm ci && npx playwright install chromium)
```

The e2e test drives the game through two no-op-in-normal-play URL hooks: `?seed=N` makes the whole year deterministic, and `?test=1` exposes a `window.__zp` driver. See `.claude/skills/verify/SKILL.md` for the full verification recipe.

#### Howtos

- **Add a scoring instruction** — drop a file in `src/instructions/` that calls `registerInstruction({ deal() { … } })`. The build globs it in automatically.
- **Add an improvement type** — add one entry to the `TYPES` array in `src/game/types.js`; every derived table and consumer follows.
- **Tune the animations** — open `dist/zone-planner.fx.html`, the FX/QA sandbox: speed up or slow down the fx clock, pause with Space, step beats with `n`, replay the last tally with `r`, and auto-deal to the next season end with `a`. An overlay shows which beat is playing.

#### Architecture

- `src/game/*` are plain-script fragments sharing one global scope (no import/export); 
- `build.js` concatenates them in dependency order and inlines the result plus `src/styles.css` into the shippable HTML. 
- `dist/` is generated and git-ignored — run `node build.js` to produce it locally; CI builds it fresh and deploys it to GitHub Pages.