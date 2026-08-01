

type Int32 = number;
type Float = number;

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

}


export class LineSegment2D{
  p1: Point2D;
  p2: Point2D;
  constructor(p1: Point2D, p2: Point2D){
    this.p1 = p1;
    this.p2 = p2;
  }
  
}