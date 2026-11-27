'use strict';

const { matchedData } = require('express-validator');
const gameplayService = require('../services/gameplay.service');

async function getQuestion(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const question = await gameplayService.getQuestion(code, req.user);
  res.status(200).json(question);
}

async function submitAnswer(req, res) {
  const { code, question_id: questionId, choice_id: choiceId } = matchedData(req, {
    locations: ['params', 'body'],
  });
  const result = await gameplayService.submitAnswer(code, req.user, { questionId, choiceId });
  res.status(200).json(result.correct
    ? { correct: true, reward_round: result.rewardRound }
    : { correct: false });
}

async function claimReward(req, res) {
  const { code, reward_round_id: rewardRoundId, object_id: objectId } = matchedData(req, {
    locations: ['params', 'body'],
  });
  const result = await gameplayService.claimReward(code, req.user, { rewardRoundId, objectId });
  res.status(200).json(result);
}

async function getLeaderboard(req, res) {
  const { code, limit = 10 } = matchedData(req, { locations: ['params', 'query'] });
  const result = await gameplayService.getLeaderboard(code, limit);
  res.status(200).json(result);
}

module.exports = { getQuestion, submitAnswer, claimReward, getLeaderboard };
