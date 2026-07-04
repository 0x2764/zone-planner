// Homesteads: a chosen type kept apart from its own kind.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    return {
      name: "Homesteads",
      desc: `12 points per ${chipHtml(targetType)} tile with no ${TYPE_NAME[targetType]} neighbour.`,
      score(board){
        return 12 * findTypeGroups(board)
          .filter(g => g.type === targetType && g.cells.length === 1)
          .length;
      }
    };
  }
});
