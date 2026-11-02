'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define(
  'GameSession',
  {
    sessionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionSetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    joinCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'GameSession',
    timestamps: false,
  },
);
