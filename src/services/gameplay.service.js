'use strict';

const { randomInt, randomUUID } = require('crypto');
const {
  sequelize,
  GameSession,
  Player,
  Question,
  Choice,
  Answer,
  RewardRound,
} = require('../models');
const sessionService = require('./session.service');
const { badRequest, conflict, forbidden, notFound } = require('../errors/app-error');
const { envelope } = require('../utils/paginate');

const OBJECT_TYPES = ['balloon', 'chest', 'bomb'];
const OBJECT_DELTAS = { balloon: 10, chest: 25, bomb: -10 };
const REWARD_DURATION_MS = 5000;

function chakraFor(objectType, elapsedMs) {
  if (elapsedMs > REWARD_DURATION_MS) return 0;
  return OBJECT_DELTAS[objectType] || 0;
}

function createObjects() {
  return [...OBJECT_TYPES]
    .map((type) => ({ id: randomUUID(), type, order: randomInt(0, 1000000) }))
    .sort((a, b) => a.order - b.order)
    .map(({ id, type }) => ({ id, type }));
}

function ensureRunning(session, now = new Date()) {
  if (!session) throw notFound('SESSION_NOT_FOUND', 'This game session no longer exists.');
  if (session.status !== 'RUNNING') {
    throw conflict('SESSION_NOT_RUNNING', 'This game is not running.');
  }
  if (session.endsAt && now > session.endsAt) {
    return false;
  }
  return true;
}

async function closeExpired(session) {
  if (session.status === 'RUNNING' && session.endsAt && new Date() > session.endsAt) {
    await session.update({ status: 'CLOSED', endTime: session.endsAt });
    return true;
  }
  return false;
}

async function findActiveSession(code) {
  const session = await sessionService.findOrFail(code);
  if (!ensureRunning(session)) {
    await closeExpired(session);
    throw conflict('SESSION_ENDED', 'The 10-minute game timer has ended.');
  }
  return session;
}

function questionQuery(questionSetId, options = {}) {
  return Question.findAll({
    where: { questionSetId },
    include: [{ model: Choice, as: 'choices', attributes: ['choiceId', 'position', 'text', 'isCorrect'] }],
    order: [['position', 'ASC'], ['questionId', 'ASC'], [{ model: Choice, as: 'choices' }, 'position', 'ASC']],
    ...options,
  });
}

function serializeQuestion(question, round) {
  return {
    id: question.questionId,
    text: question.text,
    type: question.type,
    round,
    choices: question.choices.map((choice) => ({
      id: choice.choiceId,
      position: choice.position,
      text: choice.text,
    })),
  };
}

async function getQuestion(code, user) {
  const session = await findActiveSession(code);
  const player = await Player.findOne({
    where: { sessionId: session.sessionId, user_id: user.user_id },
  });
  if (!player) throw forbidden('Join this game before requesting a question.');
  const questions = await questionQuery(session.questionSetId);
  const question = questions[(player.currentPosition || 0) - 1];
  if (!question) throw conflict('NO_CURRENT_QUESTION', 'This player has no current question.');
  return serializeQuestion(question, player.round);
}

function isUniqueAnswerError(error) {
  return error.parent && error.parent.constraint === 'uq_answer_player_question_round';
}

async function submitAnswer(code, user, { questionId, choiceId }) {
  const session = await findActiveSession(code);
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const lockedSession = await GameSession.findByPk(session.sessionId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!ensureRunning(lockedSession)) {
        await lockedSession.update({ status: 'CLOSED', endTime: lockedSession.endsAt }, { transaction });
        return { ended: true };
      }

      const player = await Player.findOne({
        where: { sessionId: lockedSession.sessionId, user_id: user.user_id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!player) throw forbidden('Join this game before submitting an answer.');

      const questions = await questionQuery(lockedSession.questionSetId, { transaction });
      const question = questions[(player.currentPosition || 0) - 1];
      if (!question || question.questionId !== questionId) {
        throw conflict('NOT_CURRENT_QUESTION', 'Answer the question currently assigned to you.');
      }

      const choice = question.choices.find((item) => item.choiceId === choiceId);
      if (!choice) {
        throw badRequest('INVALID_CHOICE', 'choice_id must belong to question_id.');
      }

      const existing = await Answer.findOne({
        where: { playerId: player.playerId, questionId, round: player.round },
        transaction,
      });
      if (existing) {
        throw conflict('ANSWER_ALREADY_SUBMITTED', 'You have already answered this question in this round.');
      }

      const now = new Date();
      const answer = await Answer.create({
        playerId: player.playerId,
        questionId,
        choiceId,
        selectedIndex: choice.position,
        isCorrect: choice.isCorrect,
        round: player.round,
        submittedAt: now,
      }, { transaction });

      let rewardRound;
      if (choice.isCorrect) {
        rewardRound = await RewardRound.create({
          id: randomUUID(),
          playerId: player.playerId,
          answerId: answer.answerId,
          objects: createObjects(),
          startedAt: now,
        }, { transaction });
      }

      const wrapped = player.currentPosition >= questions.length;
      await player.update({
        currentPosition: wrapped ? 1 : player.currentPosition + 1,
        round: wrapped ? player.round + 1 : player.round,
        questionStartedAt: now,
      }, { transaction });

      return {
        correct: choice.isCorrect,
        rewardRound: rewardRound && {
          id: rewardRound.id,
          objects: rewardRound.objects,
          expires_in: 5,
        },
      };
    });

    if (result.ended) {
      throw conflict('SESSION_ENDED', 'The 10-minute game timer has ended.');
    }
    return result;
  } catch (error) {
    if (isUniqueAnswerError(error)) {
      throw conflict('ANSWER_ALREADY_SUBMITTED', 'You have already answered this question in this round.');
    }
    throw error;
  }
}

