'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS "QuestionSet_questionSetId_seq";
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "QuestionSet"
        ALTER COLUMN "questionSetId"
        SET DEFAULT nextval('"QuestionSet_questionSetId_seq"');
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER SEQUENCE "QuestionSet_questionSetId_seq"
        OWNED BY "QuestionSet"."questionSetId";
      `, { transaction });

      await queryInterface.sequelize.query(`
        SELECT setval(
          '"QuestionSet_questionSetId_seq"',
          GREATEST(COALESCE((SELECT MAX("questionSetId") FROM "QuestionSet"), 1), 1),
          true
        );
      `, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE "QuestionSet"
        ALTER COLUMN "questionSetId"
        DROP DEFAULT;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP SEQUENCE "QuestionSet_questionSetId_seq";
      `, { transaction });
    });
  },
};