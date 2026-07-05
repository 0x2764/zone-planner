// Districts: solid 2×2 blocks of one type (overlapping squares each count).
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 0; row < GRID_SIZE - 1; row++){
        for(let col = 0; col < GRID_SIZE - 1; col++){
          const cells = [cellIndex(row, col),     cellIndex(row, col + 1),
                         cellIndex(row + 1, col), cellIndex(row + 1, col + 1)];
          const topLeft = board[cells[0]];
          if(topLeft !== null && topLeft !== MOUNTAIN
              && cells.every(index => board[index] === topLeft)){
            features.push({cells, pts: 3});
          }
        }
      }
      return features;
    };
    return {
      name: "Districts",
      desc: `3 points per 2×2 square of a single improvement type.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
