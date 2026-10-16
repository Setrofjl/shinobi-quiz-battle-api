
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userFields = {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      school_id: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },

      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
      },

      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    };

    await queryInterface.createTable('users', userFields);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
