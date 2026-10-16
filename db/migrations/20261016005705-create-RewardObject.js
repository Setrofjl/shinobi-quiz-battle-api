
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = {
      rewardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },

      rewardRoundId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RewardRound',
          key: 'rewardRoundId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      objectType: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      chakraChange: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    };

    await queryInterface.createTable('RewardObject', columns);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('RewardObject');
  },
};
