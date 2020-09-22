const { promisify } = require("util");
const config = require("config");
const feed = require("rss-to-json");
const og = require("open-graph-scraper");
const redis = require("redis");
const moment = require('moment');

const { cleanHtml } = require('./utils');

const redisClient = redis.createClient({ host: config.get("redis.host") });
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const URL = "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr";
const REDIS_KEY = "news.google";
const REDIS_TTL = 60 * 60 * 2;

const parser = async (flush = false) => {
  let data = await getAsync(REDIS_KEY);
  if (!flush && data) {
    return JSON.parse(data);
  }
  // Get RSS in a JSON format
  const json = await feed.load(URL);

  if (!json || !json.items || json.items.length <= 0) {
    throw new Error("Unable to get Google News RSS");
  }

  // Google News does not provide some infos like picture url associated to the item.
  // => I get OpenGraph data from the url of each item returned by Google RSS.
  data = await Promise.all(
    json.items
      .filter(item => item.url || item.link)
      .map(item => og({ url: item.url || item.link }).catch(() => undefined))
  );
    // Remove items if item is undefined (Error getting og data)
  data = data.filter(item => item && !item.error && item.result)
    // Keep only usefull data
    .map(
      ({
        result: {
          ogSiteName,
          ogTitle,
          ogDescription,
          ogUrl,
          ogImage,
          ogDate,
          twitterTitle,
          twitterDescription,
          twitterUrl,
          twitterImage,
          twitterSite,
          twitterCreator,
          articlePublishedTime
        }
      }) => ({
        source: ogSiteName || twitterSite || twitterCreator,
        title: ogTitle || twitterTitle,
        description: cleanHtml(ogDescription || twitterDescription),
        url: ogUrl || twitterUrl,
        image: ogImage ? ogImage.url : twitterImage ? twitterImage.url : null,
        date: moment(ogDate || articlePublishedTime).format('x')
      })
    )
    .filter(item => item.title && item.image);

  await setAsync(REDIS_KEY, REDIS_TTL, JSON.stringify(data));

  return data;
};

module.exports = parser;
