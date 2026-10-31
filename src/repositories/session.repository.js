'use strict';

const { GameSession } = require('../models');

function findByCode(code, options = {}) {
  return GameSession.findOne({ where: { joinCode: code }, ...options });
}

function create(data) {
  return GameSession.create(data);
}

function update(session, changes) {
  return session.update(changes);
}

module.exports = { findByCode, create, update };
