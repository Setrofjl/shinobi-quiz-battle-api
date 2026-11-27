'use strict';

const { body, checkExact, query } = require('express-validator');
const { codeParam } = require('./session.validator');

const questionParam = [...codeParam];
const answerRules = [
  ...codeParam,
  checkExact([
    body('question_id')
      .exists().withMessage('question_id is required')
      .bail()
      .isInt({ min: 1 }).withMessage('question_id must be a positive integer')
      .bail()
      .toInt(),
    body('choice_id')
      .exists().withMessage('choice_id is required')
      .bail()
      .isInt({ min: 1 }).withMessage('choice_id must be a positive integer')
      .bail()
      .toInt(),
  ], { locations: ['body'] }),
];
const rewardRules = [
  ...codeParam,
  checkExact([
    body('reward_round_id')
      .exists().withMessage('reward_round_id is required')
      .bail()
      .isUUID().withMessage('reward_round_id must be a UUID'),
    body('object_id')
      .exists().withMessage('object_id is required')
      .bail()
      .isUUID().withMessage('object_id must be a UUID'),
  ], { locations: ['body'] }),
];
const leaderboardRules = [
  ...codeParam,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be an integer from 1 to 100')
    .bail()
    .toInt(),
];

module.exports = { questionParam, answerRules, rewardRules, leaderboardRules };
