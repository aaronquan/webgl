import * as WebGL from "./../../WebGL/globals";
import { TetrisEngine } from "./tetris";

type Int32 = number;
type Float = number;

import Button = WebGL.Interface.Button;

class IdGrid{
  width: Int32;
  height: Int32;
  object_id: (Int32 | undefined)[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.object_id = Array.from({length: this.height*this.width}, () => undefined);
  }
  getId(x: Int32, y: Int32) : (Int32 | undefined){
    return this.object_id[x + y*this.width];
  }
}

export class ShapeGridInterface{
  x: Int32;
  y: Int32;
  cell_size: Int32;
  grid: ShapeIdGrid;
  constructor(x: Int32, y: Int32, size: Int32, grid: ShapeIdGrid){
    this.x = x;
    this.y = y;
    this.cell_size = size;
    this.grid = grid;
  }
  isInside(point: WebGL.Matrix.Point2D): boolean{
    const in_x = this.x < point.x && point.x < this.x+this.interfaceWidth();
    const in_y = this.y < point.y && point.y < this.y+this.interfaceHeight();
    return in_x && in_y;
  }
  interfaceWidth(): Int32{
    return this.cell_size*this.grid.width;
  }
  interfaceHeight(): Int32{
    return this.cell_size*this.grid.height;
  }
  getCoord(point: WebGL.Matrix.Point2D): Coord | undefined{
    if(!this.isInside(point)) return undefined;
    const x = Math.floor((point.x-this.x)/this.cell_size);
    const y = Math.floor((point.y-this.y)/this.cell_size);
    return {x, y};
  }
  trueCoord(point: WebGL.Matrix.Point2D): WebGL.Matrix.Point2D | undefined{
    return new WebGL.Matrix.Point2D((point.x-this.x)/this.cell_size, (point.y-this.y)/this.cell_size);
  }
}

class ShapeIdGrid extends IdGrid{
  isFree(x: Int32, y: Int32): boolean{
    return this.object_id[x+y*this.width] == undefined;
  }
  canFitShape(shape: GridShapeInstance, x: Int32, y: Int32): boolean{
    //test borders
    if(x < 0 || y < 0 || x+shape.width > this.width || y+shape.height > this.height){
      return false;
    }

    //test individual parts
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py) && !this.isFree(x+px, y+py)){
          return false;
        }
      }
    }
    return true;
  }
  addShape(shape: GridShapeInstance, x: Int32, y: Int32){
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py)){
          this.object_id[(x+px)+(y+py)*this.width] = shape.id;
        }
      }
    }
    shape.placement = {x, y};
  }
  removeShape(shape: GridShapeInstance){
    console.log(shape);
    if(shape.placement == undefined){
      return;
    }
    const x = shape.placement.x;
    const y = shape.placement.y;
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py)){
          this.object_id[(x+px)+(y+py)*this.width] = undefined;
        }
      }
    }
  }
}


export const RotationEnum = {
  None: 0,
  Right: 1,
  Down: 2,
  Left: 3
} as const;

export type Rotation = (typeof RotationEnum)[keyof typeof RotationEnum];

