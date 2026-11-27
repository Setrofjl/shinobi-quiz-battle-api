'use strict';

const { chakraFor, rankPlayers } = require('../../src/services/gameplay.service');

test('reward values are server-defined and expire after five seconds', () => {
  expect(chakraFor('balloon', 5000)).toBe(10);
  expect(chakraFor('chest', 100)).toBe(25);
  expect(chakraFor('bomb', 100)).toBe(-10);
  expect(chakraFor('chest', 5001)).toBe(0);
  expect(chakraFor('unknown', 100)).toBe(0);
});

test('leaderboard ties share competition rank and ninja rank', () => {
  const ranked = rankPlayers([
    { playerId: 1, chakra: 0, displayName: 'Fourth', avatar: 'd' },
    { playerId: 2, chakra: 25, displayName: 'First', avatar: 'a' },
    { playerId: 3, chakra: 10, displayName: 'Third', avatar: 'c' },
    { playerId: 4, chakra: 10, displayName: 'Second', avatar: 'b' },
  ]);
  expect(ranked.map(({ rank, ninja_rank }) => [rank, ninja_rank])).toEqual([
    [1, 'Kage'],
    [2, 'Jonin'],
    [2, 'Jonin'],
    [4, 'Genin'],
  ]);
});
