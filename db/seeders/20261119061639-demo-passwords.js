'use strict';

const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'ShinobiDemo2026!';

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await queryInterface.bulkUpdate(
      'users',
      { password_hash: hash },
      { password_hash: null }
    );
  },

  async down() {
    // No rollback: this seeder only fills missing password hashes.
  },
};
