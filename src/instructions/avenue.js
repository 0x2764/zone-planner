// Avenues: completed columns (mountains count as filled).
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let col = 0; col < GRID_SIZE; col++){
        const cells = Array.from({length: GRID_SIZE}, (_, row) => cellIndex(row, col));
        if(cells.every(index => board[index] !== null)) features.push({cells, pts: 8});
      }
      return features;
    };
    return {
      name: "Avenues",
      desc: `8 points per completely filled column. ▲ mountains count as filled.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
