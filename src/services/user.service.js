'use strict';

const userRepository = require('../repositories/user.repository');
const { conflict, notFound } = require('../errors/app-error');

function list() {
  return userRepository.findAll();
}

async function changeRole(id, role, currentUser) {
  if (Number(id) === currentUser.user_id) {
    throw conflict('CANNOT_CHANGE_OWN_ROLE', 'An admin cannot change their own role.');
  }

  const user = await userRepository.findById(id);
  if (!user) throw notFound('USER_NOT_FOUND', `No user has the id ${id}.`);
  return userRepository.update(user, { role });
}

module.exports = { list, changeRole };
