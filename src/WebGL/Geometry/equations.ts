import * as Interface from "./../Interface/interface";
import * as Base from "./base";

import Point2D = Base.Point2D;

type Int32 = number;
type Float = number;
type QuadraticSolution = {
    x1: Float | undefined;
    x2: Float | undefined;
}
export class QuadraticEquation{
  a: Float;
  b: Float;
  c: Float;
  constructor(a: Float, b: Float, c: Float){
      this.a = a;
      this.b = b;
      this.c = c;
  }
  getY(x:Float){
      return this.a*x*x + this.b*x + this.c;
  }

  getX(y: Float): QuadraticSolution{
    const discriminant = this.discriminant(y);
    const a2 = this.a+this.a;
    if(this.a == 0){
      const line = new Base.LineMC(this.b, this.c);
      return {x1: line.getX(y), x2: undefined};
    }
    if(discriminant == 0){
      const x = -this.b/a2;
      return {x1: x, x2: undefined};
    }
    if(discriminant > 0){
      const d = Math.sqrt(discriminant);
      const x1 = (-this.b-d)/a2;
      const x2 = (-this.b+d)/a2;
      return {x1: Math.min(x1, x2), x2: Math.max(x1, x2)};
    }
    return {x1: undefined, x2: undefined};
  }
	discriminant(y: Float | undefined = undefined): Float{
    const c = y == undefined ? this.c : this.c - y;
    return this.b*this.b-(4*this.a*c);
  }
	getPointsInRange(x_start: number, x_end: number, samples: Int32): Point2D[]{
    if(x_start > x_end) return [];
    const points = [];
    const y_start = this.getY(x_start);
    points.push(new Point2D(x_start, y_start));
    const inc = 1/samples;
    let x_sample = Math.floor(x_start);
    while(x_sample <= x_start){
      x_sample+=inc;
    }
    while(x_sample < x_end){
      const y_sample = this.getY(x_sample);
      points.push(new Point2D(x_sample, y_sample));
      x_sample+=inc;
    }
    const y_end = this.getY(x_end);
    points.push(new Point2D(x_end, y_end));
    return points;
  }

  static withNewTurningPoint(qe: QuadraticEquation, point: Point2D): QuadraticEquation{
    //change b and c to match the quadratic, a should be the same
    //b = -2ax
    // c = ax^2 + bx - y
    const b = -2*qe.a*point.x;
    const c = point.y - qe.a*point.x*point.x - b*point.x;
    return new QuadraticEquation(qe.a, b, c);
  }

  static linkToPoint2DRightC(x: Float, y: Float, a: Float, b: Float):QuadraticEquation{
    //todo: need to think about this more

    const testQuad = new QuadraticEquation(a, b, 0);
    const cy = testQuad.getY(x);
    console.log(cy);

    return testQuad; // return somthing else
  }
  serialise(): string{
    return `qd,${this.a},${this.b},${this.c}`;
  }
}
  