// Downtown: city in the central 7×7.
registerInstruction({
  deal(){
    return {
      name: "Downtown",
      desc: `2 points per ${chipHtml("city")} tile inside the central 7x7 square.`,
      score(board){
        let points = 0;
        for(let row = 2; row <= 8; row++){
          for(let col = 2; col <= 8; col++){
            if(board[cellIndex(row, col)] === "city") points += 2;
          }
        }
        return points;
      }
    };
  }
});
