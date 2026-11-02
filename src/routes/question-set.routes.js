'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/question-set.validator');
const controller = require('../controllers/question-set.controller');

const router = Router();

router.use(requireUser('HOST', 'ADMIN'));
router.get('/', controller.list);
router.post('/', validator.createRules, validate, controller.create);
router.get('/:id', validator.idParam, validate, controller.get);
router.patch('/:id', validator.updateRules, validate, controller.update);
router.delete('/:id', validator.idParam, validate, controller.remove);

module.exports = router;
