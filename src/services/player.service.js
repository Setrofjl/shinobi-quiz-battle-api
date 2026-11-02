'use strict';

const playerRepository = require('../repositories/player.repository');
const sessionRepository = require('../repositories/session.repository');
const { conflict, notFound } = require('../errors/app-error');
const gameInfo = require('../config/game-info');

async function join(code, { nickname }, user) {
  return playerRepository.withJoinLocks(user.user_id, code, async (session, transaction) => {
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `No session has the code ${code}.`);
    }

    const seat = await playerRepository.findSeat(session.sessionId, user.user_id, transaction);
    if (seat) return { session, player: seat, created: false };

    const runningSeat = await playerRepository.findRunningSeatElsewhere(
      user.user_id,
      session.sessionId,
      transaction
    );
    if (runningSeat) {
      throw conflict('ALREADY_IN_GAME', 'You are still playing another game. Finish it first.');
    }

    if (session.status === 'CLOSED') {
      throw conflict('SESSION_ENDED', 'This game has ended.');
    }
    if (session.status !== 'WAITING') {
      throw conflict('SESSION_NOT_JOINABLE', 'This game has already started.');
    }

    const seatsTaken = await playerRepository.countBySession(session.sessionId, transaction);
    if (seatsTaken >= gameInfo.max_players) {
      throw conflict('SESSION_FULL', 'This game is full.');
    }

    const player = await playerRepository.create({
      sessionId: session.sessionId,
      user_id: user.user_id,
      nickname,
      avatar: 'default',
      chakra: 0,
    }, transaction);
    return { session, player, created: true };
  });
}

async function list(code) {
  const session = await requireSession(code);
  return playerRepository.findAllBySession(session.sessionId);
}

async function requireSession(code) {
  const session = await sessionRepository.findByCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `No session has the code ${code}.`);
  }
  return session;
}

module.exports = { join, list };
