import * as Interface from "./../Interface/interface";
import * as Base from "./base";
import * as Waves from "./waves";

import Point2D = Base.Point2D;
import Vector = Base.Vector;

type Int32 = number;
type Float = number;

interface Equation{
	serialise: () => string;

}

export const EquationTypeEnum = {
	LineEquation: 0,
	Quadratic: 1,
	LineSegment: 2,
	Sine: 3
} as const;

type EquationType = (typeof EquationTypeEnum)[keyof typeof EquationTypeEnum];

type EquationOfType = {
	type: EquationType;
	line?: LineABC;
	sine?: Waves.Sine;
	line_segment?: LineSegment2D;
	quadratic?: Quadratic;
}

export function deserialiseEquation(s: string): EquationOfType{
  const sp = s.split(",");
  const eq: EquationOfType = {
    type: EquationTypeEnum.LineEquation
  }
  switch(sp[0]){
    case "le":
      eq.line = LineABC.deserialise(s);
      break;
    case "qd":
      eq.quadratic = Quadratic.deserialise(s);
      eq.type = EquationTypeEnum.Quadratic;
      break;
    case "ls":
      eq.line_segment = LineSegment2D.deserialise(s);
      eq.type = EquationTypeEnum.LineSegment;
      break;
    case "sn":
      eq.sine = Waves.Sine.deserialise(s);
      eq.type = EquationTypeEnum.Sine;
      break;
		default:
			break;
  }
  return eq;
}


interface LineEquation extends Equation{
  getX: (y:Float) => Float | undefined;
  getY: (x:Float) => Float | undefined;
  getIntersectionOnRect:(rect: Interface.InterfaceElement.Rect) => LineRectIntersection;
}

type LineRectIntersection = {
    p1: Point2D | undefined;
    p2: Point2D | undefined;
}

export class LineSegment2D{
  p1: Point2D;
  p2: Point2D;
  constructor(p1: Point2D, p2: Point2D){
    this.p1 = p1;
    this.p2 = p2;
  }
  static fromLineEquationAndX(le: LineEquation, x1: Float, x2: Float): LineSegment2D | undefined{
    const y1 = le.getY(x1);
    const y2 = le.getY(x2);
    if(y1 != undefined && y2 != undefined){
      return new LineSegment2D(new Point2D(x1, y1), new Point2D(x2, y2));
    }
    return undefined;
  }
	//todo?
	getX(): Float | undefined{
		return undefined;
	}
	getY(): Float | undefined{
		return undefined;
	}
  toLineEquationABC(): LineABC{
    const lc = LineABC.from2Points(this.p1, this.p2);
    return lc;
  }
  toVector(): Vector{
    return Vector.from2Points(this.p1, this.p2);
  }
  dx():Float{
    return Math.abs(this.p2.x - this.p1.x);
  }
  dy():Float{
    return Math.abs(this.p2.y-this.p1.y);
  }
  length(){
    const dx = this.dx();
    const dy = this.dy();
    return Math.sqrt(dx*dx+dy*dy);
  }
	getIntersectionOnRect(rect: Interface.InterfaceElement.Rect): LineRectIntersection{
		//todo
		//check left
		if(this.p1.x <= rect.left && this.p2.x >= rect.left || this.p2.x <= rect.left && this.p1.x >= rect.left){

		}
		//if(rect.isInside(this.p1.x, this.p1.y);
		return {p1: undefined, p2: undefined};
	}
  serialise(): string{
    return `ls,${this.p1.x},${this.p1.y},${this.p2.x},${this.p2.y}`;
  }
	
  static deserialise(s: string): LineSegment2D | undefined{
		const sp = s.split(",");
		if(sp[0] != "ls"){
			return undefined;
		}
		const p1 = new Point2D(parseFloat(sp[1]), parseFloat(sp[2]));
		const p2 = new Point2D(parseFloat(sp[3]), parseFloat(sp[4]));
		const seg = new LineSegment2D(p1, p2);
		return seg;
  }
}


export class LineABC implements LineEquation{
	static equation_str = "le";
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
    return `${LineABC.equation_str},${this.a},${this.b},${this.c}`;
  }
	static deserialise(s: string): LineABC | undefined{
		const sp = s.split(",");
		if(sp[0] != LineABC.equation_str){
			return undefined;
		}
		return new LineABC(parseFloat(sp[1]), parseFloat(sp[2]), parseFloat(sp[3]));
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
	static deserialise(s: string): LineMC | undefined{
		return LineABC.deserialise(s)?.toMCForm();
	}
}

type QuadraticSolution = {
    x1: Float | undefined;
    x2: Float | undefined;
}
export class Quadratic{
	static equation_str = "qd";
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
      const line = new LineMC(this.b, this.c);
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

  static withNewTurningPoint(qe: Quadratic, point: Point2D): Quadratic{
    //change b and c to match the quadratic, a should be the same
    //b = -2ax
    // c = ax^2 + bx - y
    const b = -2*qe.a*point.x;
    const c = point.y - qe.a*point.x*point.x - b*point.x;
    return new Quadratic(qe.a, b, c);
  }

  static linkToPoint2DRightC(x: Float, y: Float, a: Float, b: Float): Quadratic{
    //todo: need to think about this more

    const testQuad = new Quadratic(a, b, 0);
    const cy = testQuad.getY(x);
    console.log(cy);

    return testQuad; // return somthing else
  }
  serialise(): string{
    return `qd,${this.a},${this.b},${this.c}`;
  }
	static deserialise(s: string): Quadratic | undefined{
		const sp = s.split(",");
		if(sp[0] != Quadratic.equation_str){
			return undefined;
		}
		return new Quadratic(parseFloat(sp[1]), parseFloat(sp[2]), parseFloat(sp[2]));
	}
}

