'use strict';

const { QueryTypes } = require('sequelize');
const { sequelize, GameSession, Question } = require('../models');

function findByCode(code, options = {}) {
  return GameSession.findOne({ where: { joinCode: code }, ...options });
}

function create(data) {
  return GameSession.create(data);
}

function update(session, changes) {
  return session.update(changes);
}

function findQuestions(questionSetId, options = {}) {
  return Question.findAll({
    where: { questionSetId },
    attributes: ['questionId', 'position'],
    order: [['position', 'ASC'], ['questionId', 'ASC']],
    ...options,
  });
}

function closeExpiredSessions(now) {
  return sequelize.query(`
    UPDATE "GameSession"
    SET status = 'CLOSED', "endTime" = "ends_at"
    WHERE status = 'RUNNING' AND "ends_at" IS NOT NULL AND "ends_at" < :now
  `, { replacements: { now }, type: QueryTypes.BULK });
}

module.exports = { findByCode, create, update, findQuestions, closeExpiredSessions };
