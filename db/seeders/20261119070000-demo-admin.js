'use strict';

const bcrypt = require('bcryptjs');

const ADMIN = {
  school_id: 'ADMIN-TEST-001',
  full_name: 'Shinobi Test Admin',
  email: 'admin@example.test',
  role: 'ADMIN',
};

const DEMO_PASSWORD = 'ShinobiDemo2026!';

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      'SELECT user_id FROM users WHERE school_id = :school_id OR email = :email',
      {
        replacements: {
          school_id: ADMIN.school_id,
          email: ADMIN.email,
        },
        type: require('sequelize').QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      return;
    }

    const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await queryInterface.bulkInsert('users', [
      {
        ...ADMIN,
        password_hash,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      school_id: ADMIN.school_id,
    });
  },
};