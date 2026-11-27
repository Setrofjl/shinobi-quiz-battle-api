'use strict';

const password = require('../security/password');
const token = require('../security/token');
const userRepository = require('../repositories/user.repository');
const { unauthorized } = require('../errors/app-error');

async function register(data) {
  const passwordHash = await password.hash(data.password);
  return userRepository.create({
    school_id: data.school_id,
    full_name: data.full_name,
    email: data.email,
    role: 'PLAYER',
    password_hash: passwordHash,
  });
}

async function login(data) {
  const user = await userRepository.findForLogin(data.school_id);
  const ok = await password.matches(data.password, user ? user.password_hash : null);
  if (!ok) {
    throw unauthorized('The school ID or password is incorrect.', 'INVALID_CREDENTIALS');
  }

  const account = { ...user.get({ plain: true }), role: user.role.toUpperCase() };
  const jwt = token.issue(account);
  const payload = token.verify(jwt);
  return { token: jwt, expires_in: payload.exp - payload.iat, user: account };
}

module.exports = { register, login };
