import {test, expect} from "vitest";
import * as Grid from "./grid";

test("direction", () => {
  //
  const try_left = Grid.DirectionUtil.fromFloatsInGridDecimal(0.1, 0.5);
  expect(try_left).toBe(Grid.DirectionEnum.Left);

  const try_up = Grid.DirectionUtil.fromFloatsInGridDecimal(0.5, 0.1);
  expect(try_up).toBe(Grid.DirectionEnum.Up);

  const try_right = Grid.DirectionUtil.fromFloatsInGridDecimal(0.9, 0.5);
  expect(try_right).toBe(Grid.DirectionEnum.Right);

  const try_down = Grid.DirectionUtil.fromFloatsInGridDecimal(0.5, 0.9);
  expect(try_down).toBe(Grid.DirectionEnum.Down);

});