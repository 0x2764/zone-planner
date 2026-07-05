// Irrigation: farms next to water.
registerInstruction({
  deal(){
    return {
      name: "Irrigation",
      desc: `2 points for every edge where a ${chipHtml("farm")} touches a ${chipHtml("lake")}.`,
      score(board){
        let points = 0;
        for(let row = 0; row < GRID_SIZE; row++){
          for(let col = 0; col < GRID_SIZE; col++){
            if(board[cellIndex(row, col)] !== "farm") continue;
            for(const [dr, dc] of ORTHOGONAL_NEIGHBOURS){
              const nr = row + dr, nc = col + dc;
              if(isInsideGrid(nr, nc) && board[cellIndex(nr, nc)] === "lake") {
                points = points + 2;
              }
            }
          }
        }
        return points;
      }
    };
  }
});
