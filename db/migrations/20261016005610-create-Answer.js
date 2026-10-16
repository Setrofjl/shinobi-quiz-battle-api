
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const answerColumns = {
      answerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },

      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Player',
          key: 'playerId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Question',
          key: 'questionId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      selectedIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },

      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    };

    await queryInterface.createTable('Answer', answerColumns);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Answer');
  },
};
