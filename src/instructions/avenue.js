// Avenue: completed columns (mountains count as filled).
registerInstruction({
  deal(){
    return {
      name: "Avenue",
      desc: `8 points per completely filled column. ▲ mountains count as filled.`,
      score(board){
        let points = 0;
        for(let col = 0; col < GRID_SIZE; col++){
          const colIsFull = Array.from({length: GRID_SIZE},
                  (_, row) => board[cellIndex(row, col)]).every(v => v !== null);
          if(colIsFull) points += 8;
        }
        return points;
      }
    };
  }
});
