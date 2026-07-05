// Moat: lake ringing the block.
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 0; row < GRID_SIZE; row++){
        for(let col = 0; col < GRID_SIZE; col++){
          const onEdge = row === 0 || row === GRID_SIZE - 1
                  || col === 0 || col === GRID_SIZE - 1;
          const index = cellIndex(row, col);
          if(onEdge && board[index] === "lake") features.push({cells: [index], pts: 1});
        }
      }
      return features;
    };
    return {
      name: "Moat",
      desc: `1 point per ${chipHtml("lake")} tile on the outer edge of the block.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
