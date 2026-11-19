const { validationResult } = require('express-validator');
const { badRequest } = require('../errors/app-error');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      badRequest(
        'VALIDATION_ERROR',
        'Request validation failed.'
      )
    );
  }

  return next();
}

module.exports = validate;