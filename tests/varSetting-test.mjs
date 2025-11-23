//tests to see if variables are what they are supposed to be between rounds and stuff

import { 
  startGame,
  round,
  combo,
  gameState,
  getRound
} from '../testImports/sketchSetup.js';

import { runner } from './testClass.js';

global.random = () => Math.random();

startGame();

runner.test('Start at combo 0', function() {
    this.assertTrue(combo == 0, 'Combo starts at zero');
});

runner.test('start in game state', function() {
    this.assertTrue(gameState == 'game', 'We are in \'game\' state');
});

runner.test('start at round 1', function() {
    this.assertTrue(getRound() == 1, 'Starts at first round');
});

