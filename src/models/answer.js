'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define(
  'Answer',
  {
    answerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    choiceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    selectedIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'Answer',
    timestamps: false,
  },
);
