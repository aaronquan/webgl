import * as WebGL from "./../../WebGL/globals";
import * as Options from "./../../Interface/options";

type Int32 = number;
type Float = number;

class IdGrid{
  width: Int32;
  height: Int32;
  object_id: (Int32 | undefined)[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.object_id = Array.from({length: this.height*this.width}, () => undefined);
  }
}

class ShapeIdGrid extends IdGrid{
  isFree(x: Int32, y: Int32): boolean{
    return this.object_id[x+y*this.width] == undefined;
  }
  canFitShape(shape: GridShapeInstance, x: Int32, y: Int32): boolean{
    //test borders
    if(x < 0 || y < 0 || x+shape.width >= this.width || y+shape.height >= this.height){
      return false;
    }

    //test individual parts
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(x, y) && this.isFree(x+px, y+py) != undefined){
          return false;
        }
      }
    }
    return true;
  }
  addShape(shape: GridShapeInstance, x: Int32, y: Int32){

  }
}


export const RotationEnum = {
  None: 0,
  Clockwise: 1,
  Opposite: 2,
  AntiClockwise: 3
} as const;

export type Rotation = (typeof RotationEnum)[keyof typeof RotationEnum];

//shape made out of grid pieces
export class GridShape{
  width: Int32;
  height: Int32;
  parts: boolean[];

  constructor(w: Int32, h: Int32, parts?: boolean[]){
    this.width = w;
    this.height = h;
    this.parts = parts != undefined ? parts : Array.from({length: this.height*this.width}, () => false);
  }
  addPart(x: Int32, y: Int32){
    this.parts[this.getIndexKey(x, y)] = true;
  }
  private getIndexKey(x: Int32, y: Int32){
    return x+(y*this.width);
  }
  hasPartAt(x: Int32, y: Int32){
    return this.parts[this.getIndexKey(x, y)];
  }

  static equals(s1: GridShape, s2: GridShape){

  }
}

export class GridShapeInstance{
  static current_id = 0;
  id: Int32;
  shape: GridShape;
  private rotation: Rotation;
  width: Int32;
  height: Int32;
  constructor(shape: GridShape){
    this.id = GridShapeInstance.current_id;
    GridShapeInstance.current_id++;
    this.shape = shape;
    this.rotation = RotationEnum.None;
    this.width = this.shape.width;
    this.height = this.shape.height;
  }
  setRotation(rotation: Rotation){
    this.rotation = rotation;
    if(this.rotation == RotationEnum.Clockwise || this.rotation == RotationEnum.AntiClockwise){
      this.width = this.shape.height;
      this.height = this.shape.width;
    }else{
      this.width = this.shape.width;
      this.height = this.shape.height;
    }
  }
  isInside(x: Int32, y: Int32){
    const in_x = 0 <= x && x < this.width;
    const in_y = 0 <= y && y < this.height;
    return in_x && in_y;
  }
  getIndexKey(x: Int32, y: Int32, rotation: Rotation=RotationEnum.None){
    switch(rotation){
      case RotationEnum.AntiClockwise:
        return (this.height-1-y) + x*this.height;
      case RotationEnum.Clockwise:
        return (y) + (this.width-1-x)*this.height;
      case RotationEnum.Opposite:
        return (this.width-1-x) + (this.height-1-y)*this.width;
    }
    return x + y*this.width;
  }
  getPart(x: Int32, y: Int32): boolean | undefined{
    if(!this.isInside(x, y)) return undefined;
    return this.shape.parts[this.getIndexKey(x, y, this.rotation)];
  }
}


export class PuzzleEngine extends WebGL.App.BaseEngine{
  option_select: Options.DropdownOptions;
  mouse_point: WebGL.Matrix.Point2D | undefined;

  my_shapes: GridShape[]; 
  constructor(){
    super();
    this.option_select = new Options.DropdownOptions(100, 100, 150, 25, ["hello", "good", "bye"]);
    this.my_shapes = this.createShapes();
  }
  createShapes(): GridShape[]{
    const one = new GridShape(1, 1, [true]);
    const two = new GridShape(2, 1, [true, true]);
    const l = new GridShape(3, 2, [false, false, true, true, true, true]);
    const t = new GridShape(3, 2, [false, true, false, true, true, true]);
    return [one, two, l, t];
  }

  override handleKeyDown(ev: KeyboardEvent){};
  //to override
  override handleKeyUp(ev: KeyboardEvent){};
  //to override
  override handleMouseMove(ev: MouseEvent){
    const point = new WebGL.Matrix.Point2D(ev.clientX, ev.clientY);
    this.mouse_point = point;
    this.option_select.onMouseOver(point);
  };
  //to override
  override handleMouseDown(ev: MouseEvent){
    if(this.mouse_point != undefined){  
      this.option_select.onMouseDown(this.mouse_point);
    }
  };
  //to override
  override handleMouseUp(ev: MouseEvent){};
}