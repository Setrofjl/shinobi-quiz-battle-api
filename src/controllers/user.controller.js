const userRepository = require('../repositories/user.repository');
const authService = require('../services/auth.service');
const { notFound, conflict } = require('../errors/app-error');

async function index(req, res) {
  const users = await userRepository.findAll();

  return res.status(200).json({
    users: users.map((user) => authService.toJson(user)),
  });
}

async function updateRole(req, res) {
  const userId = Number(req.params.id);
  const { role } = req.body;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw notFound('USER_NOT_FOUND', 'User not found.');
  }

  if (user.user_id === req.user.user_id) {
    throw conflict('CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role.');
  }

  await userRepository.update(user, { role });

  return res.status(200).json({
    user: authService.toJson(user),
  });
}

module.exports = { index, updateRole };