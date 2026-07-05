### Jobs to be done

1. ~~Add light scoring animation at the end of the season: play pauses, kudos (points) fly off of each scored block, and the score goes up with a little ploof of low-key, tasteful confetti at the end~~
1. ~~Rewrite RULES.md to stay true to theme: this is a block of land, you are placing improvements while trying to follow the mayor's instructions.~~
2. ~~Update Boulevards to Through Streets~~
3. ~~Create new improvement shapes: `[0,0],[1,1]` and `[0,0],[1,1],[2,2]`, and `[[0,0],[1,0],[2,0],[2,1],[2,3]]`~~
4. ~~Tech debt: Compute total turns by adding up per-season turns~~
5. ~~Improvement: Button to display RULES.md in a modal (build process converts markdown to HTML?)~~
6. New feature: Allow freezing the instructions (separate seed for instruction draws), and competing against yourself year to year on the same instruction seed, tracking the high score. 

### Future Projects

1. Add mountain surrounding perk, implement using hidden *always scored" instruction: 1 point per surrounded mountain 
2. Add new improvement type "nuisance", using hidden instruction: -1 point per enclosure open edge. It's an adversarial improvement that the player must contain to avoid the mayor's displeasure. Examples include Strip Mine · Feedlot · Shantytown · Cultist Compound · Alligator Swamp · Casino.
3. New feature: Flip the annual review over to see career history and high score for each instruction (in the current session; there is no career save)
4. Design a mobile version, with the grid anchored to the bottom, instructions and improvements small (but zoomable!). Split CSS and JS into global vs desktop or mobile.