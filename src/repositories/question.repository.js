'use strict';

const { Op } = require('sequelize');
const { Question, Choice } = require('../models');
const { toOffset } = require('../utils/paginate');

const questionInclude = [{ model: Choice, as: 'choices' }];

function findAndCountAll({ questionSetId, page, limit, sort, order, q }) {
  const where = { questionSetId };
  if (q) where.text = { [Op.iLike]: `%${q}%` };

  return Question.findAndCountAll({
    where,
    include: questionInclude,
    distinct: true,
    col: 'questionId',
    order: [
      [sort || 'position', (order || 'asc').toUpperCase()],
      ['questionId', 'ASC'],
      [{ model: Choice, as: 'choices' }, 'position', 'ASC'],
    ],
    ...toOffset({ page, limit }),
  });
}

function findByIdInSet(questionId, questionSetId, options = {}) {
  return Question.findOne({
    where: { questionId, questionSetId },
    include: questionInclude,
    order: [[{ model: Choice, as: 'choices' }, 'position', 'ASC']],
    ...options,
  });
}

function maxPosition(questionSetId, options = {}) {
  return Question.max('position', { where: { questionSetId }, ...options });
}

function create(data, options = {}) {
  return Question.create(data, options);
}

function createChoices(choices, options = {}) {
  return Choice.bulkCreate(choices, options);
}

function deleteChoices(questionId, options = {}) {
  return Choice.destroy({ where: { questionId }, ...options });
}

function update(question, changes, options = {}) {
  return question.update(changes, options);
}

function remove(question, options = {}) {
  return question.destroy(options);
}

module.exports = {
  findAndCountAll,
  findByIdInSet,
  maxPosition,
  create,
  createChoices,
  deleteChoices,
  update,
  remove,
};
