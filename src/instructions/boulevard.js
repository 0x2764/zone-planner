// Through Streets: completed rows (mountains count as filled).
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 0; row < GRID_SIZE; row++){
        const cells = Array.from({length: GRID_SIZE}, (_, col) => cellIndex(row, col));
        if(cells.every(index => board[index] !== null)) features.push({cells, pts: 8});
      }
      return features;
    };
    return {
      name: "Through Streets",
      desc: `8 points per completely filled row. ▲ mountains count as filled.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
