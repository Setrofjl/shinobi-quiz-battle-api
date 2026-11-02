function validateListGameSessions(req, res, next) {
  const queryParameters = Object.keys(req.query);
  if (queryParameters.length > 0) {
    return res.status(400).json({
      error: {
        code: 'UNSUPPORTED_QUERY_PARAMETER',
        message: `Query parameters are not supported: ${queryParameters.join(', ')}.`,
      },
    });
  }

  next();
}

module.exports = { validateListGameSessions };
