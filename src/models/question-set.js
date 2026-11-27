'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define(
  'QuestionSet',
  {
    questionSetId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    coverUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'cover_url',
    },
  },
  {
    tableName: 'QuestionSet',
    timestamps: false,
  },
);