const mongoose = require('../utils/mongoose');

const itemSchema = mongoose.Schema({
  theme: { type: String, required: true },
  source: { type: String, required: false },
  author: { type: String, required: false },
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: String, required: false },
}, { collection: 'news' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
