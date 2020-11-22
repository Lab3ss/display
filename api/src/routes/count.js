const config = require("config");
const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient({ host: config.get("redis.host") });

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const count = async (req, res) => {
  const google = await getAsync(config.get("rss.google.key"));
  const geek = await getAsync(config.get("rss.geek.key"));
  const sport = await getAsync(config.get("rss.sport.key"));
  const sante = await getAsync(config.get("rss.sante.key"));
  const environnement = await getAsync(config.get("rss.environnement.key"));
  const espace = await getAsync(config.get("rss.espace.key"));
  const maths = await getAsync(config.get("rss.maths.key"));
  const matiere = await getAsync(config.get("rss.matiere.key"));
  const nature = await getAsync(config.get("rss.nature.key"));
  const terre = await getAsync(config.get("rss.terre.key"));
  const maison = await getAsync(config.get("rss.maison.key"));
  res.send({
    google: JSON.parse(google).length,
    geek: JSON.parse(geek).length,
    sport: JSON.parse(sport).length,
    sante: JSON.parse(sante).length,
    environnement: JSON.parse(environnement).length,
    espace: JSON.parse(espace).length,
    maths: JSON.parse(maths).length,
    matiere: JSON.parse(matiere).length,
    nature: JSON.parse(nature).length,
    maison: JSON.parse(maison).length,
    terre: JSON.parse(terre).length,
  });
};

module.exports = count;
