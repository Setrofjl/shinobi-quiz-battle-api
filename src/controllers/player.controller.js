'use strict';

const { matchedData } = require('express-validator');
const playerService = require('../services/player.service');
const sessionController = require('./session.controller');

function toJson(player) {
  return {
    player_id: player.playerId,
    nickname: player.nickname,
    display_name: player.displayName || player.nickname,
    avatar: player.avatar,
    score: player.chakra,
  };
}

async function join(req, res) {
  const data = matchedData(req, { locations: ['params', 'body'] });
  const result = await playerService.join(data.code, {
    nickname: data.display_name || data.nickname,
    avatar: data.avatar,
  }, req.user);
  res.status(result.created ? 201 : 200).json({
    ...toJson(result.player),
    rejoined: !result.created,
    session: sessionController.toJson(result.session),
  });
}

async function list(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const players = await playerService.list(code);
  res.status(200).json(players.map(toJson));
}

module.exports = { join, list, toJson };
