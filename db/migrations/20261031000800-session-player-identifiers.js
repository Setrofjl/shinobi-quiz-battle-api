'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS "GameSession_sessionId_seq";
        ALTER TABLE "GameSession"
          ALTER COLUMN "sessionId"
          SET DEFAULT nextval('"GameSession_sessionId_seq"');
        ALTER SEQUENCE "GameSession_sessionId_seq"
          OWNED BY "GameSession"."sessionId";
        SELECT setval(
          '"GameSession_sessionId_seq"',
          GREATEST(COALESCE((SELECT MAX("sessionId") FROM "GameSession"), 1), 1),
          EXISTS (SELECT 1 FROM "GameSession")
        );

        CREATE SEQUENCE IF NOT EXISTS "Player_playerId_seq";
        ALTER TABLE "Player"
          ALTER COLUMN "playerId"
          SET DEFAULT nextval('"Player_playerId_seq"');
        ALTER SEQUENCE "Player_playerId_seq"
          OWNED BY "Player"."playerId";
        SELECT setval(
          '"Player_playerId_seq"',
          GREATEST(COALESCE((SELECT MAX("playerId") FROM "Player"), 1), 1),
          EXISTS (SELECT 1 FROM "Player")
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "uq_game_session_join_code"
          ON "GameSession" ("joinCode");
      `, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "uq_game_session_join_code";
        ALTER TABLE "GameSession" ALTER COLUMN "sessionId" DROP DEFAULT;
        ALTER TABLE "Player" ALTER COLUMN "playerId" DROP DEFAULT;
        DROP SEQUENCE IF EXISTS "GameSession_sessionId_seq";
        DROP SEQUENCE IF EXISTS "Player_playerId_seq";
      `, { transaction });
    });
  },
};
