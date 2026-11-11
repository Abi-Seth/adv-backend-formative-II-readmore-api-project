const mongoose = require('mongoose');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateId(req, res, next, id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return next(new HttpError(400, 'id must be a 24-character hexadecimal MongoDB id.'));
  }
  next();
}

function readFields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) {
    throw new HttpError(400, 'Provide a JSON object with at least one field.');
  }
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) throw new HttpError(400, `Unknown field: ${key}.`);
  }
  return body;
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) {
    return res.status(409).json({ message: 'This author already has a book with that title.' });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const fields = Object.values(error.errors);
    const status = fields.some((field) => ['price', 'publishedYear'].includes(field.path)) ? 422 : 400;
    return res.status(status).json({ message: fields.map((field) => field.message).join(' ') });
  }
  if (error instanceof mongoose.Error.DocumentNotFoundError) {
    return res.status(404).json({ message: 'The requested record no longer exists.' });
  }
  if (error.status >= 400 && error.status < 500) {
    const message = error.type === 'entity.parse.failed' ? 'Request body must be valid JSON.' : error.message;
    return res.status(error.status).json({ message });
  }
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
}

module.exports = { HttpError, validateId, readFields, handleError };
