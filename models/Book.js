const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  genre: { type: String, trim: true },
  price: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'price must be a positive, finite number.',
    },
  },
  publishedYear: {
    type: Number,
    required: true,
    validate: {
      validator: (year) => Number.isInteger(year) && year >= 1450 && year <= new Date().getUTCFullYear(),
      message: () => `publishedYear must be a whole year from 1450 through ${new Date().getUTCFullYear()}.`,
    },
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
});

bookSchema.index({ author: 1, title: 1 }, {
  unique: true,
  collation: { locale: 'en', strength: 2 },
});

module.exports = mongoose.model('Book', bookSchema);
