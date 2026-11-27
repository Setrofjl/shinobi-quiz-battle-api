'use strict';

const { body, param } = require('express-validator');

const codeParam = [
  param('code')
    .exists().withMessage('join code is required')
    .bail()
    .matches(/^[1-9]\d{5}$/).withMessage('join code must be six digits and cannot start with zero'),
];

const createRules = [
  body('questionSetId')
    .exists().withMessage('questionSetId is required')
    .bail()
    .isInt({ min: 1, max: 2147483647 }).withMessage('questionSetId must be a positive integer')
    .bail()
    .toInt(),
  body('timeLimit')
    .exists().withMessage('timeLimit is required')
    .bail()
    .isInt({ min: 1, max: 2147483647 }).withMessage('timeLimit must be a positive integer')
    .bail()
    .toInt(),
];

const statusRules = [
  ...codeParam,
  body('status')
    .exists().withMessage('status is required')
    .bail()
    .isString().withMessage('status must be text')
    .bail()
    .isIn(['RUNNING', 'CLOSED']).withMessage('status must be RUNNING or CLOSED'),
];

const joinRules = [
  ...codeParam,
  body('display_name')
    .optional()
    .isString().withMessage('nickname must be text')
    .bail()
    .trim()
    .isLength({ min: 2, max: 24 }).withMessage('display_name must be 2 to 24 characters long'),
  body('nickname')
    .optional()
    .isString().withMessage('nickname must be text')
    .bail()
    .trim()
    .isLength({ min: 2, max: 24 }).withMessage('nickname must be 2 to 24 characters long'),
  body('avatar')
    .optional()
    .isString().withMessage('avatar must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('avatar must be 1 to 100 characters long'),
  body().custom((_, { req }) => {
    if (!req.body.display_name && !req.body.nickname) {
      throw new Error('display_name is required');
    }
    if (req.body.display_name && !req.body.avatar) {
      throw new Error('avatar is required with display_name');
    }
    return true;
  }),
];

module.exports = { codeParam, createRules, statusRules, joinRules };
