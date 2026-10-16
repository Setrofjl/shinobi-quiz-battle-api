
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const questionFields = {
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
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

      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      type: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      correctIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      timeLimit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    };

    await queryInterface.createTable('Question', questionFields);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Question');
  },
};
