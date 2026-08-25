import * as WebGL from "../../WebGL/globals"

import Rotation = WebGL.Geometry.Rotation;
import Grid = WebGL.Grid.Generic;

type Int32 = number;

//shape made out of grid pieces
export class GridShape{
  private width: Int32;
  private height: Int32;
  private parts: boolean[];
  private coordinates: Grid.Coordinate[];

  constructor(w: Int32, h: Int32, parts?: boolean[]){
    this.width = w;
    this.height = h;
    this.parts = parts != undefined ? parts : Array.from({length: this.height*this.width}, () => false);
    this.coordinates = parts != undefined ? this.genCoordinates() : [];
  }
  getWidth(): Int32{
    return this.width;
  }
  getHeight(): Int32{
    return this.height;
  }
  getParts(): boolean[]{
    return this.parts;
  }
  getCoordinates(): Grid.Coordinate[]{
    return this.coordinates;
  }
  genCoordinates(): Grid.Coordinate[]{
    const coordinates = [];
    for(let x = 0; x < this.width; x++){
      for(let y = 0; y < this.height; y++){
        if(this.parts[this.getIndexKey(x, y)]){
          coordinates.push({x, y});
        }
      }
    }
    return coordinates;
  }
  addPart(x: Int32, y: Int32){
    const key = this.getIndexKey(x, y);
    if(!this.parts[key]){
      this.coordinates.push({x, y});
    }
    this.parts[key] = true;
  }
  private getIndexKey(x: Int32, y: Int32){
    return x+(y*this.width);
  }
  hasPartAt(x: Int32, y: Int32){
    return this.parts[this.getIndexKey(x, y)];
  }

  static equals(s1: GridShape, s2: GridShape){
    //todo
  }
}

export class GridShapeInstance{
  static current_id = 0;
  id: Int32;
  shape: GridShape;
  private rotation: Rotation.Rotation;
  width: Int32;
  height: Int32;
  grid_placement: Grid.Coordinate | undefined; // placement on grid
  constructor(shape: GridShape){
    this.id = GridShapeInstance.current_id;
    GridShapeInstance.current_id++;
    this.shape = shape;
    this.rotation = Rotation.RotationEnum.None;
    this.width = this.shape.getWidth();
    this.height = this.shape.getHeight();
  }
  copy(): GridShapeInstance{
    const newSI = new GridShapeInstance(this.shape);
    if(this.grid_placement != undefined){
      newSI.setPlacement(this.grid_placement.x, this.grid_placement.y);
    }
    newSI.setRotation(this.rotation);

    return newSI;
  }
  rotateClockwise(){
    const new_rot = Rotation.RotationUtil.clockwise(this.rotation);
    this.setRotation(new_rot);
  }
  rotateAntiClockwise(){
    const new_rot = Rotation.RotationUtil.anticlockwise(this.rotation);
    this.setRotation(new_rot);
  }
  setRotation(rotation: Rotation.Rotation){
    this.rotation = rotation;
    if(this.rotation == Rotation.RotationEnum.Left || this.rotation == Rotation.RotationEnum.Right){
      this.width = this.shape.getHeight();
      this.height = this.shape.getWidth();
    }else{
      this.width = this.shape.getWidth();
      this.height = this.shape.getHeight();
    }
  }
  isInside(x: Int32, y: Int32){
    const in_x = 0 <= x && x < this.width;
    const in_y = 0 <= y && y < this.height;
    return in_x && in_y;
  }
  getTrueCoord(x: Int32, y: Int32, rotation: Rotation.Rotation=Rotation.RotationEnum.None): {x: Int32, y: Int32}{
    switch(rotation){
      case Rotation.RotationEnum.Left:
        return {x: this.height-1-y, y: x};
      case Rotation.RotationEnum.Right:
        return {x: y, y: this.width-1-x};
      case Rotation.RotationEnum.Down:
        return {x: this.width-1-x, y: this.height-1-y};
    }
    return {x, y};
  }
  getIndexKey(x: Int32, y: Int32, rotation: Rotation.Rotation=Rotation.RotationEnum.None){
    switch(rotation){
      case Rotation.RotationEnum.Left:
        return (this.height-1-y) + x*this.height;
      case Rotation.RotationEnum.Right:
        return (y) + (this.width-1-x)*this.height;
      case Rotation.RotationEnum.Down:
        return (this.width-1-x) + (this.height-1-y)*this.width;
    }
    return x + y*this.width;
  }
  getPart(x: Int32, y: Int32): boolean | undefined{
    if(!this.isInside(x, y)) return undefined;
    const parts = this.shape.getParts()
    return parts[this.getIndexKey(x, y, this.rotation)];
  }
  getCoordinates(): Grid.Coordinate[]{
    const coordinates: Grid.Coordinate[] = [];
    if(this.grid_placement == undefined){
      return coordinates;
    }
    for(let y = 0; y < this.height; y++){
      for(let x = 0; x < this.width; x++){
        const part = this.getPart(x, y);
        if(part != undefined && part){
          coordinates.push({x: x+this.grid_placement.x, y: y+this.grid_placement.y})
        }
      }
    }
    return coordinates;
  }
  isPlaced(): boolean{
    return this.grid_placement != undefined;
  }
  setPlacement(x: Int32, y: Int32){
    this.grid_placement = {x, y};
  }
  displace(){
    this.grid_placement = undefined;
  }
  move(x: Int32, y: Int32){
    if(this.grid_placement != undefined){
      this.grid_placement.x += x;
      this.grid_placement.y += y;
    }
  }
}

