// Districts: solid 2×2 blocks of one type (overlapping squares each count).
registerInstruction({
  deal(){
    return {
      name: "Districts",
      desc: `3 points per 2×2 square of a single improvement type.`,
      score(board){
        let points = 0;
        for(let row = 0; row < GRID_SIZE - 1; row++){
          for(let col = 0; col < GRID_SIZE - 1; col++){
            const topLeft = board[cellIndex(row, col)];
            if(topLeft !== null && topLeft !== MOUNTAIN
                && board[cellIndex(row, col + 1)] === topLeft
                && board[cellIndex(row + 1, col)] === topLeft
                && board[cellIndex(row + 1, col + 1)] === topLeft){
              points += 3;
            }
          }
        }
        return points;
      }
    };
  }
});
