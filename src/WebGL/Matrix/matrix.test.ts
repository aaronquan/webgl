import { expect, test } from 'vitest'
import * as Matrix from './matrix'

test('3x3 matrix tests', () => {
  const minor_test = new Matrix.Matrix3x3();
  minor_test.setMatrix([3,0,2,2,0,-2,0,1,1]);
  const equal_test = new Matrix.Matrix3x3();
  equal_test.setMatrix([3,-0,2,2,-0,-2,0,1,1]);
  expect(Matrix.Matrix3x3.equals(minor_test, equal_test)).toBeTruthy();
  expect(minor_test.matrix[2]).toBe(2);
  expect(minor_test.matrix[5]).toBe(-2);
  expect(minor_test.matrix[1]).toBe(0);
  expect(minor_test.matrix[6]).toBe(0);
  expect(minor_test.matrix[7]).toBe(1);
  const minor = minor_test.matrixMinorsCopy();
  const minor_result = new Matrix.Matrix3x3();
  minor_result.setMatrix([2, 2, 2, -2, 3, 3, 0, -10, 0]);
  expect(Matrix.Matrix3x3.equals(minor, minor_result)).toBeTruthy();

  const cofactor = minor_test.matrixCofactorsCopy();
  const cofactor_result = Matrix.Matrix3x3.new([2,-2,2,2,3,-3,0,10,0]);
  expect(Matrix.Matrix3x3.equals(cofactor, cofactor_result)).toBeTruthy();

  const determinant = minor_test.determinant();
  expect(determinant).toBe(10);

  const inverse_result = Matrix.Matrix3x3.new([0.2, 0.2, 0, -0.2, 0.3, 1, 0.2, -0.3, 0]);
  const inverse = minor_test.inverseCopy();
  expect(Matrix.Matrix3x3.equals(inverse, inverse_result)).toBeTruthy();
});