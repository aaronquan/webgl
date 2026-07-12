

type Int32 = number;
type Float = number;

export class GenericGrid2D<T>{
  width: Int32;
  height: Int32;
  grid: (T | undefined)[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.grid = Array.from({length: this.width*this.height}, () => undefined);
  }
  setAll(t: T){
    this.grid.fill(t);
  }
  private key(x: Int32, y: Int32){
    return y*this.width+x;
  }

  set(x: Int32, y: Int32, t: T){
    this.grid[this.key(x, y)] = t;
  }
  get(x: Int32, y: Int32): T | undefined{
    return this.grid[this.key(x, y)];
  }
}

export class Grid2DInterface{
  x: Float;
  y: Float;
  cell_size: Float;
  constructor(x: Float, y: Float, sz: Float){
    this.x = x;
    this.y = y;
    this.cell_size = sz;
  }
}