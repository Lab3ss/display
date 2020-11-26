const config = require("config");
const parser = require("../rss/parser");

const refreshAll = async (req, res) => {
  const sources = config.get("rss.sources");

  await Promise.all(sources.map(s => parser(s)))

  res.status(200).send();
};

module.exports = refreshAll;
