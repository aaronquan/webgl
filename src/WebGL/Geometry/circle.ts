import * as Base from "./base";

type Float = number;
type Int32 = number;

import Point2D = Base.Point2D;

export class Circle{
	centre: Base.Point2D;
	radius: Float;
	constructor(x: Float, y: Float, r: Float){
		this.centre = new Base.Point2D(x, y);
		this.radius = r;
	}
	static fromPoint(pt: Base.Point2D, r:Float=1): Circle{
		return new Circle(pt.x, pt.y, r);
	}
	static from2Points(c: Base.Point2D, e: Base.Point2D): Circle{
    const d = c.distance(e);
		return new Circle(c.x, c.y, d);
	}
	getDiameter(): Float{
		return this.radius + this.radius;
	}
	collisionPoint(pt: Base.Point2D): boolean{
		return this.centre.distance(pt) <= this.radius;
	}
	collisionCircle(c: Circle): boolean{
		return this.centre.distance(c.centre) <= this.radius + c.radius;
	}
  
	
}

export class LineCircle{
	center: Point2D;
  radius: Float;
  constructor(c: Point2D, r: Float){
    this.center = c;
    this.radius = r;
  }
  getPoints(rads: Float=0, samples: Int32=10): Point2D[]{
    const points = [];
    const move = (Math.PI+Math.PI)/samples;
    let r = rads;
    for(let i = 0; i <= samples; i++){
      const x = this.radius*Math.cos(r)+this.center.x;
      const y = this.radius*Math.sin(r)+this.center.y;
      points.push(new Point2D(x, y));
      r += move;
    }
    //points should be samples+1 (inc back to start)
    return points;
  }
  static from2Points(c: Point2D, p: Point2D){
    const r = c.distance(p);
    return new LineCircle(c.copy(), r);
  }
}