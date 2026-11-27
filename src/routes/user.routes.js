'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/auth.validator');
const controller = require('../controllers/user.controller');

const router = Router();

router.use(requireUser('ADMIN'));
router.get('/', controller.list);
router.patch('/:id/role', validator.idParam, validator.roleRules, validate, controller.changeRole);

module.exports = router;
