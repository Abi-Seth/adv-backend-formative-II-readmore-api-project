const express = require('express');
const authors = require('./routes/authors');
const books = require('./routes/books');
const { handleError } = require('./lib/http');

const app = express();
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'ReadMore API is running.' }));
app.use('/authors', authors);
app.use('/books', books);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(handleError);

module.exports = app;
