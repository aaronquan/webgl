import {test, expect} from "vitest";

import * as Circle from "./circle";
import * as Base from "./base";
import * as Graph from "./graph";
import * as Equation from "./equation";
import * as Wave from "./waves";

test("circle", () => {
	const c1 = new Circle.Circle(0, 0, 1);
	const p1 = new Base.Point2D(1, 0);
	const p2 = new Base.Point2D(0.5, 0);
	const p3 = new Base.Point2D(1.5, 0);
	
	expect(c1.collisionPoint(p1)).toBeTruthy();
	expect(c1.collisionPoint(p2)).toBeTruthy();
	expect(c1.collisionPoint(p3)).toBeFalsy();
	

});

test("equation rect ranges", () => {
	const rect = new Graph.GraphRect(-3, -3, 6, 6);
	const l1 = new Equation.LineABC(1, 1, 0);
	const l2 = new Equation.LineABC(1, 2, 0);

	const l1_range = rect.getLineIntersectionXRange(l1);
	expect(l1_range).toBeDefined();
	expect(l1_range?.start).toBe(-3);
	expect(l1_range?.end).toBe(3);

	const l2_range = rect.getLineIntersectionXRange(l2);
	expect(l2_range).toBeDefined();
	expect(l2_range?.start).toBe(-3);
	expect(l2_range?.end).toBe(3);

	const l3 = new Equation.LineABC(2, 1, 0);
	const l3_range = rect.getLineIntersectionXRange(l3);
	expect(l3_range).toBeDefined();
	expect(l3_range?.start).toBe(-1.5);
	expect(l3_range?.end).toBe(1.5);

	const l4 = new Equation.LineABC(1, 1, 1);
	const l4_range = rect.getLineIntersectionXRange(l4);
	expect(l4_range).toBeDefined();
	expect(l4_range?.start).toBe(-3);
	expect(l4_range?.end).toBe(2);

	const p1 = rect.getLineIntersectionPoints(l1);
	expect(p1[0].x).toBe(-3); expect(p1[0].y).toBe(3);
	expect(p1[1].x).toBe(3); expect(p1[1].y).toBe(-3);

	const p2 = rect.getLineIntersectionPoints(l2);
	expect(p2[0].x).toBe(-3); expect(p2[0].y).toBe(1.5);
	expect(p2[1].x).toBe(3); expect(p2[1].y).toBe(-1.5);
});

test("wave", () => {
	//const saw = new Wave.Sawtooth(Math.PI, 1);
	//const points = saw.getPointsInRange(-6, 6);
	//console.log(points);
	//console.log(saw.nextPeak(-3));

	const square = new Wave.Square(1, 1, 0);
	square.nextPeak(0);
	console.log(square.nextPeak(0));
	const sq_points = square.getPointsInRange(-6, 6);

	console.log(sq_points);
});