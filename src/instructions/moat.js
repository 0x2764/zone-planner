// Moat: lake ringing the block.
registerInstruction({
  deal(){
    return {
      name: "Moat",
      desc: `1 point per ${chipHtml("lake")} tile on the outer edge of the block.`,
      score(board){
        let points = 0;
        for(let row = 0; row < GRID_SIZE; row++){
          for(let col = 0; col < GRID_SIZE; col++){
            const onEdge = row === 0 || row === GRID_SIZE - 1
                    || col === 0 || col === GRID_SIZE - 1;
            if(onEdge && board[cellIndex(row, col)] === "lake") points++;
          }
        }
        return points;
      }
    };
  }
});
