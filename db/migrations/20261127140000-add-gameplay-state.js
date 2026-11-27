'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('GameSession', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('GameSession', 'ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE "GameSession"
      SET started_at = "startTime",
          ends_at = "startTime" + INTERVAL '10 minutes'
      WHERE "startTime" IS NOT NULL;
    `);

    await queryInterface.addColumn('Player', 'display_name', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      'UPDATE "Player" SET "display_name" = "nickname" WHERE "display_name" IS NULL'
    );
    await queryInterface.changeColumn('Player', 'display_name', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
    await queryInterface.addColumn('Player', 'current_position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Player', 'round', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.addColumn('Player', 'question_started_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE "Player" AS player
      SET current_position = 1,
          round = 1,
          question_started_at = session.started_at
      FROM "GameSession" AS session
      WHERE player."sessionId" = session."sessionId"
        AND session.status = 'RUNNING'
        AND session.started_at IS NOT NULL;
      WITH duplicate_avatars AS (
        SELECT "playerId",
               ROW_NUMBER() OVER (PARTITION BY "sessionId", avatar ORDER BY "playerId") AS duplicate_number
        FROM "Player"
      )
      UPDATE "Player" AS player
      SET avatar = 'legacy-player-' || player."playerId"
      FROM duplicate_avatars
      WHERE player."playerId" = duplicate_avatars."playerId"
        AND duplicate_avatars.duplicate_number > 1;
    `);
    await queryInterface.addIndex('Player', ['sessionId', 'avatar'], {
      unique: true,
      name: 'uq_player_session_avatar',
    });

    await queryInterface.addColumn('Answer', 'choiceId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Choice', key: 'choiceId' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('Answer', 'round', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.addIndex('Answer', ['playerId', 'questionId', 'round'], {
      unique: true,
      name: 'uq_answer_player_question_round',
    });
    await queryInterface.sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "Answer_answerId_seq";
      ALTER TABLE "Answer"
        ALTER COLUMN "answerId" SET DEFAULT nextval('"Answer_answerId_seq"');
      ALTER SEQUENCE "Answer_answerId_seq" OWNED BY "Answer"."answerId";
      SELECT setval(
        '"Answer_answerId_seq"',
        GREATEST(COALESCE((SELECT MAX("answerId") FROM "Answer"), 1), 1),
        EXISTS (SELECT 1 FROM "Answer")
      );
    `);

    await queryInterface.createTable('reward_rounds', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Player', key: 'playerId' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      answer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Answer', key: 'answerId' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      objects: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      chakra_delta: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reward_rounds');
    await queryInterface.sequelize.query(`
      ALTER TABLE "Answer" ALTER COLUMN "answerId" DROP DEFAULT;
      DROP SEQUENCE IF EXISTS "Answer_answerId_seq";
    `);
    await queryInterface.removeIndex('Answer', 'uq_answer_player_question_round');
    await queryInterface.removeColumn('Answer', 'round');
    await queryInterface.removeColumn('Answer', 'choiceId');
    await queryInterface.removeIndex('Player', 'uq_player_session_avatar');
    await queryInterface.removeColumn('Player', 'question_started_at');
    await queryInterface.removeColumn('Player', 'round');
    await queryInterface.removeColumn('Player', 'current_position');
    await queryInterface.removeColumn('Player', 'display_name');
    await queryInterface.removeColumn('GameSession', 'ends_at');
    await queryInterface.removeColumn('GameSession', 'started_at');
  },
};
