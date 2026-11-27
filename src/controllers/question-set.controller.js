'use strict';

const fs = require('fs');
const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');
const { envelope } = require('../utils/paginate');
const questionController = require('./question.controller');

function toJson(questionSet) {
  const json = {
    id: questionSet.questionSetId,
    title: questionSet.title,
    subject: questionSet.subject,
    host_id: questionSet.hostId,
    cover_url: questionSet.coverUrl || null,
  };
  if (questionSet.questions) {
    json.questions = questionSet.questions.map(questionController.toJson);
  }
  return json;
}

async function list(req, res) {
  const query = matchedData(req, { locations: ['query'] });
  const { rows, count } = await questionSetService.list(query, req.user);
  res.status(200).json(envelope(rows.map(toJson), count, query));
}

async function get(req, res) {
  const { id, include } = matchedData(req, { locations: ['params', 'query'] });
  const questionSet = await questionSetService.get(id, include === 'questions', req.user);
  res.status(200).json(toJson(questionSet));
}

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.create(data, req.user);
  res.status(201).json(toJson(questionSet));
}

async function update(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const changes = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.update(id, changes, req.user);
  res.status(200).json(toJson(questionSet));
}

async function remove(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  await questionSetService.remove(id, req.user);
  res.status(204).end();
}

async function ensureCoverEditable(req, res, next) {
  const { id } = matchedData(req, { locations: ['params'] });
  await questionSetService.assertEditable(id, req.user);
  return next();
}

async function uploadCover(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  let questionSet;
  try {
    questionSet = await questionSetService.updateCover(
      id,
      `/uploads/covers/${req.file.filename}`,
      req.user
    );
  } catch (error) {
    await fs.promises.unlink(req.file.path);
    throw error;
  }
  res.status(200).json(toJson(questionSet));
}

module.exports = { list, get, create, update, remove, toJson, ensureCoverEditable, uploadCover };
