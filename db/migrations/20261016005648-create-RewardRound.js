
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const attributes = {
      rewardRoundId: {
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

      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      chakraEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    };

    await queryInterface.createTable('RewardRound', attributes);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('RewardRound');
  },
};