import {test, expect} from "vitest";
import * as Puzzle from "./engine";
import * as Shape from "./shape";
import * as WebGL from "./../../WebGL/globals";

import Rotation = WebGL.Geometry.Rotation;

test("grid_shape", () => {
  const shape = new Shape.GridShape(3, 2);
  shape.addPart(0, 0);
  shape.addPart(1, 0);
  shape.addPart(2, 0);
  shape.addPart(2, 1);

  const i1 = new Shape.GridShapeInstance(shape);

  expect(i1.getPart(0, 0)).toBe(true);
  expect(i1.getPart(1, 0)).toBe(true);
  expect(i1.getPart(2, 0)).toBe(true);
  expect(i1.getPart(0, 1)).toBe(false);
  expect(i1.getPart(1, 1)).toBe(false);
  expect(i1.getPart(2, 1)).toBe(true);

  const i2 = new Shape.GridShapeInstance(shape);
  i2.setRotation(Rotation.RotationEnum.Right);
  expect(i2.getPart(0, 0)).toBe(false);
  expect(i2.getPart(1, 0)).toBe(true);
  expect(i2.getPart(0, 1)).toBe(false);
  expect(i2.getPart(1, 1)).toBe(true);
  expect(i2.getPart(0, 2)).toBe(true);
  expect(i2.getPart(1, 2)).toBe(true);
  expect(i2.getPart(2, 2)).toBe(undefined);

  const i3 = new Shape.GridShapeInstance(shape);
  i3.setRotation(Rotation.RotationEnum.Left);
  expect(i3.getPart(0, 0)).toBe(true);
  expect(i3.getPart(1, 0)).toBe(true);
  expect(i3.getPart(0, 1)).toBe(true);
  expect(i3.getPart(1, 1)).toBe(false);
  expect(i3.getPart(0, 2)).toBe(true);
  expect(i3.getPart(1, 2)).toBe(false);
  expect(i3.getPart(2, 2)).toBe(undefined);

  const i4 = new Shape.GridShapeInstance(shape);
  i4.setRotation(Rotation.RotationEnum.Down);
  expect(i4.getPart(0, 0)).toBe(true);
  expect(i4.getPart(1, 0)).toBe(false);
  expect(i4.getPart(2, 0)).toBe(false);
  expect(i4.getPart(0, 1)).toBe(true);
  expect(i4.getPart(1, 1)).toBe(true);
  expect(i4.getPart(2, 1)).toBe(true);
  expect(i4.getPart(2, 2)).toBe(undefined);
});

test("shape placement and coords", () => {
  const shape = new Shape.GridShape(3, 2);
  shape.addPart(0, 0);
  shape.addPart(1, 0);
  shape.addPart(2, 0);
  shape.addPart(2, 1);
  /*
  base  clock down anti
  ***    *    *     **
    *    *    ***   *
        **          *
  
  */

  //coords test
  const instance = new Shape.GridShapeInstance(shape);
  instance.setPlacement(2, 2);
  let coords = instance.getCoordinates(); // base
  expect(coords).toStrictEqual([{x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}, {x:4, y: 3}]);
  
  instance.rotateClockwise();
  coords = instance.getCoordinates(); // right
  expect(coords).toStrictEqual([{x: 3, y: 2}, {x: 3, y: 3}, {x: 2, y: 4}, {x:3, y: 4}]);
  
  instance.rotateClockwise();
  coords = instance.getCoordinates(); //down
  expect(coords).toStrictEqual([{x: 2, y: 2}, {x: 2, y: 3}, {x: 3, y: 3}, {x:4, y: 3}]);

  instance.setRotation(Rotation.RotationEnum.Left);
  coords = instance.getCoordinates();
  expect(coords).toStrictEqual([{x: 2, y: 2}, {x: 3, y: 2}, {x: 2, y: 3}, {x:2, y: 4}]);

  instance.move(2,1);
  coords = instance.getCoordinates();
  expect(coords).toStrictEqual([{x: 4, y: 3}, {x: 5, y: 3}, {x: 4, y: 4}, {x:4, y: 5}]);
});