async function claimReward(code, user, { rewardRoundId, objectId }) {
  const rewardRound = await RewardRound.findByPk(rewardRoundId);
  if (!rewardRound) throw forbidden('This reward round does not belong to you.');
  const owner = await Player.findByPk(rewardRound.playerId);
  if (!owner || owner.user_id !== user.user_id) {
    throw forbidden('This reward round does not belong to you.');
  }
  const session = await sessionService.findOrFail(code);
  if (owner.sessionId !== session.sessionId) {
    throw forbidden('This reward round does not belong to this game.');
  }
  if (!ensureRunning(session)) {
    await closeExpired(session);
    throw conflict('SESSION_ENDED', 'The 10-minute game timer has ended.');
  }

  const result = await sequelize.transaction(async (transaction) => {
    const lockedSession = await GameSession.findByPk(session.sessionId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!ensureRunning(lockedSession)) {
      await lockedSession.update({ status: 'CLOSED', endTime: lockedSession.endsAt }, { transaction });
      return { ended: true };
    }

    const round = await RewardRound.findByPk(rewardRoundId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!round || round.playerId !== owner.playerId) {
      throw forbidden('This reward round does not belong to you.');
    }
    const player = await Player.findByPk(owner.playerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!player || player.user_id !== user.user_id) {
      throw forbidden('This reward round does not belong to you.');
    }
    if (round.claimedAt) {
      throw conflict('REWARD_ALREADY_CLAIMED', 'This reward round has already been claimed.');
    }
    const object = round.objects.find((item) => item.id === objectId);
    if (!object) throw badRequest('INVALID_REWARD_OBJECT', 'object_id must belong to this reward round.');

    const elapsedMs = new Date().getTime() - new Date(round.startedAt).getTime();
    const requestedDelta = chakraFor(object.type, elapsedMs);
    const chakraDelta = Math.max(0, player.chakra + requestedDelta) - player.chakra;
    if (chakraDelta !== 0) {
      await player.increment('chakra', { by: chakraDelta, transaction });
    }
    await round.update({ claimedAt: new Date(), chakraDelta }, { transaction });
    return { chakraDelta };
  });
  if (result.ended) {
    throw conflict('SESSION_ENDED', 'The 10-minute game timer has ended.');
  }
  return { chakra_delta: result.chakraDelta };
}

function ninjaRank(rank) {
  if (rank === 1) return 'Kage';
  if (rank === 2) return 'Jonin';
  if (rank === 3) return 'Chunin';
  return 'Genin';
}

function rankPlayers(players) {
  let rank = 0;
  let previousChakra;
  return [...players]
    .sort((a, b) => b.chakra - a.chakra || a.playerId - b.playerId)
    .map((player, index) => {
      if (index === 0 || player.chakra !== previousChakra) rank = index + 1;
      previousChakra = player.chakra;
      return {
        rank,
        ninja_rank: ninjaRank(rank),
        display_name: player.displayName,
        avatar: player.avatar,
        chakra: player.chakra,
      };
    });
}

async function getLeaderboard(code, limit) {
  const session = await sessionService.findOrFail(code);
  await closeExpired(session);
  const players = await Player.findAll({
    where: { sessionId: session.sessionId },
    order: [['chakra', 'DESC'], ['playerId', 'ASC']],
  });
  const rows = rankPlayers(players);
  return envelope(rows.slice(0, limit), rows.length, { page: 1, limit });
}

module.exports = {
  chakraFor,
  rankPlayers,
  getQuestion,
  submitAnswer,
  claimReward,
  getLeaderboard,
};