class RotationUtil{
  static clockwise(rot: Rotation): Rotation{
    switch(rot){
      case RotationEnum.None:
        return RotationEnum.Right;
      case RotationEnum.Right:
        return RotationEnum.Down;
      case RotationEnum.Down:
        return RotationEnum.Left;
      case RotationEnum.Left: 
        return RotationEnum.None;
    }
  }
  static anticlockwise(rot: Rotation): Rotation{
    switch(rot){
      case RotationEnum.None:
        return RotationEnum.Left;
      case RotationEnum.Left:
        return RotationEnum.Down;
      case RotationEnum.Down:
        return RotationEnum.Right;
      case RotationEnum.Right: 
        return RotationEnum.None;
    }
  }
}

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
  placement: Coord | undefined;
  constructor(shape: GridShape){
    this.id = GridShapeInstance.current_id;
    GridShapeInstance.current_id++;
    this.shape = shape;
    this.rotation = RotationEnum.None;
    this.width = this.shape.width;
    this.height = this.shape.height;
  }
  rotateClockwise(){
    const new_rot = RotationUtil.clockwise(this.rotation);
    this.setRotation(new_rot);
  }
  rotateAntiClockwise(){
    const new_rot = RotationUtil.anticlockwise(this.rotation);
    this.setRotation(new_rot);
  }
  setRotation(rotation: Rotation){
    this.rotation = rotation;
    if(this.rotation == RotationEnum.Left || this.rotation == RotationEnum.Right){
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
  getTrueCoord(x: Int32, y: Int32, rotation: Rotation=RotationEnum.None): {x: Int32, y: Int32}{
    switch(rotation){
      case RotationEnum.Left:
        return {x: this.height-1-y, y: x};
      case RotationEnum.Right:
        return {x: y, y: this.width-1-x};
      case RotationEnum.Down:
        return {x: this.width-1-x, y: this.height-1-y};
    }
    return {x, y};
  }
  getIndexKey(x: Int32, y: Int32, rotation: Rotation=RotationEnum.None){
    switch(rotation){
      case RotationEnum.Left:
        return (this.height-1-y) + x*this.height;
      case RotationEnum.Right:
        return (y) + (this.width-1-x)*this.height;
      case RotationEnum.Down:
        return (this.width-1-x) + (this.height-1-y)*this.width;
    }
    return x + y*this.width;
  }
  getPart(x: Int32, y: Int32): boolean | undefined{
    if(!this.isInside(x, y)) return undefined;
    return this.shape.parts[this.getIndexKey(x, y, this.rotation)];
  }
  isPlaced(): boolean{
    return this.placement != undefined;
  }
  place(x: Int32, y: Int32){
    this.placement = {x, y};
  }
}


export class ShapeLabel extends WebGL.Interface.InterfaceElement.InterfaceElement{
  shape: GridShape;
  is_hovered: boolean;
  onSelect: ((shape: GridShape) => void) | undefined;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, shape: GridShape, on_select?: () => void){
    super(x, y, width, height);
    this.shape = shape;
    this.is_hovered = false;
    this.onSelect = on_select;
  }
  onMouseDown(){
    if(this.is_hovered){
      if(this.onSelect) this.onSelect(this.shape);
    }
  }
  onMouseOver(point: WebGL.Matrix.Point2D){
    this.is_hovered = this.isInside(point);
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram){
    const bg = this.is_hovered ? WebGL.Colour.ColourUtils.blue() : WebGL.Colour.ColourUtils.red();
    this.drawBackground(vp, colour_shader, bg);
    const green = WebGL.Colour.ColourUtils.green();

    //draw shape
    const mx = this.x+(this.width*0.5);
    const my = this.y+(this.height*0.5);
    const cell_size = 24;
    const rect_size = 20;
    const clear_border = (cell_size-rect_size)*0.5;
    let y = my-(cell_size*this.shape.height*0.5);
    const sx = mx-(cell_size*this.shape.width*0.5);
    let gx = sx;
    for(let py = 0; py < this.shape.height; py++){
      gx = sx;
      for(let px = 0; px < this.shape.width; px++){
        if(this.shape.hasPartAt(px, py)){
          WebGL.WebGL.drawColourRect(vp, colour_shader, 
            gx+clear_border, y+clear_border, 
            rect_size, rect_size, green);
        }
        gx += cell_size;
      }
      y += cell_size;
    }
    //WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, )
  }
}

type LayoutPosition = WebGL.Matrix.Point2D;

class GridLayout{
  start_x: Int32;
  start_y: Int32;
  cell_width: Int32;
  cell_height: Int32;
  layout_width: Int32;
  layout_height: Int32;
  constructor(start_x: Int32, start_y: Int32, 
    cell_width: Int32, cell_height: Int32, 
    layout_width: Int32, layout_height: Int32){
    this.start_x = start_x;
    this.start_y = start_y;
    this.cell_width = cell_width;
    this.cell_height = cell_height;
    this.layout_width = layout_width;
    this.layout_height = layout_height;
  }
  firstPosition(): LayoutPosition{
    return new WebGL.Matrix.Point2D(this.start_x, this.start_y);
  }
  next(position: LayoutPosition): LayoutPosition | undefined{
    let next_x = position.x + this.cell_width;
    let next_y = position.y;
    if(next_x > this.start_x + this.layout_width){
      next_y = position.y + this.cell_height;
      if(next_y > this.start_y + this.layout_height){
        return undefined;
      }
    }
    return new WebGL.Matrix.Point2D(next_x, next_y);
  }
}
type Coord = {
  x: Int32,
  y: Int32
}

