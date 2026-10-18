//import * as Interface from "./../Interface/interface";

type Int32 = number;
type Float = number;


interface Equation{
  serialise: () => string;

}

export class Point2D{
  x: Float;
  y: Float;
  constructor(x: Float=0, y: Float=0){
    this.x = x;
    this.y = y;
  }
  copy(): Point2D{
    return new Point2D(this.x, this.y);
  }
  equals(point: Point2D): boolean{
    return point.x == this.x && point.y == this.y;
  }
  shift(x: Float=0, y: Float=0){
    this.x += x; this.y += y;
  }
  scale(m: Float=1){
    this.x *= m; this.y *= m;
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
  x: Float;
  y: Float;
  constructor(x: Float, y: Float){
    this.x = x;
    this.y = y;
  }
  angle(){
    return Math.atan2(this.y, this.x);
  }
  dot(v:Vector): Float{
    return this.x*v.x + this.y*v.y;
  }
  closestDistance(point: Point2D){
    //point.
  }
}

export class PointVector{
  point: Point2D;
  dx: Float;
  dy: Float;
  constructor(p: Point2D, dx: Float, dy: Float){
    this.point = p;
    this.dx = dx;
    this.dy = dy;
  }
  static from2Points(main_point: Point2D, point_to: Point2D): PointVector{
    return new PointVector(main_point.copy(), point_to.x-main_point.x,
    point_to.y-main_point.y);
  }
  magnitudeSq(): Float{
    return this.dx*this.dx+this.dy*this.dy;
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


//left -> right,  bot -> top
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
