### Zone Planner

> You are an employee at the local council, and you've been tasked with creating the plan for a new block of land. The land has some mountains scattered through it — you can't build on those. The council is able to build four types of improvement: **farm**, **lake**, **forest**, or **city**. It builds one per turn, and your job is to place it according to the instructions of the mayor, who awards you points at the end of the season for clever placement of improvements. The mayor has a plan for the year, with different instructions for each season. Earn the most points and become a legendary Zone Planner!

This is a simple, HTML5 polyominoes game inspired by Cryptographers. 

Play it online — every push to `main` is published to **GitHub Pages** (see the repo's Pages URL). Or build it yourself: it compiles to a single, self-contained `dist/zone-planner.html` you can open in a browser or copy anywhere.

### Developing

The game is written as small, focused source fragments under `src/` and compiled into the self-contained `dist/` files by a zero-dependency Node script:

```
node build.js          # build dist/zone-planner.html + dist/zone-planner.tests.html
node build.js --test    # build, then run the test suite headlessly (non-zero exit on failure)
```

- **Add a scoring instruction** — drop a file in `src/instructions/` that calls `registerInstruction({ deal() { … } })`. The build globs it in automatically.
- **Add an improvement type** — add one entry to the `TYPES` array in `src/game/types.js`; every derived table and consumer follows.

`src/game/*` are plain-script fragments sharing one global scope (no import/export); `build.js` concatenates them in dependency order and inlines the result plus `src/styles.css` into the shippable HTML. `dist/` is generated and git-ignored — run `node build.js` to produce it locally; CI builds it fresh and deploys it to GitHub Pages.