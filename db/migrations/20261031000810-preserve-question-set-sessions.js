'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE "GameSession"
          DROP CONSTRAINT IF EXISTS "GameSession_questionSetId_fkey";
        ALTER TABLE "GameSession"
          ADD CONSTRAINT "GameSession_questionSetId_fkey"
          FOREIGN KEY ("questionSetId")
          REFERENCES "QuestionSet" ("questionSetId")
          ON UPDATE CASCADE
          ON DELETE RESTRICT;
      `, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE "GameSession"
          DROP CONSTRAINT IF EXISTS "GameSession_questionSetId_fkey";
        ALTER TABLE "GameSession"
          ADD CONSTRAINT "GameSession_questionSetId_fkey"
          FOREIGN KEY ("questionSetId")
          REFERENCES "QuestionSet" ("questionSetId")
          ON UPDATE CASCADE
          ON DELETE CASCADE;
      `, { transaction });
    });
  },
};
