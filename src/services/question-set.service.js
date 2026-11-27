'use strict';

const questionSetRepository = require('../repositories/question-set.repository');
const { conflict, forbidden, notFound } = require('../errors/app-error');

async function findOrFail(id, options = {}) {
  const questionSet = await questionSetRepository.findById(id, options);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
  }
  return questionSet;
}

function canManage(questionSet, user) {
  return questionSet.hostId === user.user_id || user.role === 'ADMIN';
}

async function assertEditable(id, user, { transaction, ownerOnly = false } = {}) {
  const options = transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {};
  const questionSet = await findOrFail(id, options);
  const allowed = ownerOnly
    ? questionSet.hostId === user.user_id
    : canManage(questionSet, user);
  if (!allowed) {
    throw forbidden('This question set belongs to another host.');
  }
  if (await questionSetRepository.isInUse(id, transaction ? { transaction } : {})) {
    throw conflict('QUESTION_SET_IN_USE', 'This question set is in use and cannot be changed.');
  }
  return questionSet;
}

async function assertOwner(id, user, options = {}) {
  const questionSet = await findOrFail(id, options);
  if (questionSet.hostId !== user.user_id) {
    throw forbidden('This question set belongs to another host.');
  }
  return questionSet;
}

function list(data, user) {
  return questionSetRepository.findAndCountAll({ ...data, user });
}

async function get(id, includeQuestions, user) {
  if (includeQuestions) {
    const questionSet = await questionSetRepository.findByIdWithQuestions(id);
    if (!questionSet) {
      throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
    }
    if (questionSet.hostId !== user.user_id) {
      throw forbidden('This question set belongs to another host.');
    }
    return questionSet;
  }
  return findOrFail(id);
}

function create(data, user) {
  return questionSetRepository.create({ ...data, hostId: user.user_id });
}

async function update(id, changes, user) {
  const questionSet = await assertEditable(id, user);
  return questionSetRepository.update(questionSet, changes);
}

async function remove(id, user) {
  const questionSet = await assertEditable(id, user);
  await questionSetRepository.remove(questionSet);
}

async function updateCover(id, coverUrl, user) {
  const questionSet = await assertEditable(id, user);
  return questionSetRepository.update(questionSet, { coverUrl });
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  assertEditable,
  assertOwner,
  updateCover,
};
