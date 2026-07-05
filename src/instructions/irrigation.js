// Irrigation: farms next to water. Each farm–lake edge is one feature,
// naming both banks of the edge.
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 0; row < GRID_SIZE; row++){
        for(let col = 0; col < GRID_SIZE; col++){
          const farmIndex = cellIndex(row, col);
          if(board[farmIndex] !== "farm") continue;
          for(const [dr, dc] of ORTHOGONAL_NEIGHBOURS){
            const nr = row + dr, nc = col + dc;
            if(isInsideGrid(nr, nc) && board[cellIndex(nr, nc)] === "lake"){
              features.push({cells: [farmIndex, cellIndex(nr, nc)], pts: 2});
            }
          }
        }
      }
      return features;
    };
    return {
      name: "Irrigation",
      desc: `2 points for every edge where a ${chipHtml("farm")} touches a ${chipHtml("lake")}.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
