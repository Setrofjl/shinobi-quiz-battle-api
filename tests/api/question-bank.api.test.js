'use strict';

const fs = require('fs');
const path = require('path');
const { app, request, bearer } = require('../setup/helpers');
const { Choice, Question, QuestionSet, User, sequelize } = require('../../src/models');

const fixture = (...parts) => path.join(__dirname, '..', '..', 'postman', 'fixtures', ...parts);
const uploadedFiles = new Set();

async function createQuestionSet(authorization, title = 'Week 13 Question Set') {
  const res = await request(app)
    .post('/api/v1/question-sets')
    .set('Authorization', authorization)
    .send({ title, subject: 'Shinobi' });
  expect(res.status).toBe(201);
  return res.body.id;
}

afterAll(async () => {
  for (const file of uploadedFiles) {
    try {
      await fs.promises.unlink(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  await sequelize.close();
});

describe('question bank', () => {
  test('question set lists are paginated, searchable, and allow-listed', async () => {
    const host = await bearer('24179712');
    const user = await User.findOne({ where: { school_id: '24179712' } });
    const total = await QuestionSet.count({ where: { hostId: user.user_id } });
    const page = await request(app)
      .get('/api/v1/question-sets?page=1&limit=1&sort=title&order=asc')
      .set('Authorization', host);
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toEqual({ page: 1, limit: 1, total, pages: total });

    const empty = await request(app)
      .get('/api/v1/question-sets?q=no-matching-set')
      .set('Authorization', host);
    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
    expect(empty.body.meta.total).toBe(0);

    const badSort = await request(app)
      .get('/api/v1/question-sets?sort=questionSetId%3Bdrop%20table')
      .set('Authorization', host);
    expect(badSort.status).toBe(400);
  });

  test('questions save choices atomically and include loads nested content in one query', async () => {
    const host = await bearer('24179712');
    const setId = await createQuestionSet(host);
    const create = await request(app)
      .post(`/api/v1/question-sets/${setId}/questions`)
      .set('Authorization', host)
      .send({
        text: 'Which energy powers a shinobi?',
        type: 'multiple-choice',
        timeLimit: 20,
        position: 99,
        choices: [
          { text: 'Chakra', isCorrect: true, position: 99 },
          { text: 'Steam', isCorrect: false, position: 99 },
          { text: 'Dust', isCorrect: false, position: 99 },
        ],
      });

    expect(create.status).toBe(201);
    expect(create.body.question).toMatchObject({ position: 0, correct_index: 0 });
    expect(create.body.question.choices.map((choice) => choice.position)).toEqual([0, 1, 2]);
    const questionId = create.body.question.id;

    const set = await QuestionSet.findByPk(setId);
    const before = await Question.count({ where: { questionSetId: setId } });
    const createChoices = jest.spyOn(Choice, 'bulkCreate').mockRejectedValueOnce(new Error('test failure'));
    await expect(require('../../src/services/question.service').create(setId, {
      text: 'This write must roll back',
      type: 'multiple-choice',
      timeLimit: 20,
      choices: [
        { text: 'Right', isCorrect: true },
        { text: 'Wrong', isCorrect: false },
      ],
    }, { user_id: set.hostId })).rejects.toThrow('test failure');
    createChoices.mockRestore();
    expect(await Question.count({ where: { questionSetId: setId } })).toBe(before);

    const statements = [];
    const oldLogging = sequelize.options.logging;
    sequelize.options.logging = (statement) => statements.push(statement);
    let included;
    try {
      included = await request(app)
        .get(`/api/v1/question-sets/${setId}?include=questions`)
        .set('Authorization', host);
    } finally {
      sequelize.options.logging = oldLogging;
    }
    expect(included.status).toBe(200);
    expect(included.body.questions).toHaveLength(1);
    expect(included.body.questions[0].id).toBe(questionId);
    expect(included.body.questions[0].choices).toHaveLength(3);
    expect(statements.filter((statement) => statement.includes('FROM "QuestionSet"'))).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/v1/question-sets/${setId}/questions/${questionId}`)
      .set('Authorization', host)
      .send({
        text: 'Updated question',
        choices: [
          { text: 'First', isCorrect: false, position: 100 },
          { text: 'Second', isCorrect: true, position: 100 },
        ],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.question).toMatchObject({ text: 'Updated question', correct_index: 1 });
    expect(updated.body.question.choices.map((choice) => choice.position)).toEqual([0, 1]);

    const removed = await request(app)
      .delete(`/api/v1/question-sets/${setId}/questions/${questionId}`)
      .set('Authorization', host);
    expect(removed.status).toBe(204);
    const emptyQuestions = await request(app)
      .get(`/api/v1/question-sets/${setId}/questions`)
      .set('Authorization', host);
    expect(emptyQuestions.status).toBe(200);
    expect(emptyQuestions.body.data).toEqual([]);
  });

  test('nested question rules enforce one correct choice, ownership, and frozen sets', async () => {
    const host = await bearer('24179712');
    const player = await bearer('24179723');
    const setId = await createQuestionSet(host, 'Question Rule Set');
    const validBody = {
      text: 'Choose one',
      type: 'multiple-choice',
      timeLimit: 20,
      choices: [
        { text: 'First', isCorrect: true },
        { text: 'Second', isCorrect: false },
      ],
    };

    const twoCorrect = await request(app)
      .post(`/api/v1/question-sets/${setId}/questions`)
      .set('Authorization', host)
      .send({ ...validBody, choices: validBody.choices.map((choice) => ({ ...choice, isCorrect: true })) });
    expect(twoCorrect.status).toBe(400);

    const playerWrite = await request(app)
      .post(`/api/v1/question-sets/${setId}/questions`)
      .set('Authorization', player)
      .send({});
    expect(playerWrite.status).toBe(403);

    const frozenUpdate = await request(app)
      .patch('/api/v1/question-sets/1')
      .set('Authorization', host)
      .send({ title: 'This set is frozen' });
    expect(frozenUpdate.status).toBe(409);
    expect(frozenUpdate.body.error.code).toBe('QUESTION_SET_IN_USE');
  });

  test('cover uploads accept valid images only and enforce the size limit', async () => {
    const host = await bearer('24179712');
    const setId = await createQuestionSet(host, 'Cover Upload Set');

    const good = await request(app)
      .put(`/api/v1/question-sets/${setId}/cover`)
      .set('Authorization', host)
      .attach('cover', fixture('cover.png'));
    expect(good.status).toBe(200);
    expect(good.body.cover_url).toMatch(/^\/uploads\/covers\/set-\d+-[0-9a-f-]+\.png$/);
    const storedFile = path.join(__dirname, '..', '..', good.body.cover_url.slice('/uploads/'.length));
    uploadedFiles.add(storedFile);
    const served = await request(app).get(good.body.cover_url);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toMatch(/^image\/png/);

    const wrongType = await request(app)
      .put(`/api/v1/question-sets/${setId}/cover`)
      .set('Authorization', host)
      .attach('cover', fixture('not-a-picture.txt'));
    expect(wrongType.status).toBe(400);

    const spoofedImage = await request(app)
      .put(`/api/v1/question-sets/${setId}/cover`)
      .set('Authorization', host)
      .attach('cover', Buffer.from('not an image'), { filename: 'spoof.png', contentType: 'image/png' });
    expect(spoofedImage.status).toBe(400);

    const tooBig = await request(app)
      .put(`/api/v1/question-sets/${setId}/cover`)
      .set('Authorization', host)
      .attach('cover', fixture('too-big.jpg'));
    expect(tooBig.status).toBe(413);
  });
});
