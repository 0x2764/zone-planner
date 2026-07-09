### Jobs to be done

1. Four instructions per year. Spring: A & B, Summer: B & C, Autumn: C & D, Winter: D & A - let's keep existing instruction layout, two per season.
2. Create a new type-driven instruction for wet-edges, and add a `wetEdge` property to each type object:
   - Farm.wetEdge:"Canal Cake"
   - Forest.wetEdge:"Food Forest"
   - City.wetEdge:"Riverfront"
   - River.wetEdge:"Wetlands"
6. New feature: Allow freezing the instructions (separate seed for instruction draws), and competing against yourself year to year on the same instruction seed, tracking the high score. 

### Future Projects

1. Add mountain surrounding perk, implement using hidden *always scored" instruction: 1 point per surrounded mountain 
2. Add new improvement type "nuisance", using hidden instruction: -1 point per enclosure open edge. It's an adversarial improvement that the player must contain to avoid the mayor's displeasure. Examples include Strip Mine · Feedlot · Shantytown · Cultist Compound · Alligator Swamp · Casino.
3. New feature: Flip the annual review over to see career history and high score for each instruction (in the current session; there is no career save)
4. Design a mobile version, with the grid anchored to the bottom, instructions and improvements small (but zoomable!). Split CSS and JS into global vs desktop or mobile.