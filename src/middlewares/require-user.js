const { unauthorized, forbidden } = require('../errors/app-error');

function requireUser(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(
        unauthorized(
          'Log in first: send the header Authorization: Bearer <token>.'
        )
      );
    }

    const userRole = String(req.user.role).toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).toUpperCase()
    );

    if (
      normalizedAllowedRoles.length > 0 &&
      !normalizedAllowedRoles.includes(userRole)
    ) {
      return next(forbidden('You are not allowed to do that.'));
    }

    return next();
  };
}

module.exports = requireUser;