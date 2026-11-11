require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const Book = require('./models/Book');

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env before starting the API.');
  const port = Number(process.env.PORT || 3000);
  await mongoose.connect(process.env.MONGODB_URI);
  await Book.init();
  const server = app.listen(port, () => console.log(`ReadMore API listening on port ${port}`));
  server.on('error', fail);
}

async function fail(error) {
  console.error('Unable to start ReadMore:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
}

start().catch(fail);
