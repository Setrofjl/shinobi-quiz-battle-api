'use strict';

const { body, param } = require('express-validator');

const idParam = [
  param('id')
    .exists().withMessage('id is required')
    .bail()
    .isInt({ min: 1, max: 2147483647 }).withMessage('id must be a positive integer')
    .bail()
    .toInt(),
];

const createRules = [
  body('title')
    .exists().withMessage('title is required')
    .bail()
    .isString().withMessage('title must be text')
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('title must be 3 to 100 characters long'),
  body('subject')
    .exists().withMessage('subject is required by the existing database schema')
    .bail()
    .isString().withMessage('subject must be text')
    .bail()
    .trim()
    .isLength({ max: 60 }).withMessage('subject must be at most 60 characters long'),
];

const updateRules = [
  ...idParam,
  body('title')
    .if((_, { req }) => req.body?.title === undefined && req.body?.subject === undefined)
    .exists().withMessage('at least one of title or subject is required'),
  body('title')
    .optional()
    .isString().withMessage('title must be text')
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('title must be 3 to 100 characters long'),
  body('subject')
    .optional()
    .isString().withMessage('subject must be text')
    .bail()
    .trim()
    .isLength({ max: 60 }).withMessage('subject must be at most 60 characters long'),
];

module.exports = { idParam, createRules, updateRules };
