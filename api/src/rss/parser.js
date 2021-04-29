const { promisify } = require("util");
const config = require("config");
const feed = require("rss-to-json");
const og = require("open-graph-scraper");
const redis = require("redis");
const moment = require("moment");

const { cleanHtml } = require("./utils");
const Item = require('../schemas/Item');

const redisClient = redis.createClient({ host: config.get("redis.host") });
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const parser = async ({ name, url }) =>{
  const json = await feed.load(url);

  if (!json || !json.items || json.items.length <= 0) {
    throw new Error(`Unable to get ${name} RSS from ${url}`);
  }

  // RSS does not provide some infos like picture url associated to the item.
  // => I get OpenGraph data from the url of each item returned by RSS to get more content.
  data = await Promise.all(
      json.items
      .filter(item => item.url || item.link)
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
          ogType,
          ogTitle,
          ogDescription,
          ogUrl,
          ogImage,
          ogDate,
          author,
          requestUrl,
          twitterTitle,
          twitterDescription,
          twitterUrl,
          twitterImage,
          twitterSite,
          twitterCreator,
          articlePublishedTime
        }
      }) => ({
        theme: name,
        type: 'RSS',
        source: ogSiteName || twitterSite || twitterCreator,
        author: author,
        title: ogTitle || twitterTitle,
        description: cleanHtml(ogDescription || twitterDescription),
        url: ogUrl || requestUrl || twitterUrl,
        image: ogImage ? ogImage.url : twitterImage ? twitterImage.url : null,
        date: moment(ogDate).isValid()
          ? moment(ogDate).format("x")
          : moment(articlePublishedTime).isValid()
          ? moment(articlePublishedTime).format("x")
          : null
      })
    );
    data = data.filter(item => item.title && item.image && item.description && item.url);

  console.info(`RSS ${name} : ${data.length} items added`);
  await Item.deleteMany({ theme: name });
  await Item.insertMany(data);

  return data;
};

module.exports = parser;
