const express = require("express");

const getNews = require('./routes/news');
const getCount = require('./routes/count');


const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Content-Type", "application/json");
  next();
});

app.get("/test", async (req, res) => {
  console.log('TEST ROUTE');
});

app.get("/news", getNews);

app.get("/count", getCount);

app.listen(process.env.PORT, function() {
  console.log(`API v.1.0.1 listening on port ${process.env.PORT}!`);
});
