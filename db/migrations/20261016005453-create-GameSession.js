
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sessionFields = {
      sessionId: {
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

      questionSetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'QuestionSet',
          key: 'questionSetId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      joinCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      timeLimit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    };

    await queryInterface.createTable('GameSession', sessionFields);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GameSession');
  },
};
