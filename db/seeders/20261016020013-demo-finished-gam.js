
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const db = queryInterface.sequelize;

    const findUser = async (schoolId) => {
      const [[user]] = await db.query(`
        SELECT user_id
        FROM users
        WHERE school_id = '${schoolId}'
      `);

      return user;
    };

    const host = await findUser('24179712');
    const player1 = await findUser('24179723');
    const player2 = await findUser('24179795');
    const player3 = await findUser('24179111');

    if (!host || !player1 || !player2 || !player3) {
      throw new Error('Run the demo-users seeder before this seeder.');
    }

    await queryInterface.bulkInsert('QuestionSet', [
      {
        questionSetId: 1,
        hostId: host.user_id,
        title: 'Shinobi Basics',
        subject: 'General Knowledge',
      },
    ]);

    await queryInterface.bulkInsert('GameSession', [
      {
        sessionId: 1,
        hostId: host.user_id,
        questionSetId: 1,
        joinCode: '418263',
        status: 'CLOSED',
        timeLimit: 600,
        startTime: new Date('2026-10-10T01:00:00Z'),
        endTime: new Date('2026-10-10T01:10:00Z'),
      },
      {
        sessionId: 2,
        hostId: host.user_id,
        questionSetId: 1,
        joinCode: '527194',
        status: 'WAITING',
        timeLimit: 600,
        startTime: null,
        endTime: null,
      },
    ]);

    await queryInterface.bulkInsert('Player', [
      {
        playerId: 1,
        sessionId: 1,
        user_id: player1.user_id,
        nickname: 'Kushina',
        avatar: 'kushina',
        chakra: 35,
      },
      {
        playerId: 2,
        sessionId: 1,
        user_id: player2.user_id,
        nickname: 'Naruto',
        avatar: 'naruto',
        chakra: 25,
      },
      {
        playerId: 3,
        sessionId: 1,
        user_id: player3.user_id,
        nickname: 'Hinata',
        avatar: 'hinata',
        chakra: 15,
      },
    ]);

    await queryInterface.bulkInsert('Question', [
      {
        questionId: 1,
        questionSetId: 1,
        text: 'What is the main character energy called in this game?',
        type: 'multiple-choice',
        correctIndex: 0,
        timeLimit: 20,
      },
      {
        questionId: 2,
        questionSetId: 1,
        text: 'How long is the game session in minutes?',
        type: 'multiple-choice',
        correctIndex: 0,
        timeLimit: 20,
      },
      {
        questionId: 3,
        questionSetId: 1,
        text: 'How many seconds does a reward round last?',
        type: 'multiple-choice',
        correctIndex: 0,
        timeLimit: 20,
      },
      {
        questionId: 4,
        questionSetId: 1,
        text: 'Which object gives +25 Chakra?',
        type: 'multiple-choice',
        correctIndex: 1,
        timeLimit: 20,
      },
      {
        questionId: 5,
        questionSetId: 1,
        text: 'What is the rank of the first-place player?',
        type: 'multiple-choice',
        correctIndex: 0,
        timeLimit: 20,
      },
    ]);

    const answers = [];
    const answerSets = [
      { playerId: 1, count: 5 },
      { playerId: 2, count: 5 },
      { playerId: 3, count: 5 },
    ];

    for (const item of answerSets) {
      for (let questionId = 1; questionId <= item.count; questionId++) {
        answers.push({
          answerId: answers.length + 1,
          playerId: item.playerId,
          questionId,
          selectedIndex: 0,
          isCorrect: true,
          submittedAt: new Date('2026-10-10T01:01:00Z'),
        });
      }
    }

    await queryInterface.bulkInsert('Answer', answers);

    await queryInterface.bulkInsert('RewardRound', [
      {
        rewardRoundId: 1,
        playerId: 1,
        duration: 5,
        chakraEarned: 25,
      },
      {
        rewardRoundId: 2,
        playerId: 2,
        duration: 5,
        chakraEarned: 15,
      },
      {
        rewardRoundId: 3,
        playerId: 3,
        duration: 5,
        chakraEarned: 10,
      },
    ]);

    await queryInterface.bulkInsert('RewardObject', [
      {
        rewardId: 1,
        rewardRoundId: 1,
        objectType: 'chest',
        chakraChange: 25,
      },
      {
        rewardId: 2,
        rewardRoundId: 2,
        objectType: 'balloon',
        chakraChange: 10,
      },
      {
        rewardId: 3,
        rewardRoundId: 3,
        objectType: 'bomb',
        chakraChange: -10,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RewardObject', {
      rewardRoundId: [1, 2, 3],
    }, {});

    await queryInterface.bulkDelete('RewardRound', {
      rewardRoundId: [1, 2, 3],
    }, {});

    await queryInterface.bulkDelete('Answer', {
      answerId: { [require('sequelize').Op.between]: [1, 15] },
    }, {});

    await queryInterface.bulkDelete('Question', {
      questionId: [1, 2, 3, 4, 5],
    }, {});

    await queryInterface.bulkDelete('Player', {
      playerId: [1, 2, 3],
    }, {});

    await queryInterface.bulkDelete('GameSession', {
      sessionId: [1, 2],
    }, {});

    await queryInterface.bulkDelete('QuestionSet', {
      questionSetId: 1,
    }, {});
  },
};
