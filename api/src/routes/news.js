const config = require("config");
const moment = require("moment");
const redis = require("redis");
const { promisify } = require("util");
const Item = require("../schemas/Item");
const Tweet = require("../schemas/Tweet");
const rssParser = require("../rss/parser");

const redisClient = redis.createClient({ host: config.get("redis.host") });

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const REDIS_KEY = "news";
const REDIS_TTL = 60 * 60 * 1; // Global cache : 2h.

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const getPaginatedNews = async (req, res) => {
  const {  } = req.query;
  
  console.log(limit, offset, source);
  return res.send([]);
}

const getNews = async (req, res) => {
  const { flush } = req.query;

  let cache = await getAsync(REDIS_KEY);
  if (!flush && cache) {
    return res.send(JSON.parse(cache));
  }

  const sources = config.get("rss.sources");
  const counts = await Promise.all(
    sources.map(s => Item.count({ theme: s.name }))
  );
  for (let i = 0; i < sources.length; i++) {
    let skip = Math.floor(Math.random() * (counts[i] - sources[i].limit));
    if (skip < 0) {
      skip = 0;
    }
    sources[i].skip = skip;
  }
  const rss = (
    await Promise.all(
      sources.map(source => {
        return Item.find()
          .where({ theme: source.name })
          .skip(source.skip)
          .limit(source.limit);
      })
    )
  )
    .reduce((acc, val) => [...acc, ...val], [])
    .filter(
      (item, _, self) => self.filter(e => e.title === item.title).length === 1
    );

  for (const item of rss) {
    if (item.date) {
      item.date = moment.unix(item.date / 1000).format("ddd, D MMM");
    }
  }
  
  const tweets = await Tweet.find()

  console.info(`=> Cache updated with ${rss.length} RSS items and ${tweets.length} tweets`)
  const cached = shuffle([...rss, ...tweets]);
  await setAsync(REDIS_KEY, REDIS_TTL, JSON.stringify(cached));
  res.send(cached);
};

module.exports = getNews;
