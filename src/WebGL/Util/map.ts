

type Int32 = number;
export class PositionMap2D<T>{
  map: Map<Int32, Map<Int32, T>>;

  constructor(){
    this.map = new Map();
  }

  add(x: Int32, y: Int32, t: T){
    if(!this.map.has(y)){
      this.map.set(y, new Map());
    }
    const y_map = this.map.get(y)!;
    y_map.set(x, t);
  }
  get(x: Int32, y: Int32): T | undefined{
    if(!this.map.has(y)){
      return undefined;
    }
    const y_map = this.map.get(y)!;
    if(!y_map.has(x)){
      return undefined;
    }
    return y_map.get(x);
  }
  remove(x: Int32, y: Int32){
    if(!this.map.has(y)){
      return undefined;
    }
    this.map.get(y)!.delete(x);
  }
}