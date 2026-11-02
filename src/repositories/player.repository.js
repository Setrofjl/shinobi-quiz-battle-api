'use strict';

const { Op } = require('sequelize');
const { sequelize, GameSession, Player, User } = require('../models');

function withJoinLocks(userId, code, callback) {
  return sequelize.transaction(async (transaction) => {
    await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const session = await GameSession.findOne({
      where: { joinCode: code },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    return callback(session, transaction);
  });
}

function findSeat(sessionId, userId, transaction) {
  return Player.findOne({
    where: { sessionId, user_id: userId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

function findRunningSeatElsewhere(userId, sessionId, transaction) {
  return Player.findOne({
    where: {
      user_id: userId,
      sessionId: { [Op.ne]: sessionId },
    },
    include: [{
      model: GameSession,
      as: 'session',
      where: { status: 'RUNNING' },
      attributes: [],
    }],
    transaction,
  });
}

function countBySession(sessionId, transaction) {
  return Player.count({ where: { sessionId }, transaction });
}

function create(data, transaction) {
  return Player.create(data, { transaction });
}

function findAllBySession(sessionId) {
  return Player.findAll({
    where: { sessionId },
    order: [['playerId', 'ASC']],
  });
}

module.exports = {
  withJoinLocks,
  findSeat,
  findRunningSeatElsewhere,
  countBySession,
  create,
  findAllBySession,
};
