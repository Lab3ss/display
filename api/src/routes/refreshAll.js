const config = require("config");
const parser = require("../rss/parser");
const loadTweets = require('../utils/twitter/loader');

const refreshAll = async (req, res) => {
  const sources = config.get("rss.sources");

 // await Promise.all(sources.map(s => parser(s)))
 for (let i = 0; i < sources.length; i++){
    console.log('REFRESH : ', sources[i].name);
    await parser(sources[i]);
    console.log('OK.');
 }
 await loadTweets()

  res.status(200).send();
};

module.exports = refreshAll;
