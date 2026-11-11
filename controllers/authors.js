const Author = require('../models/Author');
const Book = require('../models/Book');
const { HttpError, readFields } = require('../lib/http');
const withCatalogWrite = require('../lib/catalogWrites');

const authorFields = ['name', 'country', 'bio'];

async function findAuthor(id) {
  const author = await Author.findById(id);
  if (!author) throw new HttpError(404, 'Author not found.');
  return author;
}

async function createAuthor(req, res) {
  const author = await Author.create(readFields(req.body, authorFields));
  res.status(201).json(author);
}

async function listAuthors(req, res) {
  res.json(await Author.find().sort({ _id: 1 }));
}

async function getAuthor(req, res) {
  res.json(await findAuthor(req.params.id));
}

async function updateAuthor(req, res) {
  const author = await findAuthor(req.params.id);
  author.set(readFields(req.body, authorFields));
  res.json(await author.save());
}

async function deleteAuthor(req, res) {
  await withCatalogWrite(async () => {
    const author = await findAuthor(req.params.id);
    if (await Book.exists({ author: author._id })) {
      throw new HttpError(409, 'Move or delete this author’s books before deleting the author.');
    }
    await author.deleteOne();
  });
  res.sendStatus(204);
}

async function listAuthorBooks(req, res) {
  const author = await findAuthor(req.params.id);
  res.json(await Book.find({ author: author._id }).sort({ _id: 1 }).populate('author'));
}

async function getAuthorStats(req, res) {
  const author = await findAuthor(req.params.id);
  const [stats] = await Book.aggregate([
    { $match: { author: author._id } },
    { $sort: { price: 1, _id: 1 } },
    { $group: {
      _id: null,
      bookCount: { $sum: 1 },
      averagePrice: { $avg: '$price' },
      cheapestBook: { $first: '$title' },
      mostExpensiveBook: { $last: '$title' },
    } },
    { $project: { _id: 0 } },
  ]);
  res.json({
    author: author.name,
    ...(stats || { bookCount: 0, averagePrice: null, cheapestBook: null, mostExpensiveBook: null }),
  });
}

module.exports = { createAuthor, listAuthors, getAuthor, updateAuthor, deleteAuthor, listAuthorBooks, getAuthorStats };
