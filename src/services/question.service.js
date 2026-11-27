'use strict';

const { sequelize } = require('../models');
const questionRepository = require('../repositories/question.repository');
const questionSetService = require('./question-set.service');
const { notFound } = require('../errors/app-error');

function choiceRows(questionId, choices) {
  return choices.map((choice, position) => ({
    questionId,
    position,
    text: choice.text.trim(),
    isCorrect: choice.isCorrect,
  }));
}

function correctIndex(choices) {
  return choices.findIndex((choice) => choice.isCorrect);
}

async function list(questionSetId, query, user) {
  await questionSetService.assertOwner(questionSetId, user);
  return questionRepository.findAndCountAll({ ...query, questionSetId });
}

async function create(questionSetId, data, user) {
  return sequelize.transaction(async (t) => {
    await questionSetService.assertEditable(questionSetId, user, {
      transaction: t,
      ownerOnly: true,
    });
    const lastPosition = await questionRepository.maxPosition(questionSetId, { transaction: t });
    const question = await questionRepository.create({
      questionSetId,
      position: lastPosition === null ? 0 : lastPosition + 1,
      text: data.text.trim(),
      type: data.type,
      correctIndex: correctIndex(data.choices),
      timeLimit: data.timeLimit,
    }, { transaction: t });
    await questionRepository.createChoices(
      choiceRows(question.questionId, data.choices),
      { transaction: t }
    );
    return questionRepository.findByIdInSet(question.questionId, questionSetId, {
      transaction: t,
    });
  });
}

async function update(questionSetId, questionId, changes, user) {
  return sequelize.transaction(async (t) => {
    await questionSetService.assertEditable(questionSetId, user, {
      transaction: t,
      ownerOnly: true,
    });
    const question = await questionRepository.findByIdInSet(questionId, questionSetId, {
      transaction: t,
    });
    if (!question) throw notFound('QUESTION_NOT_FOUND', `No question has the id ${questionId}.`);

    const updateData = { ...changes };
    if (updateData.choices) {
      updateData.correctIndex = correctIndex(updateData.choices);
      await questionRepository.deleteChoices(questionId, { transaction: t });
      await questionRepository.createChoices(
        choiceRows(questionId, updateData.choices),
        { transaction: t }
      );
      delete updateData.choices;
    }

    await questionRepository.update(question, updateData, { transaction: t });
    return questionRepository.findByIdInSet(questionId, questionSetId, {
      transaction: t,
    });
  });
}

async function remove(questionSetId, questionId, user) {
  return sequelize.transaction(async (t) => {
    await questionSetService.assertEditable(questionSetId, user, {
      transaction: t,
      ownerOnly: true,
    });
    const question = await questionRepository.findByIdInSet(questionId, questionSetId, {
      transaction: t,
    });
    if (!question) throw notFound('QUESTION_NOT_FOUND', `No question has the id ${questionId}.`);
    await questionRepository.remove(question, { transaction: t });
  });
}

module.exports = { list, create, update, remove };
