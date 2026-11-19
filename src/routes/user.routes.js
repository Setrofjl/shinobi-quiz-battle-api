const { Router } = require('express');
const controller = require('../controllers/user.controller');
const requireUser = require('../middlewares/require-user');
const { roleRules } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');

const router = Router();

router.use(requireUser('ADMIN'));

router.get('/', controller.index);
router.patch('/:id/role', roleRules, validate, controller.updateRole);

module.exports = router;