import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";
import { TetrisEngine } from "./tetris";
import { BattleEngine } from "./grid_battle";

type Int32 = number;
type Float = number;

import Button = WebGL.Interface.Button;
import Rotation = WebGL.Geometry.Rotation;
import Grid = WebGL.Grid.Generic;

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
  isInside(point: WebGL.Geometry.Base.Point2D): boolean{
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
  getCoord(point: WebGL.Geometry.Base.Point2D): Grid.Coordinate | undefined{
    if(!this.isInside(point)) return undefined;
    const x = Math.floor((point.x-this.x)/this.cell_size);
    const y = Math.floor((point.y-this.y)/this.cell_size);
    return {x, y};
  }
  trueCoord(point: WebGL.Geometry.Base.Point2D): WebGL.Geometry.Base.Point2D | undefined{
    if(this.isInside(point)){
      return undefined;
    }
    return new WebGL.Geometry.Base.Point2D((point.x-this.x)/this.cell_size, (point.y-this.y)/this.cell_size);
  }
}

export class ShapeIdGrid extends IdGrid{
  isFree(x: Int32, y: Int32): boolean{
    return this.object_id[x+y*this.width] == undefined;
  }
  canFitShape(shape: Shape.GridShapeInstance, x: Int32, y: Int32): boolean{
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
  addShape(shape: Shape.GridShapeInstance, x: Int32, y: Int32){
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py)){
          this.object_id[(x+px)+(y+py)*this.width] = shape.id;
        }
      }
    }
    shape.grid_placement = {x, y};
  }
  removeShape(shape: Shape.GridShapeInstance){
    console.log(shape);
    if(shape.grid_placement == undefined){
      return;
    }
    const x = shape.grid_placement.x;
    const y = shape.grid_placement.y;
    for(let py = 0; py < shape.height; py++){
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py)){
          this.object_id[(x+px)+(y+py)*this.width] = undefined;
        }
      }
    }
  }
}

/*
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
}*/


