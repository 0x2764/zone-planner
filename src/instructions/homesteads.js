// Homesteads: a chosen type kept apart from its own kind. Each connected
// shape of the target type is one homestead — by definition it touches no
// other tile of its type — and scores whatever its size.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    const details = board =>
      findTypeGroups(board)
        .filter(g => g.type === targetType)
        .map(g => ({cells: groupCellIndices(g), pts: 8}));
    return {
      name: "Homesteads",
      desc: `8 points per ${chipHtml(targetType)} shape with no ${TYPE_NAME[targetType]} neighbours.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
