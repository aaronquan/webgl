import * as WebGL from "../../WebGL/globals";
import * as GShape from "./shape";

//WebGL.Grid.Generic.Grid2DInterface

import Grid = WebGL.Grid.Generic;
import Rotation = WebGL.Geometry.Rotation;
import { circle } from "../../WebGL/Shaders/Fragment/Source/fragment_source";

//todos: allow rotation on edges with push room (mostly right edge)

type Int32 = number;
type Float = number;

class TetrisGrid extends Grid.GenericGrid2D<Int32>{
  isCompleteRow(y: Int32): boolean{
    if(!this.isInside(0, y)){
      return false;
    }
    for(let x = 0; x < this.width; x++){
      if(this.get(x, y) == undefined){
        return false;
      } 
    }
    return true;
  }
  findCompleteRows(): Int32[]{
    const rows = [];
    for(let y = 0; y < this.height; y++){
      if(this.isCompleteRow(y)){
        rows.push(y);
      }
    }
    return rows;
  }
  deleteRowAndMoveDown(row: Int32){
    for(let y = row; y > 0; y--){
      for(let x = 0; x < this.width; x++){
        this.set(x, y, this.get(x, y-1)!);
      }
    }
  }
  canFitShapeDrop(shape: GShape.GridShapeInstance):boolean{
    for(const coord of shape.getCoordinates()){
      if(this.isInside(coord.x, coord.y)){
        if(this.get(coord.x, coord.y) != undefined){
          return false;
        }
      }
    }
    return true;
  }
  canFitShapeInstance(shape: GShape.GridShapeInstance):boolean{
    for(const coord of shape.getCoordinates()){
      if(this.isInside(coord.x, coord.y)){
        if(this.get(coord.x, coord.y) != undefined){
          return false;
        }
      }else{
        return false;
      }
    }
    return true;
  }
  addShape(x: Int32, y: Int32, shape: TetrisInstance){
    for(const coord of shape.getCoordinates()){
      if(this.isInside(coord.x+x, coord.y+y)){
        this.set(coord.x+x, coord.y+y, shape.shape_id);
      }
    }
  }
  addShapeInstance(shape: TetrisInstance){
    for(const coord of shape.getCoordinates()){
      if(this.isInside(coord.x, coord.y)){
        this.set(coord.x, coord.y, shape.shape_id);
      }
    }
  }
  checkBottomCoordinates(coords: Grid.Coordinate[]): boolean{
    for(const coord of coords){
      if(this.height <= coord.y+1 || this.get(coord.x, coord.y+1) != undefined){
        return true;
      } 
    }
    return false;
  }
  checkLeftCoordinates(coords: Grid.Coordinate[]): boolean{
    for(const coord of coords){
      if(0 == coord.x || this.get(coord.x-1, coord.y) != undefined){
        return true;
      } 
    }
    return false;
  }
  checkRightCoordinates(coords: Grid.Coordinate[]): boolean{
    for(const coord of coords){
      if(coord.x+1 >= this.width || this.get(coord.x+1, coord.y) != undefined){
        return true;
      } 
    }
    return false;
  }
}

class TetrisInstance extends GShape.GridShapeInstance{
  shape_id: Int32;
  constructor(shape: GShape.GridShape, sid: Int32){
    super(shape);
    this.shape_id = sid;
  }
  getBottomCoordinates(): Grid.Coordinate[]{
    const coords: Grid.Coordinate[] = [];
    if(this.placement == undefined){
      return coords;
    }
    for(let x = 0; x < this.width; x++){
      for(let y = this.height-1; y >= 0; y--){
        if(this.getPart(x, y)){
          coords.push({x: x+this.placement.x, y: y+this.placement.y});
          break;
        }
      }
    }
    return coords;
  }
  getLeftCoordinates(): Grid.Coordinate[]{
    const coords: Grid.Coordinate[] = [];
    if(this.placement == undefined){
      return coords;
    }
    for(let y = 0; y < this.height; y++){
      for(let x = 0; x < this.width; x++){
        if(this.getPart(x, y)){
          coords.push({x: x+this.placement.x, y: y+this.placement.y});
          break;
        }
      }
    }
    return coords;
  }
  getRightCoordinates(): Grid.Coordinate[]{
    const coords: Grid.Coordinate[] = [];
    if(this.placement == undefined){
      return coords;
    }
    for(let y = 0; y < this.height; y++){
      for(let x = this.width-1; x >=0; x--){
        if(this.getPart(x, y)){
          coords.push({x: x+this.placement.x, y: y+this.placement.y});
          break;
        }
      }
    }
    return coords;
  }
}

export const TetrisGameStateEnum = {
  Setup: 0,
  Playing: 1,
  End: 2
} as const;

type TetrisGameState = (typeof TetrisGameStateEnum)[keyof typeof TetrisGameStateEnum];

export class TetrisEngine{
  game_state: TetrisGameState;
  grid: TetrisGrid;

  grid_interface:  Grid.GenericGrid2DInterface<Grid.GenericGrid2D<Int32>>;
  active_piece: TetrisInstance | undefined;
  shapes: GShape.GridShape[];

  drop_time: Float;
  drop_current: Float;

