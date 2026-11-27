'use strict';

jest.mock('../../src/security/password', () => ({
  hash: jest.fn(),
  matches: jest.fn(),
}));
jest.mock('../../src/security/token', () => ({
  issue: jest.fn(),
  verify: jest.fn(),
}));
jest.mock('../../src/repositories/user.repository', () => ({
  create: jest.fn(),
  findForLogin: jest.fn(),
}));

const password = require('../../src/security/password');
const token = require('../../src/security/token');
const userRepository = require('../../src/repositories/user.repository');
const authService = require('../../src/services/auth.service');

beforeEach(() => jest.clearAllMocks());

test('unknown school ID and wrong password produce the same login error', async () => {
  userRepository.findForLogin
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ password_hash: 'stored-hash' });
  password.matches.mockResolvedValue(false);

  const errors = [];
  for (const schoolId of ['missing-id', 'known-id']) {
    try {
      await authService.login({ school_id: schoolId, password: 'wrong-password' });
    } catch (error) {
      errors.push(error);
    }
  }

  expect(errors).toHaveLength(2);
  expect(errors.map(({ status, code, message }) => ({ status, code, message }))).toEqual([
    { status: 401, code: 'INVALID_CREDENTIALS', message: 'The school ID or password is incorrect.' },
    { status: 401, code: 'INVALID_CREDENTIALS', message: 'The school ID or password is incorrect.' },
  ]);
  expect(password.matches).toHaveBeenNthCalledWith(1, 'wrong-password', null);
  expect(password.matches).toHaveBeenNthCalledWith(2, 'wrong-password', 'stored-hash');
  expect(token.issue).not.toHaveBeenCalled();
});
