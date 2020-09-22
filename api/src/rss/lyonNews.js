const { promisify } = require("util");
const config = require("config");
const feed = require("rss-to-json");
const og = require("open-graph-scraper");
const redis = require("redis");

const { cleanHtml } = require('./utils');

const redisClient = redis.createClient({ host: config.get("redis.host") });
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const URL = "https://met.grandlyon.com/feed/";
const REDIS_KEY = "news.lyon";
const REDIS_TTL = 60 * 60 * 12;

const parser = async (flush = false) => {
  let data = await getAsync(REDIS_KEY);
  if (!flush && data) {
    return JSON.parse(data);
  }
  // Get RSS in a JSON format
  const json = await feed.load(URL);

  if (!json || !json.items || json.items.length <= 0) {
    throw new Error("Unable to get Grand Lyon News RSS");
  }

  try {
    data = json.items
      .map(item => {
        const el = {
          source: item.author ? `Grand Lyon, ${item.author}` : "Grand Lyon",
          title: item.title,
          description: cleanHtml(item.description),
          url: item.url,
          image: item.description
            .match(/<img src="([^ ]*?)"/)[1]
            .replace("w=200&h=133", "w=460"),
          date: item.created
        };
        const capture = item.description.match(/<img src="([^ ]*?)"/);

        if (capture && capture[1]) {
          el.image = capture[1].replace("w=200&h=133", "w=460");
        }
        return el;
      })
      .filter(item => item.title && item.image);

    await setAsync(REDIS_KEY, REDIS_TTL, JSON.stringify(data));
  } catch {
    return [];
  }

  return data;
};

module.exports = parser;
