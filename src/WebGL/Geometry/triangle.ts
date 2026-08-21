import * as Base from "./base";
import * as Equation from "./equations";

import Point2D = Base.Point2D;
import LineSegment2D = Equation.LineSegment2D;

type Float = number;

type TriangleSegments = {
  l1: LineSegment2D; //1 - 2
  l2: LineSegment2D; //2 - 3
  l3: LineSegment2D; //3 - 1
}

export class Triangle{
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;

  constructor(p1: Point2D, p2: Point2D, p3: Point2D){
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
  collisionPoint(p: Point2D): boolean{
    const error = 0.001;
    const a = this.area();
    const t1 = new Triangle(p, this.p1, this.p2);
    const a1 = t1.area();
    const t2 = new Triangle(p, this.p2, this.p3);
    const a2 = t2.area();
    const t3 = new Triangle(p, this.p3, this.p1);
    const a3 = t3.area();
    return Math.abs(a1+a2+a3 - a) < error;
  }
  area(): Float{
    return Math.abs(
      (this.p2.x-this.p1.x)*(this.p3.y-this.p1.y) - 
      (this.p3.x-this.p1.x)*(this.p2.y-this.p1.y)
    ); 
  }
  toLineSegments(): TriangleSegments{
    return {
      l1: new LineSegment2D(this.p1, this.p2),
      l2: new LineSegment2D(this.p2, this.p3),
      l3: new LineSegment2D(this.p3, this.p1)
    };
  }
  point1Angle(): Float{
    //todo
  }
  point2Angle(): Float{
    //todo
  }

  toDrawPointArray(): Point2D[]{
    return [this.p1, this.p2, this.p3, this.p1];
  }
  
}

