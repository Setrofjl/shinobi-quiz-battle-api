const gameSessionRepository = require('../repositories/game-session.repository');

async function listGameSessions() {
  return gameSessionRepository.findAll();
}

module.exports = { listGameSessions };
