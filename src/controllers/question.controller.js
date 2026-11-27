'use strict';

const { matchedData } = require('express-validator');
const questionService = require('../services/question.service');
const { envelope } = require('../utils/paginate');

function toJson(question) {
  return {
    id: question.questionId,
    position: question.position,
    text: question.text,
    type: question.type,
    correct_index: question.correctIndex,
    time_limit: question.timeLimit,
    choices: (question.choices || []).map((choice) => ({
      id: choice.choiceId,
      position: choice.position,
      text: choice.text,
      is_correct: choice.isCorrect,
    })),
  };
}

async function list(req, res) {
  const { id, ...query } = matchedData(req, { locations: ['params', 'query'] });
  const result = await questionService.list(id, query, req.user);
  res.status(200).json(envelope(
    result.rows.map(toJson),
    result.count,
    query
  ));
}

async function create(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const data = matchedData(req, { locations: ['body'] });
  const question = await questionService.create(id, data, req.user);
  res.status(201).json({ question: toJson(question) });
}

async function update(req, res) {
  const { id, questionId } = matchedData(req, { locations: ['params'] });
  const changes = matchedData(req, { locations: ['body'] });
  const question = await questionService.update(id, questionId, changes, req.user);
  res.status(200).json({ question: toJson(question) });
}

async function remove(req, res) {
  const { id, questionId } = matchedData(req, { locations: ['params'] });
  await questionService.remove(id, questionId, req.user);
  res.status(204).end();
}

module.exports = { list, create, update, remove, toJson };