  play_button: WebGL.Interface.Button.BasicButton;

  constructor(){
    this.game_state = TetrisGameStateEnum.Setup;
    this.grid = new TetrisGrid(10, 20);
    this.grid_interface = new Grid.GenericGrid2DInterface(50, 50, 20, this.grid);
    this.shapes = this.generateShapes();

    //this.grid.addShape(0, 9, this.shapes[0]);
    //console.log(this.grid.grid);

    this.drop_time = 200;
    this.drop_current = 0;

    this.play_button = new WebGL.Interface.Button.BasicButton(100, 200, 100, 20, 16);
    this.play_button.text = "Play";
    this.play_button.onPressed = () => {
      this.game_state = TetrisGameStateEnum.Playing;
      this.grid.setAll(undefined);
    }

  }
  onKeyDown(ev: KeyboardEvent){
    if(ev.key == 'a'){
      this.activeMoveLeft();
    }else if(ev.key == 'd'){
      this.activeMoveRight();
    }else if(ev.key == 'e'){
      this.rotateActivePiece(false);
    }else if(ev.key == 'r'){
      this.rotateActivePiece()
    }
  }
  onMouseMove(point: WebGL.Geometry.Base.Point2D){
    this.play_button.onMouseMove(point);
  }
  onMouseDown(point: WebGL.Geometry.Base.Point2D){
    this.play_button.onMouseDown();
  }
  onMouseUp(point: WebGL.Geometry.Base.Point2D){
    this.play_button.onMouseUp();
  }

  update(dt: Float){
    if(this.game_state == TetrisGameStateEnum.Playing){
      this.drop_current += dt;
      if(this.drop_current >= this.drop_time){
        this.activeDrop();
        this.drop_current = 0;
      }
    }
  }

  rotateActivePiece(clockwise: boolean=true){
    if(this.active_piece != undefined){
      const test_piece = this.active_piece.copy();
      if(clockwise){
        test_piece.rotateClockwise();
      }else{
        test_piece.rotateAntiClockwise();
      }
      if(this.grid.canFitShapeInstance(test_piece)){
        if(clockwise){
          this.active_piece.rotateClockwise();
        }else{
          this.active_piece.rotateAntiClockwise();
        }
      }
    }
  }

  private randomShape(): GShape.GridShape{
    const i = Math.floor(Math.random()*this.shapes.length);
    return this.shapes[i];
  }

  private newActivePiece(): TetrisInstance{
    const i = Math.floor(Math.random()*this.shapes.length);
    const piece = this.shapes[i];
    const ti = new TetrisInstance(piece, i);
    ti.setPlacement(Math.floor(this.grid.getWidth()/2), 1-piece.getHeight());
    return ti
  }
  activeMoveLeft(){
    if(this.active_piece == undefined){
      return;
    }
    const left_coords = this.active_piece.getLeftCoordinates();
    if(!this.grid.checkLeftCoordinates(left_coords)){
      this.active_piece.move(-1, 0);
    }else{

    }
  }
  activeMoveRight(){
    if(this.active_piece == undefined){
      return;
    }
    const right_coords = this.active_piece.getRightCoordinates();
    console.log(right_coords);
    if(!this.grid.checkRightCoordinates(right_coords)){
      this.active_piece.move(1, 0);
    }else{

    }
  }

  private placePiece(piece: GShape.GridShapeInstance){
    const active_piece = this.active_piece!
    this.grid.addShapeInstance(active_piece);
    this.active_piece = undefined;

    const rows = this.grid.findCompleteRows();
    console.log(rows);
    for(const row of rows){
      this.grid.deleteRowAndMoveDown(row);
    }
  }

  activeDrop(){
    if(this.active_piece != undefined){
      const bottom_coords = this.active_piece.getBottomCoordinates();
      if(this.grid.checkBottomCoordinates(bottom_coords) && this.active_piece.placement != undefined){
        this.placePiece(this.active_piece);
      }else{
        this.active_piece.move(0, 1);
      }
      
    }else{
      this.active_piece = this.newActivePiece();
      if(!this.grid.canFitShapeDrop(this.active_piece)){
        this.game_state = TetrisGameStateEnum.Setup;
      }
    }
  }

  private generateShapes(): GShape.GridShape[]{
    const shapes: GShape.GridShape[] = [];
    const i_piece = new GShape.GridShape(1, 4, [true, true, true, true]);
    shapes.push(i_piece);
    const t_piece = new GShape.GridShape(2, 3, [true, false, true, true, true, false]);
    shapes.push(t_piece);
    const l_piece = new GShape.GridShape(2, 3, [true, false, true, false, true, true]);
    shapes.push(l_piece);
    const j_piece = new GShape.GridShape(2, 3, [false, true, false, true, true, true]);
    shapes.push(j_piece);
    const o_piece = new GShape.GridShape(2, 2, [true, true, true, true]);
    shapes.push(o_piece);
    const s_piece = new GShape.GridShape(3, 2, [false, true, true, true, true, false]);
    shapes.push(s_piece);
    const z_piece = new GShape.GridShape(3, 2, [true, true, false, false, true, true]);
    shapes.push(z_piece);
    return shapes;
  }
}
