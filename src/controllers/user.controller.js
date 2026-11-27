'use strict';

const { matchedData } = require('express-validator');
const userService = require('../services/user.service');
const userJson = require('../serializers/user.serializer');

async function list(req, res) {
  const users = await userService.list();
  res.status(200).json({ users: users.map(userJson.toJson) });
}

async function changeRole(req, res) {
  const data = matchedData(req, { locations: ['params', 'body'] });
  const user = await userService.changeRole(data.id, data.role, req.user);
  res.status(200).json({ user: userJson.toJson(user) });
}

module.exports = { list, changeRole };
