const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/require-user');

const router = Router();

router.post('/register', registerRules, validate, controller.register);
router.post('/login', loginRules, validate, controller.login);
router.get('/me', requireUser(), controller.me);

module.exports = router;