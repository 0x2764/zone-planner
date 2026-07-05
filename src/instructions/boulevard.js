// Through Streets: completed rows (mountains count as filled).
registerInstruction({
  deal(){
    return {
      name: "Through Streets",
      desc: `8 points per completely filled row. ▲ mountains count as filled.`,
      score(board){
        let points = 0;
        for(let row = 0; row < GRID_SIZE; row++){
          const rowIsFull = Array.from({length: GRID_SIZE},
            (_, col) => board[cellIndex(row, col)]).every(v => v !== null);
          if(rowIsFull) points += 8;
        }
        return points;
      }
    };
  }
});
