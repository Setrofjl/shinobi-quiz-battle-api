'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/session.validator');
const sessionController = require('../controllers/session.controller');
const playerController = require('../controllers/player.controller');
const gameplayController = require('../controllers/gameplay.controller');
const gameplayValidator = require('../validators/gameplay.validator');

const router = Router();

router.post('/', requireUser('HOST', 'ADMIN'), validator.createRules, validate, sessionController.create);
router.get('/:code', validator.codeParam, validate, sessionController.get);
router.patch('/:code', requireUser('HOST', 'ADMIN'), validator.statusRules, validate, sessionController.changeStatus);
router.post('/:code/players', requireUser(), validator.joinRules, validate, playerController.join);
router.get('/:code/players', validator.codeParam, validate, playerController.list);
router.get('/:code/question', requireUser(), gameplayValidator.questionParam, validate, gameplayController.getQuestion);
router.post('/:code/answers', requireUser(), gameplayValidator.answerRules, validate, gameplayController.submitAnswer);
router.post('/:code/rewards', requireUser(), gameplayValidator.rewardRules, validate, gameplayController.claimReward);
router.get('/:code/leaderboard', gameplayValidator.leaderboardRules, validate, gameplayController.getLeaderboard);

module.exports = router;
