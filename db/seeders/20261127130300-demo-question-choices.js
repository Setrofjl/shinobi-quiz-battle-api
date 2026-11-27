'use strict';

const demoChoices = [
  ['Chakra', 'Stamina', 'Aura', 'Focus'],
  ['10 minutes', '20 minutes', '30 minutes', '60 minutes'],
  ['5 seconds', '10 seconds', '15 seconds', '20 seconds'],
  ['Balloon', 'Chest', 'Bomb', 'Scroll'],
  ['1st place', '2nd place', '3rd place', '4th place'],
];
const correctIndexes = [0, 0, 0, 1, 0];

module.exports = {
  async up(queryInterface) {
    const choices = demoChoices.flatMap((answers, questionIndex) => answers.map((text, position) => ({
      questionId: questionIndex + 1,
      position,
      text,
      isCorrect: position === correctIndexes[questionIndex],
    })));
    await queryInterface.bulkInsert('Choice', choices);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Choice', { questionId: [1, 2, 3, 4, 5] });
  },
};
