// Mixed Use: add a diversity quota to rows.
registerInstruction({
  deal(){
    return {
      name: "Mixed Use",
      desc: `4 points per row containing at least 3 different improvement types.`,
      score(board){
        let points = 0;
        for(let row = 0; row < GRID_SIZE; row++){
          const typesInRow = new Set();
          for(let col = 0; col < GRID_SIZE; col++){
            const value = board[cellIndex(row, col)];
            if(value !== null && value !== MOUNTAIN) typesInRow.add(value);
          }
          if(typesInRow.size >= 3) points += 4;
        }
        return points;
      }
    };
  }
});
