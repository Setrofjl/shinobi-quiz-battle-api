const authService = require('../services/auth.service');
const { matchedData } = require('express-validator');

async function register(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const user = await authService.register(data);

  return res.status(201).json({ user });
}

async function login(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const result = await authService.login(data);

  return res.status(200).json(result);
}

async function me(req, res) {
  const user = authService.toJson(req.account);

  return res.status(200).json({ user });
}

module.exports = {
  register,
  login,
  me,
};