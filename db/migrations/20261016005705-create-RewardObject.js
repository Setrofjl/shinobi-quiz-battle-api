'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('RewardObject', {
      rewardId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      rewardRoundId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RewardRound',
          key: 'rewardRoundId',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      objectType: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      chakraChange: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('RewardObject');
  }
};