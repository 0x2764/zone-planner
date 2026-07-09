# Zone Planner — Rules

*A council land-use solitaire for one player.*

You are an employee at the local council, and you've been tasked with creating the plan for a new block of land. The council is able to build four types of improvement: **farm**, **lake**, **forest**, or **city**. It builds one per turn, and your job is to place it according to the instructions of the mayor, who awards you points at the end of the season for clever placement of improvements. The mayor has a plan for the year, with different instructions for each season. Earn the most points and become a **legendary Zone Planner**!

## The block of land

The block is an 11×11 grid of parcels. Five parcels contain **mountains** (▲), scattered as single peaks in the interior of the block. You may not build on mountain spaces, they are too steep for council improvements.

## The year

The game lasts one year of exactly **21 turns**, divided into four seasons of different lengths:

| Season | Builds |
|---|--------|
| Spring | 6      |
| Summer | 6      |
| Autumn | 5      |
| Winter | 4      |

## The mayor's plan

At the start of the year, the mayor issues a plan built from **four scoring instructions**, and rolls them across the seasons so each one spans **two adjacent seasons**: spring scores the first and second, summer the second and third, autumn the third and fourth, and winter the fourth and first. Every season still shows two instructions, and each instruction is scored twice — once at the end of each of its two seasons. The entire plan is visible from the first turn, so you can lay groundwork in spring for an instruction that won't be scored until winter — and a single well-placed improvement can pay off in two different seasons.

Some instructions are fixed (Irrigation always cares about farms touching lakes, Greenbelt always about forests on the edge); others pick their target when the plan is issued (Alpine Resorts might reward forests hugging the mountains one year, cities the next). An instruction keeps the same target across both of the seasons it spans.

## Playing a turn

Each turn, the council deals you one **improvement** from their inventory — you never know what's coming next. The improvement is a polyomino of 1 to 5 tiles, all of a single type, with a name describing what's being built (a farm I-piece might be a *Grain Silo Row*; a lake 2×2, a *Mill Pond*). Each type leans toward characteristic silhouettes — farms toward strips, lakes toward blobs, forests toward irregular clumps, cities toward compact blocks — but nothing is guaranteed.

The card has a fixed silhouette, but you may place it in **any rotation or reflection**, anywhere on the block where every tile lands on open land. You don't turn the card by hand — you draw it directly onto the block (see **Controls**), and the planning app works out which orientation you mean. Placements can never overlap existing improvements or mountains, and once built, an improvement is permanent. You must place the improvement — there is no skipping or discarding.

**The council grant.** If the dealt improvement doesn't fit anywhere in the block, in any rotation or flip, the council will build a **1×1 improvement of your choice** instead.

## Scoring

At the end of each season — immediately after its final build — the block is scored against that season's two instructions, and the points are **banked**. Banked points are frozen forever: nothing you build later can raise or lower a past season's score.

During a season, only its own two instructions are live. The current scores are shown as you play, and while you're deciding where to place a card, a preview shows exactly how many points that placement would add to the current season. Future seasons show a live *projected* score — what their instructions would earn on the block so far — which updates each time you build but isn't banked until that season ends. 

Your final score is the sum of the four banked season totals. The year always runs its full 21 turns; the annual review then breaks down your planning score season by season.

## The instruction library

Four of these twelve are dealt each year, then rolled across the seasons so each spans two of them. A ⟨type⟩ marks an instruction that picks its target improvement when the plan is issued.

| Instruction                                                       | Scoring                                                                                                                                                                   |
|-------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Irrigation**                                                    | 2 points for every edge where a farm tile touches a lake tile.                                                                                                            |
| **Greenbelt**                                                     | 1 point per forest tile on the outer edge of the block.                                                                                                                   |
| **Moat**                                                          | 1 point per lake tile on the outer edge of the block.                                                                                                                     |
| **Downtown**                                                      | 2 points per city tile inside the central 7×7 square.                                                                                                                     |
| **Alpine Resorts**                                                | 2 points per ⟨type⟩ tile adjacent to a ▲ mountain.                                                                                                                        |
| **Homesteads**                                                    | 8 points per ⟨type⟩ shape (connected group) with no neighbour of its own type.                                                                                            |
| **Districts**                                                     | 3 points per 2×2 square of a single improvement type (overlapping squares each count).                                                                                    |
| **Reservoirs**                                                    | 2 points per tile in every lake group of 3 or more tiles.                                                                                                                 |
| **Through Streets**                                               | 8 points per completely filled row. Mountains count as filled.                                                                                                            |
| **Avenues**                                                       | 8 points per completely filled column. Mountains count as filled.                                                                                                         |
| **Great Lake / Metropolis / Bread Basket / National Park** ⟨type⟩ | 2 points per tile in your single largest ⟨type⟩ group. The card is named for its type: Great Lake (lake), Metropolis (city), Bread Basket (farm), National Park (forest). |
| **Mixed Use**                                                     | 4 points per row containing at least 3 different improvement types.                                                                                                       |

A **group** is a set of same-type tiles connected edge-to-edge (diagonals don't connect). **Adjacent** always means sharing an edge, never just a corner.

## Controls

You place an improvement by **drawing it onto the block, one tap at a time**. Tap a parcel and the planner highlights every spot the improvement could still cover while including that parcel; tap another parcel to narrow the possibilities further. As soon as a single placement remains it appears as a solid shape showing exactly where the improvement will land. Tap the final shape once more to build. Tapping a parcel the improvement can't reach (or a filled or mountain tile) clears the shape so you can start over.

**Undo** takes back placements one at a time, all the way to the start of the year; it can even reopen a season that was just banked. **New year** deals a fresh block, deck, and plan.

## Advice from the outgoing planner

Read the mayor's instructions for the whole year before your first build. Don't chase every point in the current season if it wrecks the plan for a later one; a season's score is banked on its *last* build, so mid-season placements can serve two masters. Watch the deck count: you know how many builds remain, just not what they are, so leave flexible space that any type could use. And remember the mountains — they're obstacles for most of the year, but if Alpine Resorts is in the plan, they're the most valuable real estate on the block.
