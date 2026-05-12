import {test, expect} from "vitest";
import * as Puzzle from "./engine";

test("grid_shape", () => {
  const shape = new Puzzle.GridShape(3, 2);
  shape.addPart(0, 0);
  shape.addPart(1, 0);
  shape.addPart(2, 0);
  shape.addPart(2, 1);

  const i1 = new Puzzle.GridShapeInstance(shape);

  expect(i1.getPart(0, 0)).toBe(true);
  expect(i1.getPart(1, 0)).toBe(true);
  expect(i1.getPart(2, 0)).toBe(true);
  expect(i1.getPart(0, 1)).toBe(false);
  expect(i1.getPart(1, 1)).toBe(false);
  expect(i1.getPart(2, 1)).toBe(true);

  const i2 = new Puzzle.GridShapeInstance(shape);
  i2.setRotation(Puzzle.RotationEnum.Clockwise);
  expect(i2.getPart(0, 0)).toBe(false);
  expect(i2.getPart(1, 0)).toBe(true);
  expect(i2.getPart(0, 1)).toBe(false);
  expect(i2.getPart(1, 1)).toBe(true);
  expect(i2.getPart(0, 2)).toBe(true);
  expect(i2.getPart(1, 2)).toBe(true);
  expect(i2.getPart(2, 2)).toBe(undefined);

  const i3 = new Puzzle.GridShapeInstance(shape);
  i3.setRotation(Puzzle.RotationEnum.AntiClockwise);
  expect(i3.getPart(0, 0)).toBe(true);
  expect(i3.getPart(1, 0)).toBe(true);
  expect(i3.getPart(0, 1)).toBe(true);
  expect(i3.getPart(1, 1)).toBe(false);
  expect(i3.getPart(0, 2)).toBe(true);
  expect(i3.getPart(1, 2)).toBe(false);
  expect(i3.getPart(2, 2)).toBe(undefined);

  const i4 = new Puzzle.GridShapeInstance(shape);
  i4.setRotation(Puzzle.RotationEnum.Opposite);
  expect(i4.getPart(0, 0)).toBe(true);
  expect(i4.getPart(1, 0)).toBe(false);
  expect(i4.getPart(2, 0)).toBe(false);
  expect(i4.getPart(0, 1)).toBe(true);
  expect(i4.getPart(1, 1)).toBe(true);
  expect(i4.getPart(2, 1)).toBe(true);
  expect(i4.getPart(2, 2)).toBe(undefined);
});