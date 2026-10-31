'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/session.validator');
const sessionController = require('../controllers/session.controller');
const playerController = require('../controllers/player.controller');

const router = Router();

router.post('/', requireUser('HOST', 'ADMIN'), validator.createRules, validate, sessionController.create);
router.get('/:code', validator.codeParam, validate, sessionController.get);
router.patch('/:code', requireUser('HOST', 'ADMIN'), validator.statusRules, validate, sessionController.changeStatus);
router.post('/:code/players', requireUser(), validator.joinRules, validate, playerController.join);
router.get('/:code/players', validator.codeParam, validate, playerController.list);

module.exports = router;