export class ShapeLabel extends WebGL.Interface.InterfaceElement.InterfaceElement{
  shape: Shape.GridShape;
  is_hovered: boolean;
  onSelect: ((shape: Shape.GridShape) => void) | undefined;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, shape: Shape.GridShape, on_select?: () => void){
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
  onMouseOver(point: WebGL.Geometry.Base.Point2D){
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
    let y = my-(cell_size*this.shape.getHeight()*0.5);
    const sx = mx-(cell_size*this.shape.getWidth()*0.5);
    let gx = sx;
    for(let py = 0; py < this.shape.getHeight(); py++){
      gx = sx;
      for(let px = 0; px < this.shape.getWidth(); px++){
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

type LayoutPosition = WebGL.Geometry.Base.Point2D;

export class GridLayout{
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
    return new WebGL.Geometry.Base.Point2D(this.start_x, this.start_y);
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
    return new WebGL.Geometry.Base.Point2D(next_x, next_y);
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
  setBattleFunction(f: VoidFunction){
    this.buttons.buttons[2].onPressed = f;
  }

  private addButtons(){
    const puzzle_button = new Button.BasicButton(5, 600, 100, 15, 10);
    puzzle_button.text = "Puzzle";
    this.buttons.addButton(puzzle_button);
    const tetris_button = new Button.BasicButton(5, 620, 100, 15, 10);
    tetris_button.text = "Tetris";
    this.buttons.addButton(tetris_button);
    const battle_button = new Button.BasicButton(5, 640, 100, 15, 10);
    battle_button.text = "Battle";
    this.buttons.addButton(battle_button);
  }

  onMouseMove(point: WebGL.Geometry.Base.Point2D){
      this.buttons.updateMouse(point);
    }
  onMouseDown(point: WebGL.Geometry.Base.Point2D){
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
  Tetris: 1,
  GridBattle: 2
} as const;

export type PuzzleAppletDisplay = (typeof PuzzleAppletDisplayEnum)[keyof typeof PuzzleAppletDisplayEnum];

export class PuzzleEngine extends WebGL.App.BaseEngine{
  option_select: WebGL.Interface.Options.DropdownOptions;
  mouse_point: WebGL.Geometry.Base.Point2D | undefined;

  my_shapes: Shape.GridShape[]; 

  shape_label_layout: GridLayout;
  shape_labels: ShapeLabel[];

  dragged_shape: Shape.GridShapeInstance | undefined;

  grid: ShapeIdGrid;
  interface_grid: ShapeGridInterface;

  hovered_grid_coord: Coord | undefined;
  mouse_grid_point: WebGL.Geometry.Base.Point2D | undefined;

  pieces_on_grid: Map<Int32, Shape.GridShapeInstance>;

  preview_positions: Coord[];


  tetris: TetrisEngine;
  interface: PuzzleInterface;
  grid_battle: BattleEngine;

  applet_display: PuzzleAppletDisplay;

  time: Float;

  latest_snapshot: ImageData | undefined;
  canvas: HTMLCanvasElement | undefined;

  constructor(){
    super();
    this.time = 0;
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
    this.grid_battle = new BattleEngine();

    this.applet_display = PuzzleAppletDisplayEnum.GridBattle;

    this.interface.setPuzzleFunction(() => {
      this.applet_display = PuzzleAppletDisplayEnum.Puzzle;
    })
    this.interface.setTetrisFunction(() => {
      this.applet_display = PuzzleAppletDisplayEnum.Tetris;
    });
    this.interface.setBattleFunction(() => {
      this.applet_display = PuzzleAppletDisplayEnum.GridBattle;
    });
  }
  addCanvas(c: HTMLCanvasElement){
    this.canvas = c;
  }
  update(t: Float){
    const dt = t-this.time;
    if(this.applet_display == PuzzleAppletDisplayEnum.Tetris){
      this.tetris.update(dt);
    }
    this.time = t;
  } 
  createShapes(): Shape.GridShape[]{
    const one = new Shape.GridShape(1, 1, [true]);
    const two = new Shape.GridShape(2, 1, [true, true]);
    const l = new Shape.GridShape(3, 2, [false, false, true, true, true, true]);
    const t = new Shape.GridShape(3, 2, [false, true, false, true, true, true]);
    return [one, two, l, t];
  }

  getInstanceCoord(point: WebGL.Geometry.Base.Point2D, instance: Shape.GridShapeInstance): Coord{
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

  snapshotCanvas(){
    if(this.canvas == undefined){
      console.log("Canvas is undefined");
    }
    
  }

  override handleKeyDown(ev: KeyboardEvent){
    this.tetris.onKeyDown(ev);
    switch(ev.key){
      case "`":
        //snapshot of screen to texture
        //
        break;
    }
  };
  //to override
  override handleKeyUp(ev: KeyboardEvent){};
  //to override
  override handleMouseMove(ev: MouseEvent){
    const point = new WebGL.Geometry.Base.Point2D(ev.clientX, ev.clientY);
    if(this.applet_display == PuzzleAppletDisplayEnum.Puzzle){
      for(const label of this.shape_labels){
        label.onMouseOver(point);
      }
      this.hovered_grid_coord = this.interface_grid.getCoord(point);
      this.mouse_grid_point = this.interface_grid.trueCoord(point);
      this.option_select.onMouseDown(point); // select applet display
      this.refreshPreviewPositions();
    }
    else if(this.applet_display == PuzzleAppletDisplayEnum.Tetris){
      this.tetris.onMouseMove(point);
    }else if(this.applet_display == PuzzleAppletDisplayEnum.GridBattle){
      this.grid_battle.onMouseMove(point);
    }


    this.mouse_point = point;
    this.interface.onMouseMove(point);// select applet display

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
      this.interface.onMouseDown(this.mouse_point);// select applet display

      if(this.applet_display == PuzzleAppletDisplayEnum.Puzzle){
        this.option_select.onMouseDown(this.mouse_point); // select applet display
        const hov_id = this.getHoveredShapeId();
        if(hov_id != undefined){
          this.grid.removeShape(this.pieces_on_grid.get(hov_id)!);
          this.dragged_shape = this.pieces_on_grid.get(hov_id);
        }
        for(let i = 0; i < this.shape_labels.length; i++){
          const label = this.shape_labels[i];
          label.onMouseDown();
          if(label.is_hovered){
            this.dragged_shape = new Shape.GridShapeInstance(label.shape);
          }
        }
      }
      else if(this.applet_display == PuzzleAppletDisplayEnum.Tetris){
        this.tetris.onMouseDown(this.mouse_point);
      }else if(this.applet_display == PuzzleAppletDisplayEnum.GridBattle){
        this.grid_battle.onMouseDown(this.mouse_point);
      }
    }
  };
  //to override
  override handleMouseUp(ev: MouseEvent){
    if(this.mouse_point != undefined){ 
      if(this.applet_display == PuzzleAppletDisplayEnum.Puzzle){
        if(this.dragged_shape != undefined && this.mouse_grid_point != undefined){
          const coord = this.getInstanceCoord(this.mouse_grid_point, this.dragged_shape);
          if(this.grid.canFitShape(this.dragged_shape, coord.x, coord.y)){
            this.grid.addShape(this.dragged_shape, coord.x, coord.y);
            this.pieces_on_grid.set(this.dragged_shape.id, this.dragged_shape);
          }else{
            console.log("no room for shape");
          }
          this.dragged_shape = undefined;
        }
      }
      else if(this.applet_display == PuzzleAppletDisplayEnum.Tetris){
        this.tetris.onMouseUp(this.mouse_point);
      }
    }

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