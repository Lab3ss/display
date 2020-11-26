const config = require('config');
const cron = require('node-cron');
const parser = require('./rss/parser');

const sources = config.get('rss.sources');

for (const source of sources) {
  cron.schedule(source.cron, () => {
    parser(source)
  });
}
