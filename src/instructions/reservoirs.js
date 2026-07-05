// Reservoirs: substantial bodies of water (lake groups of 3+). Scored per
// tile, so each tile of a qualifying group is its own feature.
registerInstruction({
  deal(){
    const details = board =>
      findTypeGroups(board)
        .filter(g => g.type === "lake" && g.cells.length >= 3)
        .flatMap(g => groupCellIndices(g).map(index => ({cells: [index], pts: 2})));
    return {
      name: "Reservoirs",
      desc: `2 points per tile in every ${chipHtml("lake")} group of 3 or more tiles.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
