const config = require("config");
const rssParser = require('../rss/parser');
const loadTweets = require('../utils/twitter/loader');

const refresh = async (req, res) => {
  const { source } = req.query;
  if (!source) {
    res.status(400).send();
  }
  if (source === 'twitter') {
        await loadTweets()
  } else {
        const found = config.get("rss.sources").find(s => s.name === source);
        if (!found) {
            res.status(400).send();
        }
        await rssParser(found);
  }
  res.status(200).send();
};

module.exports = refresh;
