import * as Interface from "./../Interface/interface";

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
}

//todo
export class LineSegment2D{
  p1: Point2D;
  p2: Point2D;
  constructor(p1: Point2D, p2: Point2D){
    this.p1 = p1;
    this.p2 = p2;
  }
  
}

interface LineEquation{
  getX: (y:Float) => Float | undefined;
  getY: (x:Float) => Float | undefined;
  getIntersectionOnRect:(rect: Interface.InterfaceElement.Rect) => LineRectIntersection;
}

type LineRectIntersection = {
    p1: Point2D | undefined;
    p2: Point2D | undefined;
}

export class LineABC implements LineEquation{
  a: Float;
  b: Float;
  c: Float;
  constructor(a: Float, b: Float, c: Float){
    this.a = a;
    this.b = b;
    this.c = c;
  }
  static from2Points(p1: Point2D, p2: Point2D): LineABC{
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = -a*p1.x - b*p1.y;
    return new LineABC(a, b, c);
  }
  getX(y: Float): Float | undefined{
    if(this.a == 0) return undefined;
    return -(this.b*y+this.c)/this.a;
  }
  getY(x: Float): Float | undefined{
    if(this.b == 0) return undefined;
    return -(this.a*x+this.c)/this.b;
  }
  //m = -a/b
  //c = -c/b
  toMCForm(): LineMC{
    const m = this.b != 0 ? -this.a/this.b : undefined;
    const c = this.a != 0 ? -this.c/this.a : 0;
    return new LineMC(m, c);
  }

  getIntersectionOnRect(rect: Interface.InterfaceElement.Rect): LineRectIntersection{
    const points = [];
    const out: LineRectIntersection = {p1: undefined, p2: undefined};
    const y_lo = this.getY(rect.left); 
    const y_hi = this.getY(rect.right);
    const x_lo = this.getX(rect.bot);
    const x_hi = this.getX(rect.top);

    if(y_lo != undefined){
      if(y_lo == rect.bot){
        points.push(new Point2D(rect.left, rect.bot));
      }else if(y_lo == rect.top){
        points.push(new Point2D(rect.left, rect.top));
      }else if(y_lo > rect.bot && y_lo < rect.top){
        points.push(new Point2D(rect.left, y_lo));
      }
    }
    if(y_hi != undefined){
      if(y_hi == rect.bot){
        points.push(new Point2D(rect.right, rect.bot));
      }else if(y_hi == rect.top){
        points.push(new Point2D(rect.right, rect.top));
      }else if(y_hi > rect.bot && y_hi < rect.top){
        points.push(new Point2D(rect.right, y_hi));
      }
    }
    if(x_lo != undefined){
      if(x_lo > rect.left && x_lo < rect.right){
        points.push(new Point2D(x_lo, rect.bot));
      }
    }
    if(x_hi != undefined){
      if(x_hi > rect.left && x_hi < rect.right){
        points.push(new Point2D(x_hi, rect.top));
      }
    }
    if(points.length == 2){
      out.p1 = points[0];
      out.p2 = points[1];
    }else if(points.length == 1){
      out.p1 = points[0];
    }
    return out;
  }
  closestDistanceToPoint2D(p: Point2D): Float{
    const ab2sq = Math.sqrt(p.x*p.x + p.y*p.y);
    const num = Math.abs(this.a*p.x+this.b*p.y+this.c);
    return num/ab2sq;
  }
  closestPointOnLine(p: Point2D): Point2D{
    const ab2 = this.a*this.a + this.b*this.b;
    const aybx = this.a*p.y - this.b*p.x;
    const x = (this.b*(-aybx) - this.a*this.c)/ab2;
    const y = (this.a*aybx - this.b*this.c)/ab2; 
    return new Point2D(x, y);
  }
  serialise(): string{
    return `le,${this.a},${this.b},${this.c}`;
  }
}

export class LineMC implements LineEquation{
  c: Float;
  m: Float | undefined; // undefined means vertical i.e x = c
  constructor(m: Float | undefined, c: Float){
    this.c = c;
    this.m = m;
  }
  static fromJoinPoint(m: Float | undefined, pt: Point2D){
    //y = mx + c
    //c = y - mx
    if(m == undefined){
      return new LineMC(undefined, pt.y);
    }
    const c = pt.y - m*pt.x;
    return new LineMC(m, c);
  }
  static from2Points(p1: Point2D, p2: Point2D){
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    let m = undefined;
    if(dx != 0){
      m = dy/dx;
    }
    let c = p1.x;
    if(m != undefined){
      c = p1.y - m*p1.x;
    }
    return new LineMC(m, c);
  }

  getX(y: Float): Float | undefined{
    if(this.m != undefined){
      if(this.m == 0) return undefined;
      return (y - this.c)/this.m;
    }
    return undefined;
  }
  getY(x: Float): Float | undefined{
    if(this.m != undefined){
      return this.m*x + this.c;
    }
    return undefined;
  }
  getIntersectionOnRect(rect: Interface.InterfaceElement.Rect): LineRectIntersection{
    const points = [];
    const out: LineRectIntersection = {p1: undefined, p2: undefined};
    if(this.m == 0){
        if(rect.bot <= this.c && this.c <= rect.top){
          return {
            p1: new Point2D(rect.left, this.c), 
            p2: new Point2D(rect.right, this.c)
          };
        }
    }else if(this.m == undefined){
        if(rect.left <= this.c && this.c <= rect.right){
            return {
                p1: new Point2D(this.c, rect.bot),
                p2: new Point2D(this.c, rect.top)
            }
        }
    }else{
      const y_lo = this.getY(rect.left);
      const y_hi = this.getY(rect.right);
      const x_lo = this.getX(rect.bot);
      const x_hi = this.getX(rect.top);
      //add conditions for equals
      if(y_lo != undefined){
        if(y_lo == rect.bot){
          points.push(new Point2D(rect.left, rect.bot));
        }else if(y_lo == rect.top){
          points.push(new Point2D(rect.left, rect.top));
        }else if(y_lo > rect.bot && y_lo < rect.top){
          points.push(new Point2D(rect.left, y_lo));
        }
      }
      if(x_lo != undefined){
        if(x_lo > rect.left && x_lo < rect.right){
          points.push(new Point2D(x_lo, rect.bot));
        }
      }
      if(x_hi != undefined){
        if(x_hi > rect.left && x_hi < rect.right){
          points.push(new Point2D(x_hi, rect.top));
        }
      }
      if(y_hi != undefined){
        if(y_hi == rect.bot){
          points.push(new Point2D(rect.right, rect.bot));
        }else if(y_hi == rect.top){
          points.push(new Point2D(rect.right, rect.top));
        }else if(y_hi > rect.bot && y_hi < rect.top){
          points.push(new Point2D(rect.right, y_hi));
        }
      }
    }
    if(points.length == 2){
      if(points[0].x < points[1].x){
        out.p1 = points[0];
        out.p2 = points[1];
      }else{
        out.p1 = points[1];
        out.p2 = points[0];
      }
    }else if(points.length == 1){
        out.p1 = points[0];
    }
    return out;
  }

  //for b = 1
  //y = ax + c
  //ax - y + c = 0
  toABCForm(): LineABC{
    if(this.m == undefined){
      return new LineABC(1, 0, this.c);
    }
    //assume b = 1
    const a = this.m;
    const c = this.c;
    return new LineABC(a, -1, c);
  }
  serialise(): string{
    const le_abc = this.toABCForm();
    return le_abc.serialise();
  }
}