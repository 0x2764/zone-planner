// Alpine Resorts: a chosen type hugging the mountains.
registerInstruction({
  deal(){
    const targetType = randomItem(TYPES).id;
    return {
      name: "Alpine Resorts",
      desc: `2 points per ${chipHtml(targetType)} tile adjacent to a ▲ mountain.`,
      score(board){
        return 2 * countTilesWithNeighbour(board, targetType, v => v === MOUNTAIN);
      }
    };
  }
});
