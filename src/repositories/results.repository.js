
'use strict';

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

async function findFinishedGamePlayers(since) {
  const sql = `
    SELECT
      game."joinCode" AS session_code,
      game."startTime" AS started_at,
      game."endTime" AS ended_at,
      account.school_id,
      player.nickname,
      player.chakra AS score,
      (
        COUNT(DISTINCT answer."questionId") = (
          SELECT COUNT(*)
          FROM "Question" question
          WHERE question."questionSetId" = game."questionSetId"
        )
      ) AS completed
    FROM "GameSession" game
    JOIN "Player" player
      ON player."sessionId" = game."sessionId"
    JOIN users account
      ON account.user_id = player.user_id
    LEFT JOIN "Answer" answer
      ON answer."playerId" = player."playerId"
    WHERE game."status" = 'CLOSED'
      AND game."endTime" IS NOT NULL
      AND (
        CAST(:since AS TIMESTAMP) IS NULL
        OR game."endTime" > CAST(:since AS TIMESTAMP)
      )
    GROUP BY
      game."sessionId",
      game."joinCode",
      game."startTime",
      game."endTime",
      game."questionSetId",
      account.school_id,
      player."playerId",
      player.nickname,
      player.chakra
    ORDER BY
      game."endTime" DESC,
      player.chakra DESC;
  `;

  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: {
      since: since ? since.toISOString() : null,
    },
  });
}

module.exports = { findFinishedGamePlayers };