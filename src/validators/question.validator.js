'use strict';

const { body, param, query } = require('express-validator');
const { pageRules, sortRules } = require('./list.validator');

const questionIdParam = [
  param('questionId')
    .exists().withMessage('questionId is required')
    .bail()
    .isInt({ min: 1, max: 2147483647 }).withMessage('questionId must be a positive integer')
    .bail()
    .toInt(),
];

function validateChoices(choices) {
  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 8) {
    throw new Error('choices must contain 2 to 8 choices');
  }
  if (choices.some((choice) => (
    !choice
    || typeof choice !== 'object'
    || Array.isArray(choice)
    || typeof choice.text !== 'string'
    || choice.text.trim().length < 1
    || choice.text.trim().length > 255
    || typeof choice.isCorrect !== 'boolean'
  ))) {
    throw new Error('each choice needs text and a boolean isCorrect value');
  }
  if (choices.filter((choice) => choice.isCorrect).length !== 1) {
    throw new Error('exactly one choice must be correct');
  }
  return true;
}

const listRules = [
  ...pageRules,
  ...sortRules(['questionId', 'position', 'text', 'type']),
  query('q')
    .optional()
    .isString().withMessage('q must be text')
    .bail()
    .trim()
    .isLength({ max: 100 }).withMessage('q must be at most 100 characters long'),
];

const createRules = [
  body('text')
    .exists().withMessage('text is required')
    .bail()
    .isString().withMessage('text must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('text must be 1 to 2000 characters long'),
  body('type')
    .exists().withMessage('type is required')
    .bail()
    .isString().withMessage('type must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 }).withMessage('type must be 1 to 30 characters long'),
  body('timeLimit')
    .exists().withMessage('timeLimit is required')
    .bail()
    .isInt({ min: 1, max: 600 }).withMessage('timeLimit must be 1 to 600 seconds')
    .bail()
    .toInt(),
  body('choices').custom(validateChoices),
];

const updateRules = [
  body('text')
    .optional()
    .isString().withMessage('text must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('text must be 1 to 2000 characters long'),
  body('type')
    .optional()
    .isString().withMessage('type must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 30 }).withMessage('type must be 1 to 30 characters long'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 600 }).withMessage('timeLimit must be 1 to 600 seconds')
    .bail()
    .toInt(),
  body('choices').optional().custom(validateChoices),
  body()
    .custom((_, { req }) => {
      if (['text', 'type', 'timeLimit', 'choices'].some((key) => req.body[key] !== undefined)) return true;
      throw new Error('at least one question field must be provided');
    }),
];

module.exports = { questionIdParam, listRules, createRules, updateRules, validateChoices };
