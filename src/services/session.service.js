'use strict';

const { randomInt } = require('crypto');
const { sequelize, GameSession, Player } = require('../models');
const questionSetRepository = require('../repositories/question-set.repository');
const sessionRepository = require('../repositories/session.repository');
const { conflict, forbidden, notFound } = require('../errors/app-error');
const GAME_DURATION_MS = 10 * 60 * 1000;

async function findOrFail(code, options) {
  const session = await sessionRepository.findByCode(code, options);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `No session has the code ${code}.`);
  }
  return session;
}

async function create(data, user) {
  const questionSet = await questionSetRepository.findById(data.questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${data.questionSetId}.`);
  }
  if (questionSet.hostId !== user.user_id && user.role !== 'ADMIN') {
    throw forbidden('You may only start sessions with your own question sets.');
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = String(randomInt(100000, 1000000));
    if (await sessionRepository.findByCode(joinCode)) continue;
    try {
      return await sessionRepository.create({
        hostId: user.user_id,
        questionSetId: data.questionSetId,
        joinCode,
        status: 'WAITING',
        timeLimit: GAME_DURATION_MS / 1000,
        startTime: null,
        endTime: null,
        startedAt: null,
        endsAt: null,
      });
    } catch (error) {
      if (error.parent && error.parent.constraint === 'uq_game_session_join_code') continue;
      throw error;
    }
  }
  throw conflict('SESSION_CODE_UNAVAILABLE', 'A unique session code could not be generated. Try again.');
}

async function get(code) {
  const session = await findOrFail(code);
  if (session.status === 'RUNNING' && session.endsAt && new Date() > session.endsAt) {
    await session.update({ status: 'CLOSED', endTime: session.endsAt });
  }
  return session;
}

async function changeStatus(code, status, user) {
  return sequelize.transaction(async (transaction) => {
    const session = await sessionRepository.findByCode(code, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `No session has the code ${code}.`);
    }
    if (session.hostId !== user.user_id && user.role !== 'ADMIN') {
      throw forbidden('This session belongs to another host.');
    }
    if (session.status === status) return session;

    const allowed =
      (session.status === 'WAITING' && (status === 'RUNNING' || status === 'CLOSED'))
      || (session.status === 'RUNNING' && status === 'CLOSED');
    if (!allowed) {
      throw conflict('INVALID_SESSION_TRANSITION', `A ${session.status} session cannot become ${status}.`);
    }

    const now = new Date();
    const changes = { status };
    if (status === 'RUNNING') {
      const questions = await sessionRepository.findQuestions(session.questionSetId, { transaction });
      if (questions.length === 0) {
        throw conflict('SESSION_HAS_NO_QUESTIONS', 'Add at least one question before starting this game.');
      }
      changes.startedAt = now;
      changes.endsAt = new Date(now.getTime() + GAME_DURATION_MS);
      changes.startTime = now;
      changes.endTime = null;
      await Player.update(
        { currentPosition: 1, round: 1, questionStartedAt: now },
        { where: { sessionId: session.sessionId }, transaction }
      );
    } else {
      changes.endTime = session.endsAt && now > session.endsAt ? session.endsAt : now;
    }
    return session.update(changes, { transaction });
  });
}

module.exports = { create, get, changeStatus, findOrFail, GAME_DURATION_MS };
