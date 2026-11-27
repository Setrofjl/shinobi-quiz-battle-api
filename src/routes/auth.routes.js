'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/auth.validator');
const controller = require('../controllers/auth.controller');

const router = Router();

router.post('/register', validator.register, validate, controller.register);
router.post('/login', validator.login, validate, controller.login);
router.get('/me', requireUser(), controller.me);

module.exports = router;
