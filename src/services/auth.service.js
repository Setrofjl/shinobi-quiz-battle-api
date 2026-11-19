const userRepository = require('../repositories/user.repository');
const password = require('../security/password');
const token = require('../security/token');
const { unauthorized, conflict } = require('../errors/app-error');

function toJson(user) {
  return {
    user_id: user.user_id,
    school_id: user.school_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

async function register(data) {
  const existingSchoolId = await userRepository.findBySchoolId(data.school_id);

  if (existingSchoolId) {
    throw conflict('SCHOOL_ID_EXISTS', 'This school ID is already registered.');
  }

  const existingEmail = await userRepository.findByEmail(data.email);

  if (existingEmail) {
    throw conflict('EMAIL_EXISTS', 'This email is already registered.');
  }

  const hash = await password.hash(data.password);

  const user = await userRepository.create({
    school_id: data.school_id,
    full_name: data.full_name,
    email: data.email,
    password_hash: hash,
    role: 'PLAYER',
  });

  return toJson(user);
}

async function login(data) {
  const user = await userRepository.findForLogin(data.school_id);

  const valid = await password.matches(
    data.password,
    user ? user.password_hash : null
  );

  if (!valid) {
    throw unauthorized('Invalid school ID or password.', 'INVALID_CREDENTIALS');
  }

  return {
    token: token.issue(user),
    token_type: 'Bearer',
    expires_in: 3600,
    user: toJson(user),
  };
}

module.exports = { register, login, toJson };
