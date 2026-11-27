'use strict';

const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const validator = require('../validators/question-set.validator');
const questionValidator = require('../validators/question.validator');
const controller = require('../controllers/question-set.controller');
const questionController = require('../controllers/question.controller');
const uploadCover = require('../middlewares/upload-cover');

const router = Router();

router.use(requireUser('HOST', 'ADMIN'));
router.get('/', validator.listRules, validate, controller.list);
router.post('/', validator.createRules, validate, controller.create);
router.get('/:id', validator.idParam, validator.includeRules, validate, controller.get);
router.patch('/:id', validator.updateRules, validate, controller.update);
router.delete('/:id', validator.idParam, validate, controller.remove);
router.get('/:id/questions', validator.idParam, questionValidator.listRules, validate, questionController.list);
router.post('/:id/questions', validator.idParam, questionValidator.createRules, validate, questionController.create);
router.patch(
  '/:id/questions/:questionId',
  validator.idParam,
  questionValidator.questionIdParam,
  questionValidator.updateRules,
  validate,
  questionController.update
);
router.delete(
  '/:id/questions/:questionId',
  validator.idParam,
  questionValidator.questionIdParam,
  validate,
  questionController.remove
);
router.put(
  '/:id/cover',
  validator.idParam,
  validate,
  controller.ensureCoverEditable,
  uploadCover,
  controller.uploadCover
);

module.exports = router;
