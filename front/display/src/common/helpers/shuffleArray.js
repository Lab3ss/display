const shuffle = (data) => {
  const tmpData = [...data];
  let currentIndex = tmpData.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = tmpData[currentIndex];
    tmpData[currentIndex] = tmpData[randomIndex];
    tmpData[randomIndex] = temporaryValue;
  }
  return tmpData;
};

export default shuffle;
