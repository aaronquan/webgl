import * as Interface from "./../Interface/interface";

type Int32 = number;
type Float = number;


interface Equation{
  serialise: () => string;

}

export class Point2D{
  x: Float;
  y: Float;
  constructor(x: Float, y: Float){
    this.x = x;
    this.y = y;
  }
  copy(): Point2D{
    return new Point2D(this.x, this.y);
  }
  equals(point: Point2D): boolean{
    return point.x == this.x && point.y == this.y;
  }
  distanceSq(p: Point2D): Float{
    const dx = this.x - p.x;
    const dy = this.y - p.y;
    return dx*dx + dy*dy;
  }
  distance(p: Point2D): Float{
    return Math.sqrt(this.distanceSq(p));
  }
  serialise(){
    return `${this.x.toString()},${this.y.toString()}`;
  }
}

export class Vector{
  point: Point2D;
  dx: Float;
  dy: Float;
  constructor(p: Point2D, dx: Float, dy: Float){
    this.point = p;
    this.dx = dx;
    this.dy = dy;
  }
  static from2Points(main_point: Point2D, point_to: Point2D): Vector{
    return new Vector(main_point.copy(), point_to.x-main_point.x,
    point_to.y-main_point.y);
  }
  magnitudeSq(): Float{
    return this.dx*this.dx+this.dy*this.dy
  }
  magnitude(): Float{
    return Math.sqrt(this.dx*this.dx+this.dy*this.dy);
  }
  angle(){
    return Math.atan2(this.dy, this.dx);
  }
  to2Points(): Point2D[]{
    return [this.point, new Point2D(this.point.x+this.dx, this.point.y+this.dy)];
  }
}

//todo
