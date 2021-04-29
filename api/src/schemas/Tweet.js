const mongoose = require('../utils/mongoose');

const tweetSchema = mongoose.Schema({
  type: { type: String, required: true },
  id: { type: String, required: true },
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.Mixed, required: true },
  entities: { type: mongoose.Schema.Types.Mixed, required: false },
  createdAt: { type: String, required: false },
}, { collection: 'tweets' });

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
