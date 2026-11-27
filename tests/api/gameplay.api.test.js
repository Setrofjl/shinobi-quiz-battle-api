'use strict';

const { app, request, bearer } = require('../setup/helpers');
const { sequelize, GameSession } = require('../../src/models');

afterAll(() => sequelize.close());

test('players answer their own questions, claim rewards and repeat after wrapping', async () => {
  const host = await bearer('24179712');
  const playerToken = await bearer('24179723');
  const otherPlayerToken = await bearer('24179795');
  const created = await request(app)
    .post('/api/v1/sessions')
    .set('Authorization', host)
    .send({ questionSetId: 1, timeLimit: 600 });
  expect(created.status).toBe(201);
  const code = created.body.code;

  const joined = await request(app)
    .post(`/api/v1/sessions/${code}/players`)
    .set('Authorization', playerToken)
    .send({ display_name: 'Gameplay One', avatar: 'gameplay-avatar-one' });
  expect(joined.status).toBe(201);

  const duplicateAvatar = await request(app)
    .post(`/api/v1/sessions/${code}/players`)
    .set('Authorization', otherPlayerToken)
    .send({ display_name: 'Gameplay Two', avatar: 'gameplay-avatar-one' });
  expect(duplicateAvatar.status).toBe(409);

  const secondSeat = await request(app)
    .post(`/api/v1/sessions/${code}/players`)
    .set('Authorization', otherPlayerToken)
    .send({ display_name: 'Gameplay Two', avatar: 'gameplay-avatar-two' });
  expect(secondSeat.status).toBe(201);

  expect((await request(app).patch(`/api/v1/sessions/${code}`)
    .set('Authorization', host).send({ status: 'RUNNING' })).status).toBe(200);

  const firstQuestion = await request(app)
    .get(`/api/v1/sessions/${code}/question`)
    .set('Authorization', playerToken);
  expect(firstQuestion.status).toBe(200);
  expect(firstQuestion.body.id).toBe(1);
  expect(JSON.stringify(firstQuestion.body)).not.toMatch(/is_correct|iscorrect/i);
  const wrongChoice = firstQuestion.body.choices.find((choice) => choice.position !== 0);

  const skipped = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: 5, choice_id: firstQuestion.body.choices[0].id });
  expect(skipped.status).toBe(409);

  const invalidChoice = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: firstQuestion.body.id, choice_id: 2147483647 });
  expect(invalidChoice.status).toBe(400);

  const wrong = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: firstQuestion.body.id, choice_id: wrongChoice.id });
  expect(wrong.status).toBe(200);
  expect(wrong.body).toEqual({ correct: false });

  const duplicate = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: firstQuestion.body.id, choice_id: firstQuestion.body.choices[0].id });
  expect(duplicate.status).toBe(409);

  let question = await request(app)
    .get(`/api/v1/sessions/${code}/question`)
    .set('Authorization', playerToken);
  expect(question.body.id).toBe(2);
  let answer = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: question.body.id, choice_id: question.body.choices[0].id });
  expect(answer.body.correct).toBe(true);
  const bomb = answer.body.reward_round.objects.find((object) => object.type === 'bomb');
  const wrongOwnerClaim = await request(app)
    .post(`/api/v1/sessions/${code}/rewards`)
    .set('Authorization', otherPlayerToken)
    .send({ reward_round_id: answer.body.reward_round.id, object_id: bomb.id });
  expect(wrongOwnerClaim.status).toBe(403);
  const unknownObjectClaim = await request(app)
    .post(`/api/v1/sessions/${code}/rewards`)
    .set('Authorization', playerToken)
    .send({
      reward_round_id: answer.body.reward_round.id,
      object_id: '00000000-0000-4000-8000-000000000099',
    });
  expect(unknownObjectClaim.status).toBe(400);
  const bombClaim = await request(app)
    .post(`/api/v1/sessions/${code}/rewards`)
    .set('Authorization', playerToken)
    .send({ reward_round_id: answer.body.reward_round.id, object_id: bomb.id });
  expect(bombClaim.status).toBe(200);
  expect(bombClaim.body.chakra_delta).toBe(0);
  const duplicateRewardClaim = await request(app)
    .post(`/api/v1/sessions/${code}/rewards`)
    .set('Authorization', playerToken)
    .send({ reward_round_id: answer.body.reward_round.id, object_id: bomb.id });
  expect(duplicateRewardClaim.status).toBe(409);

  question = await request(app)
    .get(`/api/v1/sessions/${code}/question`)
    .set('Authorization', playerToken);
  answer = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: question.body.id, choice_id: question.body.choices[0].id });
  const chest = answer.body.reward_round.objects.find((object) => object.type === 'chest');
  const chestClaim = await request(app)
    .post(`/api/v1/sessions/${code}/rewards`)
    .set('Authorization', playerToken)
    .send({ reward_round_id: answer.body.reward_round.id, object_id: chest.id });
  expect(chestClaim.body.chakra_delta).toBe(25);

  const parallelRewards = [];
  for (const [questionNumber, correctPosition] of [[4, 1], [5, 0]]) {
    question = await request(app)
      .get(`/api/v1/sessions/${code}/question`)
      .set('Authorization', playerToken);
    expect(question.body.id).toBe(questionNumber);
    answer = await request(app)
      .post(`/api/v1/sessions/${code}/answers`)
      .set('Authorization', playerToken)
      .send({ question_id: question.body.id, choice_id: question.body.choices[correctPosition].id });
    expect(answer.status).toBe(200);
    parallelRewards.push({
      rewardRoundId: answer.body.reward_round.id,
      objectId: answer.body.reward_round.objects.find((object) => (
        object.type === (questionNumber === 4 ? 'chest' : 'balloon')
      )).id,
    });
  }

  const simultaneousClaims = await Promise.all(parallelRewards.map(({ rewardRoundId, objectId }) => (
    request(app)
      .post(`/api/v1/sessions/${code}/rewards`)
      .set('Authorization', playerToken)
      .send({ reward_round_id: rewardRoundId, object_id: objectId })
  )));
  expect(simultaneousClaims.map((response) => response.body.chakra_delta)).toEqual([25, 10]);

  question = await request(app)
    .get(`/api/v1/sessions/${code}/question`)
    .set('Authorization', playerToken);
  expect(question.body).toMatchObject({ id: 1, round: 2 });
  answer = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: question.body.id, choice_id: question.body.choices[0].id });
  expect(answer.status).toBe(200);

  const session = await GameSession.findOne({ where: { joinCode: code } });
  await session.update({ endsAt: new Date(Date.now() - 1) });
  const endedAnswer = await request(app)
    .post(`/api/v1/sessions/${code}/answers`)
    .set('Authorization', playerToken)
    .send({ question_id: 2, choice_id: 1 });
  expect(endedAnswer.status).toBe(409);

  const leaderboard = await request(app).get(`/api/v1/sessions/${code}/leaderboard?limit=1`);
  expect(leaderboard.status).toBe(200);
  expect(leaderboard.body).toMatchObject({
    data: [{ rank: 1, ninja_rank: 'Kage', display_name: 'Gameplay One', chakra: 60 }],
    meta: { limit: 1, total: 2 },
  });

  const results = await request(app)
    .get(`/api/v1/results?since=${encodeURIComponent(new Date(0).toISOString())}`)
    .set('X-Hub-Key', process.env.HUB_API_KEY);
  const playedGame = results.body.results.find((game) => game.session_code === code);
  expect(playedGame.players.find((player) => player.nickname === 'Gameplay One').completed).toBe(true);
});
