const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');
const { HttpError, readFields } = require('../lib/http');
const withCatalogWrite = require('../lib/catalogWrites');

const bookFields = ['title', 'genre', 'price', 'publishedYear', 'author'];

async function requireExistingAuthor(id) {
  if (!mongoose.isObjectIdOrHexString(id) || !(await Author.exists({ _id: id }))) {
    throw new HttpError(400, 'Provide the id of an existing author.');
  }
}

async function createBook(req, res) {
  const fields = readFields(req.body, bookFields);
  const book = await withCatalogWrite(async () => {
    await requireExistingAuthor(fields.author);
    return Book.create(fields);
  });
  res.status(201).json(book);
}

function bookFilters({ genre, author, search, minPrice, maxPrice }) {
  const filter = {};
  if (genre) filter.genre = genre.trim();
  if (author) {
    if (!mongoose.isObjectIdOrHexString(author)) throw new HttpError(400, 'Invalid author id.');
    filter.author = author;
  }
  if (search) {
    const text = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: text, $options: 'i' };
  }
  if (minPrice || maxPrice) {
    const price = {};
    if (minPrice) price.$gte = Number(minPrice);
    if (maxPrice) price.$lte = Number(maxPrice);
    if (!Object.values(price).every(Number.isFinite)) throw new HttpError(400, 'Price filters must be numbers.');
    if (price.$gte > price.$lte) throw new HttpError(400, 'minPrice cannot exceed maxPrice.');
    filter.price = price;
  }
  return filter;
}

async function listBooks(req, res) {
  const query = req.query;
  const allowed = ['genre', 'author', 'search', 'minPrice', 'maxPrice', 'sort', 'order', 'page', 'limit'];
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.includes(key)) throw new HttpError(400, `Unknown query parameter: ${key}.`);
    if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `Provide one value for ${key}.`);
  }
  const { sort, order = 'asc' } = query;
  if (sort && !['price', 'title', 'publishedYear'].includes(sort)) throw new HttpError(400, 'Invalid sort field.');
  if (!['asc', 'desc'].includes(order)) throw new HttpError(400, 'order must be asc or desc.');

  const filter = bookFilters(query);
  const direction = order === 'desc' ? -1 : 1;
  const sortBy = sort ? { [sort]: direction, _id: 1 } : { _id: direction };
  const books = Book.find(filter).sort(sortBy).populate('author');
  if (!query.page && !query.limit) {
    const results = await books;
    return res.json({ page: 1, limit: results.length, total: results.length, results });
  }

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) {
    throw new HttpError(400, 'page and limit must be positive whole numbers.');
  }
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) throw new HttpError(400, 'Requested page is too large.');
  const results = await books.skip(skip).limit(limit);
  const total = await Book.countDocuments(filter);
  res.json({ page, limit, total, results });
}

async function getBook(req, res) {
  const book = await Book.findById(req.params.id).populate('author');
  if (!book) throw new HttpError(404, 'Book not found.');
  res.json(book);
}

async function updateBook(req, res) {
  const updated = await withCatalogWrite(async () => {
    const book = await Book.findById(req.params.id);
    if (!book) throw new HttpError(404, 'Book not found.');
    const fields = readFields(req.body, bookFields);
    if (Object.hasOwn(fields, 'author')) await requireExistingAuthor(fields.author);
    book.set(fields);
    return book.save();
  });
  res.json(updated);
}

async function deleteBook(req, res) {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) throw new HttpError(404, 'Book not found.');
  res.sendStatus(204);
}

module.exports = { createBook, listBooks, getBook, updateBook, deleteBook };
