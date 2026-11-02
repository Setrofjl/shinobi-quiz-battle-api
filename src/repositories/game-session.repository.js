'use strict';

const { GameSession } = require('../models');

async function findAll() {
  return GameSession.findAll({
    order: [['sessionId', 'ASC']],
    raw: true,
  });
}

module.exports = { findAll };
