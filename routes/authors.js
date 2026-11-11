const router = require('express').Router();
const authors = require('../controllers/authors');
const { validateId } = require('../lib/http');

router.param('id', validateId);
router.post('/', authors.createAuthor);
router.get('/', authors.listAuthors);
router.get('/:id', authors.getAuthor);
router.put('/:id', authors.updateAuthor);
router.delete('/:id', authors.deleteAuthor);
router.get('/:id/books', authors.listAuthorBooks);
router.get('/:id/stats', authors.getAuthorStats);

module.exports = router;
