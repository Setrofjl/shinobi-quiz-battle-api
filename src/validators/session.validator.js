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
  body('nickname')
    .exists().withMessage('nickname is required')
    .bail()
    .isString().withMessage('nickname must be text')
    .bail()
    .trim()
    .isLength({ min: 2, max: 24 }).withMessage('nickname must be 2 to 24 characters long'),
];

module.exports = { codeParam, createRules, statusRules, joinRules };
