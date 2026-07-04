// Largest group of a chosen type. The instruction is named for its target:
// Great Lake (lake), Metropolis (city), Bread Basket (farm), National Park
// (forest) — those names live on each type as `groupName` in types.js.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    return {
      name: TYPE_GROUP_NAME[targetType],
      desc: `2 points per tile in your single largest ${chipHtml(targetType)} group.`,
      score(board){
        const bigGroups = findTypeGroups(board).filter(g => g.type === targetType);
        if(bigGroups.length === 0) return 0;
        return 2 * Math.max(...bigGroups.map(g => g.cells.length));
      }
    };
  }
});
