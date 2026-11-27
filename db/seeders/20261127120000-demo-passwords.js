'use strict';

const password = require('../../src/security/password');

const DEMO_PASSWORD = 'Aklat-Demo-2026';

module.exports = {
  async up(queryInterface) {
    const hash = await password.hash(DEMO_PASSWORD);
    await queryInterface.bulkUpdate(
      'users',
      { password_hash: hash },
      { password_hash: null }
    );
  },

  async down() {},
};
