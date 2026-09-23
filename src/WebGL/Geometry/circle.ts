import * as Base from "./base";

type Float = number;
type Int32 = number;

import Point2D = Base.Point2D;

export class Rect{
  left: Float;
  right: Float;
  width: Float;
  height: Float;
  bot: Float;
  top: Float; // higher value than bot
  // l < r && b < t
  constructor(l: Float, b: Float, w: Float, h: Float){
    this.left = l;
    this.bot = b;

    //assert(w.)

    this.width = w;
    this.height = h;

    this.right = this.left+this.width;
    this.top = this.bot+this.height;
  }
  from2Points(p1: Point2D, p2: Point2D): Rect{
    const l = Math.min(p1.x, p2.x);
    const r = Math.max(p1.x, p2.x);
    const b = Math.min(p1.y, p2.y);
    const t = Math.max(p1.y, p2.y);
    return new Rect(l, r-l, b, t-b);
  }
  //left right bot top
  fromLRBT(l: Float, r: Float, b: Float, t: Float): Rect{
    return new Rect(l, b, r-l, t-b);
  }
  getWidth(): Float{
    return this.width;
  }
  getHeight(): Float{
    return this.height;
  }
  move(x: Float, y: Float){
    this.left += x; this.right += x;
    this.bot += y; this.top += y;
  }
  isInside(x: Float, y: Float){
    const in_x = this.left <= x && x <= this.right;
    const in_y = this.bot <= y && y <= this.top;
    return in_x && in_y;
  }
}

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