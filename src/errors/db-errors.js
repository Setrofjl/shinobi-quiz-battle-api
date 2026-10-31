// Reads the name of the database constraint that an insert, update or delete broke.
// Returns null when the error is not a constraint violation.
const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

function constraintOf(error) {
  const parent = error.parent || error.original;
  const constraint = (parent && parent.constraint) || error.index;
  const postgresConstraintViolation =
    parent && typeof parent.code === 'string' && parent.code.startsWith('23');

  if (
    error instanceof UniqueConstraintError
    || error instanceof ForeignKeyConstraintError
    || postgresConstraintViolation
  ) {
    return constraint || 'unknown';
  }
  return null;
}

module.exports = { constraintOf };
