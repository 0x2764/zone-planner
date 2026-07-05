// Downtown: city in the central 7×7.
registerInstruction({
  deal(){
    const details = board => {
      const features = [];
      for(let row = 2; row <= 8; row++){
        for(let col = 2; col <= 8; col++){
          const index = cellIndex(row, col);
          if(board[index] === "city") features.push({cells: [index], pts: 2});
        }
      }
      return features;
    };
    return {
      name: "Downtown",
      desc: `2 points per ${chipHtml("city")} tile inside the central 7x7 square.`,
      details,
      score: board => scoreFromDetails(details(board)),
    };
  }
});
