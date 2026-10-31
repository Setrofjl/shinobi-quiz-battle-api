
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const users = [
      {
        school_id: '24179712',
        full_name: 'Minato Namikaze',
        email: 'minato@example.test',
        role: 'host',
      },
      {
        school_id: '24179723',
        full_name: 'Kushina Uzumaki',
        email: 'kushina@example.test',
        role: 'player',
      },
      {
        school_id: '24179795',
        full_name: 'Naruto Uzumaki',
        email: 'naruto@example.test',
        role: 'player',
      },
      {
        school_id: '24179111',
        full_name: 'Hinata Hyuga',
        email: 'hinata@example.test',
        role: 'player',
      },
      {
        school_id: '24179713',
        full_name: 'Tsunade Senju',
        email: 'tsunade@example.test',
        role: 'host',
      },
      {
        school_id: '24179001',
        full_name: 'Kakashi Hatake',
        email: 'kakashi@example.test',
        role: 'admin',
      },
    ];

    await queryInterface.bulkInsert('users', users);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'users',
      {
        school_id: [
          '24179712',
          '24179723',
          '24179795',
          '24179111',
          '24179713',
          '24179001',
        ],
      },
      {}
    );
  },
};