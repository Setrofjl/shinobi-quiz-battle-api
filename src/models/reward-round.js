'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define(
  'RewardRound',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'player_id',
    },
    answerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'answer_id',
    },
    objects: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'started_at',
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'claimed_at',
    },
    chakraDelta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'chakra_delta',
    },
  },
  {
    tableName: 'reward_rounds',
    timestamps: false,
  },
);
