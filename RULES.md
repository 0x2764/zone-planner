# Zone Planner — Rules

*A council land-use solitaire for one player.*

You are an employee at the local council, and you've been tasked with creating the plan for a new block of land. The land has some mountains scattered through it — you can't build on those. The council is able to build four types of improvement: **farm**, **lake**, **forest**, or **city**. It builds one per turn, and your job is to place it according to the instructions of the mayor, who awards you points at the end of the season for clever placement of improvements. The mayor has a plan for the year, with different instructions for each season. Earn the most points and become a legendary Zone Planner!

## The block of land

The block is an 11×11 grid of parcels. Five parcels contain **mountains** (▲), scattered as single peaks in the interior of the block, each at least two parcels from the edge and never touching one another. Mountains are permanently unbuildable.

Mountains count as *filled* land — a row containing a mountain can still be a "completely filled row" once every other parcel in it is built. But a mountain is never part of any improvement: it has no type, it doesn't join groups, and it doesn't satisfy any instruction about farms, lakes, forests, or cities. The one exception is instructions that mention mountains by name (such as **Alpine Resorts**), which reward building *next to* them.

## The year

The game lasts one year of exactly **20 turns**, divided into four seasons of different lengths:

| Season | Builds |
|---|---|
| Spring | 5 |
| Summer | 6 |
| Autumn | 5 |
| Winter | 4 |

## The mayor's plan

At the start of the year, the mayor issues a plan: **two scoring instructions for each season**, eight in total. The entire plan is visible from the first turn, so you can lay groundwork in spring for an instruction that won't be scored until winter.

Some instructions are fixed (Irrigation always cares about farms touching lakes, Greenbelt always about forests on the edge); others pick their target when the plan is issued (Alpine Resorts might reward forests hugging the mountains one year, cities the next). No instruction appears twice in the same year.

## Playing a turn

Each turn, the council deals you one **improvement card** from a face-down 20-card deck — you never know what's coming next. A card is a polyomino of 1 to 5 tiles, all of a single improvement type, with a name describing what's being built (a farm I-piece might be a *Grain Silo Row*; a lake 2×2, a *Mill Pond*). Each type leans toward characteristic silhouettes — farms toward strips, lakes toward blobs, forests toward irregular clumps, cities toward compact blocks — but nothing is guaranteed.

You may **rotate** and **flip** the card freely, then place it anywhere on the block where every tile lands on open land. Placements can never overlap existing improvements or mountains, and once built, an improvement is permanent. You must place the card — there is no skipping or discarding.

**The council grant.** If the dealt card doesn't fit anywhere on the block, in any rotation or flip, the council builds a **1×1 improvement of your choice** instead. This is the only moment in the game where you choose a type — a small consolation prize that a canny planner can sometimes engineer on purpose.

## Scoring

At the end of each season — immediately after its final build — the block is scored against that season's two instructions, and the points are **banked**. Banked points are frozen forever: nothing you build later can raise or lower a past season's score.

During a season, only its own two instructions are live. The current scores are shown as you play, and while you're deciding where to place a card, a preview shows exactly how many points that placement would add. Future seasons show a live *projected* score — what their instructions would earn on the board so far — which updates each time you build but isn't banked until that season ends. Those projections matter: the board you hand each season is the board you built all year.

Your final score is the sum of the four banked season totals. The year always runs its full 20 turns; the annual review then breaks down your score season by season.

## The instruction library

Eight of these twelve are dealt each year. A ⟨type⟩ marks an instruction that picks its target improvement when the plan is issued.

| Instruction | Scoring |
|---|---|
| **Irrigation** | 1 point for every edge where a farm tile touches a lake tile. |
| **Greenbelt** | 1 point per forest tile on the outer edge of the block. |
| **Moat** | 1 point per lake tile on the outer edge of the block. |
| **Downtown** | 2 points per city tile inside the central 7×7 square. |
| **Alpine Resorts** | 2 points per ⟨type⟩ tile adjacent to a ▲ mountain. |
| **Homesteads** | 12 points per ⟨type⟩ tile with no neighbour of its own type. |
| **Districts** | 3 points per 2×2 square of a single improvement type (overlapping squares each count). |
| **Reservoirs** | 2 points per tile in every lake group of 3 or more tiles. |
| **Boulevard** | 8 points per completely filled row. Mountains count as filled. |
| **Avenue** | 8 points per completely filled column. Mountains count as filled. |
| **Great Lake / Metropolis / Bread Basket / National Park** ⟨type⟩ | 2 points per tile in your single largest ⟨type⟩ group. The card is named for its type: Great Lake (lake), Metropolis (city), Bread Basket (farm), National Park (forest). |
| **Diversity Quota** | 4 points per row containing at least 3 different improvement types. |

A **group** is a set of same-type tiles connected edge-to-edge (diagonals don't connect). **Adjacent** always means sharing an edge, never just a corner.

## Controls

Rotate the dealt card with **R** and flip it with **F** (or the on-screen buttons). Hover over the block to preview the placement — and the points it would earn — then click to build. On touch screens, tap once to preview and tap the same spot again to confirm. **Undo** takes back placements one at a time, all the way to the start of the year; it can even reopen a season that was just banked. **New year** deals a fresh block, deck, and plan.

## Advice from the outgoing planner

Read the whole plan before your first build — winter's instructions are decided in spring. Don't chase every point in the current season if it wrecks the board for a later one; a season's score is banked on its *last* build, so mid-season placements can serve two masters. Watch the deck count: you know how many cards remain, just not what they are, so leave flexible space that any type could use. And remember the mountains — they're obstacles for most of the year, but if Alpine Resorts is in the plan, they're the most valuable real estate on the block.
