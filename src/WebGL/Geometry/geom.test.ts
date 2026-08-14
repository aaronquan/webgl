import {test, expect} from "vitest";

import * as Circle from "./circle";
import * as Base from "./base";

test("circle", () => {
	const c1 = new Circle.Circle(0, 0, 1);
	const p1 = new Base.Point2D(1, 0);
	const p2 = new Base.Point2D(0.5, 0);
	const p3 = new Base.Point2D(1.5, 0);
	
	expect(c1.collisionPoint(p1)).toBeTruthy();
	expect(c1.collisionPoint(p2)).toBeTruthy();
	expect(c1.collisionPoint(p3)).toBeFalsy();
	

});