

type Float = number;
export class Interval{
  start: Float;
  end: Float;
  constructor(st: Float, end: Float){
    this.start = st;
    this.end = end;
  }
  valid():boolean{
    return this.size() >= 0;
  }

  size(): Float{
    return this.end-this.start;
  }

  isOverlapping(interval: Interval): boolean{
    return Math.max(this.start, interval.start) < Math.min(this.end, interval.end);
  }
  getOverlap(inter: Interval): Interval | undefined{
    if(!this.isOverlapping(inter)){
      return undefined;
    }
    return new Interval(Math.max(this.start, inter.start), Math.min(this.end, inter.end));
  }
  clamp(cl: Interval){
    if(cl.start > this.start){
      this.start = cl.start;
    }
    if(cl.end < this.end){
      this.end = cl.end;
    }

  }
}

