
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const fields = {
      questionSetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },

      hostId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      subject: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    };

    await queryInterface.createTable('QuestionSet', fields);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('QuestionSet');
  },
};