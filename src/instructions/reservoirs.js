// Reservoirs: substantial bodies of water (lake groups of 3+).
registerInstruction({
  deal(){
    return {
      name: "Reservoirs",
      desc: `2 points per tile in every ${chipHtml("lake")} group of 3 or more tiles.`,
      score(board){
        return 2 * findTypeGroups(board)
          .filter(g => g.type === "lake" && g.cells.length >= 3)
          .reduce((sum, g) => sum + g.cells.length, 0);
      }
    };
  }
});
