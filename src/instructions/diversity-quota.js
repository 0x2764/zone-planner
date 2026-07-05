// Mixed Use: add a diversity quota to rows.
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 0; row < GRID_SIZE; row++){
        const improvementCells = [];
        const typesInRow = new Set();
        for(let col = 0; col < GRID_SIZE; col++){
          const index = cellIndex(row, col);
          const value = board[index];
          if(value !== null && value !== MOUNTAIN){
            typesInRow.add(value);
            improvementCells.push(index);
          }
        }
        if(typesInRow.size >= 3) features.push({cells: improvementCells, pts: 4});
      }
      return features;
    };
    return {
      name: "Mixed Use",
      desc: `4 points per row containing at least 3 different improvement types.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
