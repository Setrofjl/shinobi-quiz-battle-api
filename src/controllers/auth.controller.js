'use strict';

const { matchedData } = require('express-validator');
const authService = require('../services/auth.service');
const userJson = require('../serializers/user.serializer');

async function register(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const user = await authService.register(data);
  res.status(201).json({ user: userJson.toJson(user) });
}

async function login(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const result = await authService.login(data);
  res.status(200).json({
    token: result.token,
    token_type: 'Bearer',
    expires_in: result.expires_in,
    user: userJson.toJson(result.user),
  });
}

function me(req, res) {
  res.status(200).json({ user: userJson.toJson(req.account) });
}

module.exports = { register, login, me };
