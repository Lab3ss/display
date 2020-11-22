const config = require("config");
const moment = require("moment");
const redis = require("redis");
const { promisify } = require("util");
const rssParser = require('../rss/parser');

const redisClient = redis.createClient({ host: config.get("redis.host") });

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const google = config.get('rss.google');
const geek = config.get('rss.geek');
const sport = config.get('rss.sport');
const sante = config.get('rss.sante');
const environnement = config.get('rss.environnement');
const espace = config.get('rss.espace');
const maths = config.get('rss.maths');
const matiere = config.get('rss.matiere');
const nature = config.get('rss.nature');
const terre = config.get('rss.terre');
const maison = config.get('rss.maison');

const REDIS_KEY = "news";
const REDIS_TTL = 60 * 30; // Global cache : 30 min.

const getNews = async (req, res) => {
  const { flush } = req.query;

  let cache = await getAsync(REDIS_KEY);
  if (!flush && cache) {
    res.send(cache);
  }

  const data = (
    await Promise.all([
      rssParser(google.url, google.key, google.ttl, 50, flush),
      rssParser(geek.url, geek.key, geek.ttl, 20, flush),
      rssParser(sport.url, sport.key, sport.ttl, 20, flush),
      rssParser(sante.url, sante.key, sante.ttl, 8, flush),
      rssParser(environnement.url, environnement.key, environnement.ttl, 8, flush),
      rssParser(espace.url, espace.key, espace.ttl, 5, flush),
      rssParser(maths.url, maths.key, maths.ttl, 3, flush),
      rssParser(matiere.url, matiere.key, matiere.ttl, 3, flush),
      rssParser(nature.url, nature.key, nature.ttl, 5, flush),
      rssParser(terre.url, terre.key, terre.ttl, 5, flush),
      rssParser(maison.url, maison.key, maison.ttl, 5, flush),
    ])
  )
    .reduce((acc, val) => [...acc, ...val], [])
    .filter(
      (item, _, self) => self.filter(e => e.title === item.title).length === 1
    )
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map(item => ({
      ...item,
      date: moment.unix(item.date / 1000).format("ddd, D MMM")
    }));

  await setAsync(REDIS_KEY, REDIS_TTL, JSON.stringify(data));
  res.send(data);
};

module.exports = getNews;
