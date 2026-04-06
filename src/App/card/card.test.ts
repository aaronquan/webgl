import { expect, test } from 'vitest'
import * as Card from './card'
import * as Grid from '../ResourceSim/grid'

test('list tests', () => {
  //const list = new Card.
});

test('deck tests', () => {
  //Card.VirtualCard.
  const deck = new Card.Deck();
  deck.addRandomCard();

});

test('rotation', () => {
  const rot = 0;
  const target = Grid.DirectionEnum.Up;
  expect(Grid.DirectionUtil.getTurnDirection(target, rot)).toBe(Grid.TurnDirectionEnum.Straight);
  const r2 = Math.PI*1.5;
  expect(Grid.DirectionUtil.getTurnDirection(target, rot)).toBe(Grid.TurnDirectionEnum.Straight);
});