export class PuzzleInterface{
  buttons: Button.ButtonSet;
  constructor(){
    this.buttons = new Button.ButtonSet();
    this.addButtons();
  }
  setPuzzleFunction(f: VoidFunction){
    this.buttons.buttons[0].onPressed = f;
  }
  setTetrisFunction(f: VoidFunction){
    this.buttons.buttons[1].onPressed = f;
  }

  private addButtons(){
    const puzzle_button = new Button.BasicButton(5, 600, 100, 15, 10);
    puzzle_button.text = "Puzzle";
    this.buttons.addButton(puzzle_button);
    const tetris_button = new Button.BasicButton(5, 620, 100, 15, 10);
    tetris_button.text = "Tetris";
    this.buttons.addButton(tetris_button);
  }

  onMouseMove(point: WebGL.Matrix.Point2D){
      this.buttons.updateMouse(point);
    }
  onMouseDown(point: WebGL.Matrix.Point2D){
    this.buttons.mouseDown();
  }
  onMouseUp(){
    this.buttons.mouseUp();
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer){
    this.buttons.draw(vp, colour_shader, text_drawer);
  }
}

export const PuzzleAppletDisplayEnum = {
  Puzzle: 0,
  Tetris: 1
} as const;

export type PuzzleAppletDisplay = (typeof PuzzleAppletDisplayEnum)[keyof typeof PuzzleAppletDisplayEnum];

export class PuzzleEngine extends WebGL.App.BaseEngine{
  option_select: WebGL.Interface.Options.DropdownOptions;
  mouse_point: WebGL.Matrix.Point2D | undefined;

  my_shapes: GridShape[]; 

  shape_label_layout: GridLayout;
  shape_labels: ShapeLabel[];

  dragged_shape: GridShapeInstance | undefined;

  grid: ShapeIdGrid;
  interface_grid: ShapeGridInterface;

  hovered_grid_coord: Coord | undefined;
  mouse_grid_point: WebGL.Matrix.Point2D | undefined;

  pieces_on_grid: Map<Int32, GridShapeInstance>;

  preview_positions: Coord[];


  tetris: TetrisEngine;
  interface: PuzzleInterface;

  applet_display: PuzzleAppletDisplay;

  constructor(){
    super();
    this.option_select = new WebGL.Interface.Options.DropdownOptions(100, 100, 150, 25, ["hello", "good", "bye"]);
    this.my_shapes = this.createShapes();

    this.shape_label_layout = new GridLayout(100, 100, 120, 80, 500, 500);
    this.shape_labels = [];

    let position: LayoutPosition | undefined = this.shape_label_layout.firstPosition();
    for(const shape of this.my_shapes){
      if(position == undefined) break;
      const label = new ShapeLabel(position.x, position.y, 
        this.shape_label_layout.cell_width, 
        this.shape_label_layout.cell_height,
        shape
      );
      this.shape_labels.push(label);
      position = this.shape_label_layout.next(position);
    }

    this.grid = new ShapeIdGrid(10, 10);
    this.interface_grid = new ShapeGridInterface(100, 250, 50, this.grid);
    this.hovered_grid_coord = undefined;
    this.mouse_grid_point = undefined;

    this.pieces_on_grid = new Map();
    this.preview_positions = [];

    this.tetris = new TetrisEngine();
    this.interface = new PuzzleInterface();
    this.applet_display = PuzzleAppletDisplayEnum.Puzzle;

    this.interface.setPuzzleFunction(() => {
      this.applet_display = PuzzleAppletDisplayEnum.Puzzle;
    })
    this.interface.setTetrisFunction(() => {
      this.applet_display = PuzzleAppletDisplayEnum.Tetris;
    })
  }
  createShapes(): GridShape[]{
    const one = new GridShape(1, 1, [true]);
    const two = new GridShape(2, 1, [true, true]);
    const l = new GridShape(3, 2, [false, false, true, true, true, true]);
    const t = new GridShape(3, 2, [false, true, false, true, true, true]);
    return [one, two, l, t];
  }

