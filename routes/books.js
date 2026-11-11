const router = require('express').Router();
const books = require('../controllers/books');
const { validateId } = require('../lib/http');

router.param('id', validateId);
router.post('/', books.createBook);
router.get('/', books.listBooks);
router.get('/:id', books.getBook);
router.put('/:id', books.updateBook);
router.delete('/:id', books.deleteBook);

module.exports = router;
