

import { expect, test } from 'vitest'
import * as ArrayUtils from './array';

test('binary search tests', () => {
  const to_search = [-4, -2, 2, 6, 9];
  expect(ArrayUtils.binarySearch(to_search, (n: number) => -2-n)).toBe(1);
  expect(ArrayUtils.binarySearch(to_search, (n: number) => 2-n)).toBe(2);
  expect(ArrayUtils.binarySearch(to_search, (n: number) => -3-n)).toBe(-1);
  expect(ArrayUtils.binarySearch(to_search, (n: number) => 9-n)).toBe(4);
  expect(ArrayUtils.binarySearch(to_search, (n: number) => 6-n)).toBe(3);
});


test('binary bound search tests', () => {
  const to_search = [-4, -2, 2, 6, 9];
  expect(ArrayUtils.binarySearchUpperBound(to_search, (n: number) => -2-n)).toBe(1);
  expect(ArrayUtils.binarySearchLowerBound(to_search, (n: number) => 2-n)).toBe(2);
  expect(ArrayUtils.binarySearchUpperBound(to_search, (n: number) => -3-n)).toBe(1);
  expect(ArrayUtils.binarySearchUpperBound(to_search, (n: number) => 10-n)).toBe(5);
  expect(ArrayUtils.binarySearchLowerBound(to_search, (n: number) => -n)).toBe(1);
});