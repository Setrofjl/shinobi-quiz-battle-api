
'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define(
  'Player',
  {
    playerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'display_name',
    },
    avatar: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    chakra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currentPosition: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'current_position',
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    questionStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'question_started_at',
    },
  },
  {
    tableName: 'Player',
    timestamps: false,
  },
);
