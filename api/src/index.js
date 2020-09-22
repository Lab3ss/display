const config = require("config");
const express = require("express");
const moment = require("moment");
const redis = require("redis");
const { promisify } = require("util");

const googleNewsRss = require("./rss/googleNews");
const jdgNewsRss = require("./rss/jdgNews");
const lyonNewsRss = require("./rss/lyonNews");

const redisClient = redis.createClient({ host: config.get("redis.host") });
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const app = express();

const REDIS_KEY = "news";
const REDIS_TTL = 60 * 30;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Content-Type", "application/json");
  next();
});

app.get("/news", async (req, res) => {
  const { flush } = req.query;

  let cache = await getAsync(REDIS_KEY);
  if (!flush && cache) {
    return res.send(cache);
  }

  const data = (await Promise.all([
    googleNewsRss(flush),
    jdgNewsRss(flush),
    lyonNewsRss(flush)
  ]))
    .reduce((acc, val) => [...acc, ...val], [])
    .filter((item, _, self) => self.filter(e => e.title === item.title).length === 1)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map(item => ({
      ...item,
      date: moment.unix(item.date / 1000).format("ddd, D MMM")
    }));

  await setAsync(REDIS_KEY, REDIS_TTL, JSON.stringify(data));
  res.send(data);
});

app.listen(process.env.PORT, function() {
  console.log(`API listening on port ${process.env.PORT}!`);
});
