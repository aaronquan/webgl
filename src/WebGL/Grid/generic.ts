import * as WebGL from "./../globals";

type Int32 = number;
type Float = number;

interface Grid{
  getWidth(): Int32;
  getHeight(): Int32;
}

export type Coordinate = {
  x: Int32;
  y: Int32;
}

export class GenericGrid2D<T> implements Grid{
  width: Int32;
  height: Int32;
  grid: (T | undefined)[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.grid = Array.from({length: this.width*this.height}, () => undefined);
  }
  isInside(x: Int32, y: Int32): boolean{
    const in_x = 0 <= x && x < this.width;
    const in_y = 0 <= y && y < this.height;
    return in_x && in_y;
  }
  getWidth(): Int32{
    return this.width;
  }
  getHeight(): Int32{
    return this.height;
  }
  setAll(t: T | undefined){
    this.grid = this.grid.fill(t);
  }
  private key(x: Int32, y: Int32){
    return y*this.width+x;
  }
  set(x: Int32, y: Int32, t: T): boolean{
    const key = this.key(x, y);
    if(key >= 0 && key < this.grid.length){
      this.grid[this.key(x, y)] = t;
      return true;
    }
    return false;
  }
  get(x: Int32, y: Int32): T | undefined{
    return this.grid[this.key(x, y)];
  }
  getCoord(i: Int32): Coordinate{
    return {x: i%this.width, y: Math.floor(i/this.width)};
  }
}

export class GenericGrid2DInterface<G extends Grid>{
  x: Float;
  y: Float;
  cell_size: Float;
  grid: G;
  constructor(x: Float, y: Float, sz: Float, grid: G){
    this.x = x;
    this.y = y;
    this.cell_size = sz;
    this.grid = grid;
  }
  interfaceWidth(): Int32{
    return this.cell_size*this.grid.getWidth();
  }
  interfaceHeight(): Int32{
    return this.cell_size*this.grid.getHeight();
  }
  isInside(point: WebGL.Matrix.Point2D): boolean{
    const in_x = this.x < point.x && point.x < this.x+this.interfaceWidth();
    const in_y = this.y < point.y && point.y < this.y+this.interfaceHeight();
    return in_x && in_y;
  }
  getCoord(point: WebGL.Matrix.Point2D): Coordinate{
    const x = Math.floor((point.x-this.x) / this.cell_size);
    const y = Math.floor((point.y-this.y) / this.cell_size);
    return {x, y}
  }
  generateModel(line_thickness: Int32, colour: WebGL.Colour.ColourRGB=WebGL.Colour.ColourUtils.white()): WebGL.BasicModel{
    const ht = line_thickness*0.5;
    const model = new WebGL.BasicModel();
    for(let x = 0; x <= this.grid.getWidth(); x++){
      const vertical_line = WebGL.WebGL.rectangleModel(
        this.x+x*this.cell_size-ht, 
        this.y, line_thickness, 
        this.interfaceHeight()
      );
      model.addPart({transformation: vertical_line, colour: colour});
    }
    for(let y = 0; y <= this.grid.getHeight(); y++){
      const horizontal_line = WebGL.WebGL.rectangleModel(
        this.x,
        this.y+y*this.cell_size-ht,
        this.interfaceWidth(),
        line_thickness
      );
      model.addPart({transformation: horizontal_line, colour: colour});
    }
    return model;
  }
  drawColourCoord(vp: WebGL.Matrix.TransformationMatrix3x3, shader: WebGL.Shader.MVPColourProgram, 
    coord: Coordinate, colour: WebGL.Colour.ColourRGB){
    const x = this.x+coord.x*this.cell_size;
    const y = this.y+coord.y*this.cell_size;
    WebGL.WebGL.drawColourRect(vp, shader, 
      x, y, this.cell_size, this.cell_size, colour
    );
  }
}