
const { Sequelize, DataTypes } = require('sequelize');
const env = require('../config/env');
const dbConfig = require('../config/database')[env.nodeEnv];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const GameSession = require('./game-session')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const Player = require('./player')(sequelize, DataTypes);
const QuestionSet = require('./question-set')(sequelize, DataTypes);

module.exports = {
  sequelize,
  Sequelize,
  DataTypes,
  GameSession,
  User,
  Player,
  QuestionSet
};
