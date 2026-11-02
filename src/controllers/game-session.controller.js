// Translates between HTTP and the service. No SQL, no business rules.
const gameSessionService = require('../services/game-session.service');

async function listGameSessions(req, res) {
  const gameSessions = await gameSessionService.listGameSessions();
  res.status(200).json(gameSessions);
}

module.exports = { listGameSessions };
