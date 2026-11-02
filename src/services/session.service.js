'use strict';

const { randomInt } = require('crypto');
const questionSetRepository = require('../repositories/question-set.repository');
const sessionRepository = require('../repositories/session.repository');
const { conflict, forbidden, notFound } = require('../errors/app-error');

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
        timeLimit: data.timeLimit,
        startTime: null,
        endTime: null,
      });
    } catch (error) {
      if (error.parent && error.parent.constraint === 'uq_game_session_join_code') continue;
      throw error;
    }
  }
  throw conflict('SESSION_CODE_UNAVAILABLE', 'A unique session code could not be generated. Try again.');
}

function get(code) {
  return findOrFail(code);
}

async function changeStatus(code, status, user) {
  const session = await findOrFail(code);
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

  const changes = { status };
  if (status === 'RUNNING') changes.startTime = new Date();
  if (status === 'CLOSED') changes.endTime = new Date();
  return sessionRepository.update(session, changes);
}

module.exports = { create, get, changeStatus, findOrFail };
