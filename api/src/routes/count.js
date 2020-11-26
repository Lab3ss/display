const config = require("config");
const Item = require('../schemas/Item');

const count = async (req, res) => {
  const sources = config.get("rss.sources");
  const counts = await Promise.all(sources.map(s => Item.count({ theme: s.name })));
  const response = [];
  for (let i = 0; i < sources.length; i++) {
   response[i] = { name: sources[i].name, total: counts[i] }; 
  }
  res.send(response);
};

module.exports = count;
