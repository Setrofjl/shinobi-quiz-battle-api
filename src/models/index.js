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

User.hasMany(QuestionSet, { foreignKey: 'hostId', as: 'questionSets' });
QuestionSet.belongsTo(User, { foreignKey: 'hostId', as: 'host' });
User.hasMany(GameSession, { foreignKey: 'hostId', as: 'hostedSessions' });
GameSession.belongsTo(User, { foreignKey: 'hostId', as: 'host' });
QuestionSet.hasMany(GameSession, { foreignKey: 'questionSetId', as: 'sessions' });
GameSession.belongsTo(QuestionSet, { foreignKey: 'questionSetId', as: 'questionSet' });
GameSession.hasMany(Player, { foreignKey: 'sessionId', as: 'players' });
Player.belongsTo(GameSession, { foreignKey: 'sessionId', as: 'session' });
User.hasMany(Player, { foreignKey: 'user_id', as: 'playerSeats' });
Player.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  DataTypes,
  GameSession,
  User,
  Player,
  QuestionSet,
};
