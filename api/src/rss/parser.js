const { promisify } = require("util");
const config = require("config");
const feed = require("rss-to-json");
const og = require("open-graph-scraper");
const redis = require("redis");
const moment = require("moment");

const { cleanHtml } = require("./utils");

const redisClient = redis.createClient({ host: config.get("redis.host") });
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

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

const parser = async (url, key, ttl, max, flush = false) => {
  let data = await getAsync(key);

  if (!flush && data) {
    return JSON.parse(data);
  }

  const json = await feed.load(url);

  if (!json || !json.items || json.items.length <= 0) {
    throw new Error(`Unable to get ${key} RSS from ${url}`);
  }

  // RSS does not provide some infos like picture url associated to the item.
  // => I get OpenGraph data from the url of each item returned by RSS to get more content.
  data = await Promise.all(
    shuffle(json.items)
      .filter(item => item.url || item.link)
      .slice(0, max)
      .map(item => og({ url: item.url || item.link }).catch(() => undefined))
  );
  // Remove items if item is undefined (Error getting og data)
  data = data
    .filter(item => item && !item.error && item.result)
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
        tag: key,
        source: ogSiteName || twitterSite || twitterCreator,
        title: ogTitle || twitterTitle,
        description: cleanHtml(ogDescription || twitterDescription),
        url: ogUrl || twitterUrl,
        image: ogImage ? ogImage.url : twitterImage ? twitterImage.url : null,
        date: moment(ogDate).isValid()
          ? moment(ogDate).format("x")
          : moment(articlePublishedTime).isValid()
          ? moment(articlePublishedTime).format("x")
          : null
      })
    )
    .filter(item => item.title && item.image && item.description && item.url);

  await setAsync(key, ttl, JSON.stringify(data));

  console.info(`${key} : LOADED`);

  return data;
};

module.exports = parser;
