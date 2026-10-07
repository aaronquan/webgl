import {test, expect} from "vitest";
import * as Grid from "./grid";

test("grid", () => {

});

test("coordinate_chunk", () => {
  const test_chunk = new Grid.Generic.CoordinateChunk([{x: 1, y: 1}]);
  //todo write tests
  expect(test_chunk.hasCoordinate({x: 1, y: 1})).toBeTruthy();
  expect(test_chunk.hasCoordinate({x: 0, y: 1})).toBeFalsy();

  const adj_test = test_chunk.getAdjacents();

  expect(adj_test.hasXY(1, 1)).toBeFalsy();
  expect(adj_test.hasXY(0, 1)).toBeTruthy();
  expect(adj_test.hasXY(1, 0)).toBeTruthy();

  test_chunk.addXY(2,1);
  expect(test_chunk.hasXY(2,1)).toBeTruthy();

  const adj_test1 = test_chunk.getAdjacents();
  expect(adj_test1.hasCoordinate({x:2, y:2})).toBeTruthy(); 
  expect(adj_test1.hasCoordinate({x:3, y:1})).toBeTruthy(); 
  
  const t_chunk2 = new Grid.Generic.CoordinateChunk([{x: 1, y: 1}, {x:2, y:1}, {x:2, y:2}]);

  expect(t_chunk2.hasXY(3,1)).toBeFalsy();

  const adj_test2 = t_chunk2.getAdjacents();
  expect(adj_test2.hasXY(2,3)).toBeTruthy();
});

test("algorithms", () => {

  //coordinate distance sq
  const c1: Grid.Generic.Coordinate = {x:0, y:0};
  const c2: Grid.Generic.Coordinate = {x:1, y:1};

  const dist_sq = Grid.Generic.GridAlgorithms.coordinateDistanceSquared(c1, c2);
  expect(dist_sq).toBe(2);

  //positions at distance
  const coords = Grid.Generic.GridAlgorithms.coordinatesWithinRange(3);
  console.log(coords);

});