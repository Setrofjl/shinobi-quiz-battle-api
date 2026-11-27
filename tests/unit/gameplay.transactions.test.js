'use strict';

jest.mock('../../src/models', () => ({
  sequelize: { transaction: jest.fn() },
  GameSession: { findByPk: jest.fn() },
  Player: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  Question: { findAll: jest.fn() },
  Choice: {},
  Answer: { create: jest.fn(), findOne: jest.fn() },
  RewardRound: { create: jest.fn(), findByPk: jest.fn() },
}));
jest.mock('../../src/services/session.service', () => ({
  findOrFail: jest.fn(),
}));

const models = require('../../src/models');
const sessionService = require('../../src/services/session.service');
const gameplayService = require('../../src/services/gameplay.service');

beforeEach(() => jest.clearAllMocks());

function transaction() {
  models.sequelize.transaction.mockImplementation((callback) => (
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  ));
}

test('an unseated player is refused before an answer can be saved', async () => {
  sessionService.findOrFail.mockResolvedValue({
    sessionId: 5,
    questionSetId: 2,
    status: 'RUNNING',
    endsAt: new Date(Date.now() + 60000),
  });
  transaction();
  models.GameSession.findByPk.mockResolvedValue({ status: 'RUNNING' });
  models.Player.findOne.mockResolvedValue(null);

  await expect(gameplayService.submitAnswer(
    '123456',
    { user_id: 17 },
    { questionId: 8, choiceId: 12 }
  )).rejects.toMatchObject({ status: 403 });
  expect(models.Answer.create).not.toHaveBeenCalled();
});

test('a bomb cannot take Chakra below zero', async () => {
  const session = {
    sessionId: 5,
    status: 'RUNNING',
    endsAt: new Date(Date.now() + 60000),
  };
  const round = {
    playerId: 9,
    objects: [{ id: 'bomb-id', type: 'bomb' }],
    startedAt: new Date(Date.now() - 1000),
    claimedAt: null,
    update: jest.fn().mockResolvedValue(undefined),
  };
  const player = {
    playerId: 9,
    user_id: 17,
    sessionId: 5,
    chakra: 0,
    increment: jest.fn(),
  };
  sessionService.findOrFail.mockResolvedValue(session);
  models.RewardRound.findByPk.mockResolvedValue(round);
  models.Player.findByPk.mockResolvedValue(player);
  models.GameSession.findByPk.mockResolvedValue(session);
  transaction();

  const result = await gameplayService.claimReward(
    '123456',
    { user_id: 17 },
    { rewardRoundId: 'round-id', objectId: 'bomb-id' }
  );

  expect(result).toEqual({ chakra_delta: 0 });
  expect(player.increment).not.toHaveBeenCalled();
  expect(round.update).toHaveBeenCalledWith(
    expect.objectContaining({ chakraDelta: 0 }),
    expect.objectContaining({ transaction: expect.any(Object) })
  );
});

test('a reward claimed after five seconds has zero effect', async () => {
  const session = {
    sessionId: 5,
    status: 'RUNNING',
    endsAt: new Date(Date.now() + 60000),
  };
  const round = {
    playerId: 9,
    objects: [{ id: 'chest-id', type: 'chest' }],
    startedAt: new Date(Date.now() - 5001),
    claimedAt: null,
    update: jest.fn().mockResolvedValue(undefined),
  };
  const player = {
    playerId: 9,
    user_id: 17,
    sessionId: 5,
    chakra: 20,
    increment: jest.fn(),
  };
  sessionService.findOrFail.mockResolvedValue(session);
  models.RewardRound.findByPk.mockResolvedValue(round);
  models.Player.findByPk.mockResolvedValue(player);
  models.GameSession.findByPk.mockResolvedValue(session);
  transaction();

  const result = await gameplayService.claimReward(
    '123456',
    { user_id: 17 },
    { rewardRoundId: 'round-id', objectId: 'chest-id' }
  );

  expect(result).toEqual({ chakra_delta: 0 });
  expect(player.increment).not.toHaveBeenCalled();
  expect(round.update).toHaveBeenCalledWith(
    expect.objectContaining({ chakraDelta: 0 }),
    expect.objectContaining({ transaction: expect.any(Object) })
  );
});
