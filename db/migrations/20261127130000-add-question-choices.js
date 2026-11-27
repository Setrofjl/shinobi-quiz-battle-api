'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Question', 'position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "Question_questionId_seq";
      ALTER TABLE "Question"
        ALTER COLUMN "questionId" SET DEFAULT nextval('"Question_questionId_seq"');
      ALTER SEQUENCE "Question_questionId_seq"
        OWNED BY "Question"."questionId";
      SELECT setval(
        '"Question_questionId_seq"',
        COALESCE(MAX("questionId"), 1),
        COUNT(*) > 0
      )
      FROM "Question";
    `);

    await queryInterface.createTable('Choice', {
      choiceId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Question',
          key: 'questionId',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      text: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('Choice', {
      fields: ['questionId', 'position'],
      type: 'unique',
      name: 'uq_choice_question_position',
    });

    await queryInterface.addIndex('Choice', ['questionId'], {
      unique: true,
      where: { isCorrect: true },
      name: 'uq_choice_one_correct',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Choice');
    await queryInterface.removeColumn('Question', 'position');
    await queryInterface.sequelize.query(`
      ALTER TABLE "Question" ALTER COLUMN "questionId" DROP DEFAULT;
      DROP SEQUENCE IF EXISTS "Question_questionId_seq";
    `);
  },
};
