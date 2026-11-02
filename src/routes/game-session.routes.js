const { Router } = require('express');
const controller = require('../controllers/game-session.controller');
const validator = require('../validators/game-session.validator');

const router = Router();

router.get('/', validator.validateListGameSessions, controller.listGameSessions);

module.exports = router;
