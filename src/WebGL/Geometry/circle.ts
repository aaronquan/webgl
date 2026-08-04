import * as Base from "./base";

type Float = number;

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