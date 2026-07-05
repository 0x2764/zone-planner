// Largest group of a chosen type. The instruction is named for its target:
// Great Lake (lake), Metropolis (city), Bread Basket (farm), National Park
// (forest) — those names live on each type as `groupName` in types.js.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    const details = board => {
      const bigGroups = findTypeGroups(board).filter(g => g.type === targetType);
      if(bigGroups.length === 0) return [];
      const biggest = bigGroups.reduce((best, g) =>
        g.cells.length > best.cells.length ? g : best);
      return [{cells: groupCellIndices(biggest), pts: 2 * biggest.cells.length}];
    };
    return {
      name: TYPE_GROUP_NAME[targetType],
      desc: `2 points per tile in your single largest ${chipHtml(targetType)} group.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