  getInstanceCoord(point: WebGL.Matrix.Point2D, instance: GridShapeInstance): Coord{
    const px = point.x - (instance.width*0.5 - 0.5);
    const py = point.y - (instance.height*0.5 - 0.5);
    const x = Math.floor(px);
    const y = Math.floor(py);
    return {x, y};
  }

  isInPositionPreview(x: Int32, y: Int32): boolean{
    for(const coord of this.preview_positions){
      if(coord.x == x && coord.y == y){
        return true;
      }
    }
    return false;
  }

  refreshPreviewPositions(){
    this.preview_positions = [];
    if(this.dragged_shape != undefined && this.mouse_grid_point != undefined){
      const coord = this.getInstanceCoord(this.mouse_grid_point, this.dragged_shape);
      this.preview_positions = [];
      for(let py = 0; py < this.dragged_shape.height; py++){
        for(let px = 0; px < this.dragged_shape.width; px++){
          if(this.dragged_shape.getPart(px, py)){
            this.preview_positions.push({x: coord.x+px, y: coord.y+py});
          }
        }
      }
    }
  }

  getHoveredShapeId(){
    if(this.hovered_grid_coord == undefined){
      return undefined;
    }
    return this.grid.getId(this.hovered_grid_coord.x, this.hovered_grid_coord.y);
  }

  override handleKeyDown(ev: KeyboardEvent){};
  //to override
  override handleKeyUp(ev: KeyboardEvent){};
  //to override
  override handleMouseMove(ev: MouseEvent){
    const point = new WebGL.Matrix.Point2D(ev.clientX, ev.clientY);
    this.mouse_point = point;
    this.option_select.onMouseOver(point);
    for(const label of this.shape_labels){
      label.onMouseOver(point);
    }
    this.hovered_grid_coord = this.interface_grid.getCoord(point);
    this.mouse_grid_point = this.interface_grid.trueCoord(this.mouse_point);
    this.refreshPreviewPositions();
    this.interface.onMouseMove(this.mouse_point);
    /*
    if(this.dragged_shape != undefined && this.mouse_grid_point != undefined){
      const coord = this.getInstanceCoord(this.mouse_grid_point, this.dragged_shape);
      this.preview_positions = [];
      for(let py = 0; py < this.dragged_shape.height; py++){
        for(let px = 0; px < this.dragged_shape.width; px++){
          if(this.dragged_shape.getPart(px, py)){
            this.preview_positions.push({x: coord.x+px, y: coord.y+py});
          }
        }
      }
    }else{
      this.preview_positions = [];
    }*/
  };
  //to override
  override handleMouseDown(ev: MouseEvent){
    if(this.mouse_point != undefined){  
      this.option_select.onMouseDown(this.mouse_point);
      this.interface.onMouseDown(this.mouse_point);
    }
    const hov_id = this.getHoveredShapeId();
    if(hov_id != undefined){
      this.grid.removeShape(this.pieces_on_grid.get(hov_id)!);
      this.dragged_shape = this.pieces_on_grid.get(hov_id);
    }
    for(let i = 0; i < this.shape_labels.length; i++){
      const label = this.shape_labels[i];
      label.onMouseDown();
      if(label.is_hovered){
        this.dragged_shape = new GridShapeInstance(label.shape);
      }
    }
  };
  //to override
  override handleMouseUp(ev: MouseEvent){
    if(this.mouse_point != undefined){ 
      //const true_coord = this.interface_grid.trueCoord(this.mouse_point);
      if(this.dragged_shape != undefined && this.mouse_grid_point != undefined){
        const coord = this.getInstanceCoord(this.mouse_grid_point, this.dragged_shape);
        if(this.grid.canFitShape(this.dragged_shape, coord.x, coord.y)){
          this.grid.addShape(this.dragged_shape, coord.x, coord.y);
          this.pieces_on_grid.set(this.dragged_shape.id, this.dragged_shape);
        }else{
          console.log("no room for shape");
        }
      }
    }

    this.dragged_shape = undefined;
    this.interface.onMouseUp();
  };
  // to override
  protected override handleScrollWheel(ev: WheelEvent){
    if(this.dragged_shape != undefined){
      if(ev.deltaY > 0){
        this.dragged_shape.rotateClockwise();
      }else if(ev.deltaY < 0){
        this.dragged_shape.rotateAntiClockwise();
      }
      this.refreshPreviewPositions();
    }
  }
}