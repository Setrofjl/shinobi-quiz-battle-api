'use strict';

const { Op } = require('sequelize');
const { QuestionSet, GameSession, Question, Choice } = require('../models');
const { toOffset } = require('../utils/paginate');

function findAndCountAll({ user, page, limit, sort, order, q }) {
  const where = {};
  if (user.role !== 'ADMIN') where.hostId = user.user_id;
  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { subject: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return QuestionSet.findAndCountAll({
    where,
    order: [[sort || 'questionSetId', (order || 'asc').toUpperCase()]],
    ...toOffset({ page, limit }),
  });
}

function findAll() {
  return QuestionSet.findAll({ order: [['questionSetId', 'ASC']] });
}

function findAllByHost(hostId) {
  return QuestionSet.findAll({
    where: { hostId },
    order: [['questionSetId', 'ASC']],
  });
}

function findById(id, options = {}) {
  return QuestionSet.findByPk(id, options);
}

function findByIdWithQuestions(id) {
  return QuestionSet.findByPk(id, {
    include: [{
      model: Question,
      as: 'questions',
      include: [{ model: Choice, as: 'choices' }],
    }],
    order: [
      [{ model: Question, as: 'questions' }, 'position', 'ASC'],
      [{ model: Question, as: 'questions' }, { model: Choice, as: 'choices' }, 'position', 'ASC'],
    ],
  });
}

function isInUse(questionSetId, options = {}) {
  return GameSession.count({ where: { questionSetId }, ...options }).then((count) => count > 0);
}

function create(data) {
  return QuestionSet.create(data);
}

function update(questionSet, changes) {
  return questionSet.update(changes);
}

function remove(questionSet) {
  return questionSet.destroy();
}

module.exports = {
  findAndCountAll,
  findAll,
  findAllByHost,
  findById,
  findByIdWithQuestions,
  isInUse,
  create,
  update,
  remove,
};
