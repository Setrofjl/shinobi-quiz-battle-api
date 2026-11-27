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

const schoolId = () => body('school_id')
  .exists().withMessage('school_id is required')
  .bail()
  .isString().withMessage('school_id must be text')
  .bail()
  .trim();

const register = [
  schoolId()
    .matches(/^\d{4}-\d{4}$/).withMessage('school_id must match ####-####'),
  body('full_name')
    .exists().withMessage('full_name is required')
    .bail()
    .isString().withMessage('full_name must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('full_name must be 1 to 100 characters long'),
  body('email')
    .exists().withMessage('email is required')
    .bail()
    .isString().withMessage('email must be text')
    .bail()
    .trim()
    .isEmail().withMessage('email must be valid')
    .bail()
    .isLength({ max: 100 }).withMessage('email must be at most 100 characters long'),
  body('password')
    .exists().withMessage('password is required')
    .bail()
    .isString().withMessage('password must be text')
    .bail()
    .isLength({ min: 8, max: 72 }).withMessage('password must be 8 to 72 characters long')
    .bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('password must be at most 72 bytes long')
    .bail()
    .matches(/[A-Za-z]/).withMessage('password must contain at least one letter')
    .bail()
    .matches(/[0-9]/).withMessage('password must contain at least one number'),
];

const login = [
  body('school_id')
    .exists().withMessage('school_id is required')
    .bail()
    .isString().withMessage('school_id must be text'),
  body('password')
    .exists().withMessage('password is required')
    .bail()
    .isString().withMessage('password must be text'),
];

const roleRules = [
  body('role')
    .exists().withMessage('role is required')
    .bail()
    .isString().withMessage('role must be text')
    .bail()
    .isIn(['PLAYER', 'HOST', 'ADMIN']).withMessage('role must be PLAYER, HOST or ADMIN'),
];

module.exports = { idParam, register, login, roleRules };
