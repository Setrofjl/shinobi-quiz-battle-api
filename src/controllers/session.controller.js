'use strict';

const { matchedData } = require('express-validator');
const sessionService = require('../services/session.service');

function toJson(session) {
  return {
    code: session.joinCode,
    status: session.status,
    host_id: session.hostId,
    question_set_id: session.questionSetId,
    time_limit: session.timeLimit,
    started_at: session.startTime,
    ended_at: session.endTime,
  };
}

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const session = await sessionService.create(data, req.user);
  res.status(201).json(toJson(session));
}

async function get(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const session = await sessionService.get(code);
  res.status(200).json(toJson(session));
}

async function changeStatus(req, res) {
  const data = matchedData(req, { locations: ['params', 'body'] });
  const session = await sessionService.changeStatus(data.code, data.status, req.user);
  res.status(200).json(toJson(session));
}

module.exports = { create, get, changeStatus, toJson };
