
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const playerFields = {
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },

      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'GameSession',
          key: 'sessionId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      nickname: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      avatar: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      chakra: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    };

    await queryInterface.createTable('Player', playerFields);

    const uniqueConstraints = [
      {
        fields: ['sessionId', 'nickname'],
        type: 'unique',
        name: 'uq_player_session_nickname',
      },
      {
        fields: ['sessionId', 'user_id'],
        type: 'unique',
        name: 'uq_player_session_user',
      },
    ];

    for (const constraint of uniqueConstraints) {
      await queryInterface.addConstraint('Player', constraint);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Player');
  },
};
