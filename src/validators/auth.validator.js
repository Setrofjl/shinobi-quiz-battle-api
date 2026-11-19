const { body } = require('express-validator');

const registerRules = [
  body('school_id')
    .trim()
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('school_id must contain only letters, numbers, and hyphens'),

  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('full_name is required')
    .isLength({ max: 100 })
    .withMessage('full_name must not exceed 100 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('email must be valid'),

  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('password must be 8 to 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('password must contain a letter')
    .matches(/[0-9]/)
    .withMessage('password must contain a number'),
];

const loginRules = [
  body('school_id').isString().trim().notEmpty(),
  body('password').isString().notEmpty(),
];

const roleRules = [
  body('role')
    .isIn(['PLAYER', 'HOST', 'ADMIN'])
    .withMessage('role must be PLAYER, HOST, or ADMIN'),
];

module.exports = { registerRules, loginRules, roleRules };
