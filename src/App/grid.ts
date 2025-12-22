import * as Matrix from "../WebGL/Matrix/matrix";

export type GridPosition = {
  x: number, y:number
};

export class RectGrid{
  //grid: boolean[][];

  width: number;
  height: number;
  size: number;

  half_size: number;

  pixel_width: number;
  pixel_height: number;

  x: number;
  y: number;

  
  constructor(w: number, h: number, s: number){
    this.width = w;
    this.height = h;
    this.size = s;
    this.half_size = s/2;
    this.pixel_width = w*s;
    this.pixel_height = h*s;

    this.x = 0;
    this.y = 0;
  }
  isInside(x: number, y: number): boolean{
    const right = this.x + this.pixel_width;
    const bottom = this.y + this.pixel_height;
    return x >= this.x && x <= right && y >= this.y && y <= bottom;
  }
  getPosition(x: number, y: number): GridPosition | undefined{
    if(!this.isInside(x, y)) return undefined;
    const gx = Math.floor((x - this.x)/this.size);
    const gy = Math.floor((y - this.y)/this.size);
    return {x: gx, y: gy};
  }
  getTransformation(x: number, y: number): Matrix.TransformationMatrix3x3{
    const model = Matrix.TransformationMatrix3x3.translate(this.x+x*this.size, this.y+y*this.size);
    model.multiply(Matrix.TransformationMatrix3x3.scale(this.size, this.size));
    return model;
  }
  getCenterTransformation(x: number, y: number): Matrix.TransformationMatrix3x3{
    const model = Matrix.TransformationMatrix3x3.translate(this.x+this.half_size+x*this.size, this.y+this.half_size+y*this.size);
    model.multiply(Matrix.TransformationMatrix3x3.scale(this.size, this.size));
    return model;
  }
}

export class WallTile{
  left: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
  constructor(){
    this.left = false;
    this.bottom = false;
    this.right = false;
    this.top = false;
  }
  randomise(){
    let r = Math.random();
    this.left = r < 0.5;
    r = Math.random();
    this.right = r < 0.5;
    r = Math.random();
    this.bottom = r < 0.5;
    r = Math.random();
    this.top = r < 0.5;
  }
}

export class WallGrid{
  width: number;
  height: number;
  grid: WallTile[][];
  constructor(w: number, h: number){
    this.width = w;
    this.height = h;
    this.grid = Array.from({length: h}, () => Array.from({length: w}, () => new WallTile()));
  }
  randomise(){
    for(let y = 0; y < this.height; y++){
      for(let x = 0; x < this.width; x++){
        this.grid[y][x].randomise();
      }
    }
  }
}
