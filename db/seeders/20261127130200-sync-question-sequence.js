'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      SELECT setval(
        '"Question_questionId_seq"',
        COALESCE(MAX("questionId"), 1),
        COUNT(*) > 0
      )
      FROM "Question";
    `);
  },

  async down() {},
};
