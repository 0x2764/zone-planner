// Alpine Resorts: a chosen type hugging the mountains.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    const details = board =>
      tilesWithNeighbour(board, targetType, v => v === MOUNTAIN)
        .map(index => ({cells: [index], pts: 2}));
    return {
      name: "Alpine Resorts",
      desc: `2 points per ${chipHtml(targetType)} tile adjacent to a ▲ mountain.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
