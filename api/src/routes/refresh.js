const config = require("config");
const parser = require('../rss/parser');

const refresh = async (req, res) => {
  const { source } = req.query;
  if (!source) {
    res.status(400).send();
  }
  const found = config.get("rss.sources").find(s => s.name === source);
  
  if (!found) {
    res.status(400).send();
  }

  await parser(found);
  res.status(200).send();
};

module.exports = refresh;
