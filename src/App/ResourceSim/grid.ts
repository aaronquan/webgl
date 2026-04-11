import * as Matrix from "../../WebGL/Matrix/matrix";
import * as ArrayUtils from "../../utils/array";
import * as PQ from "@datastructures-js/priority-queue"

type Int32 = number;
type Float = number;

export class GridPosition{
  x: Int32; 
  y: Int32;
  constructor(x:Int32, y:Int32){
    this.x = x;
    this.y = y;
  }
  addCopy(gp: GridPosition): GridPosition{
    return new GridPosition(this.x+gp.x, this.y+gp.y);
  }
  copy(): GridPosition{
    return new GridPosition(this.x, this.y);
  }
  equals(gp: GridPosition): boolean{
    return this.x == gp.x && this.y == gp.y;
  }

  static manhattanDistance(p1: GridPosition, p2: GridPosition): Int32{
    return Math.abs(p1.x-p2.x) + Math.abs(p1.y-p2.y);
  }
  static euclidianDistanceSquared(p1: GridPosition, p2: GridPosition): Int32{
    const dx = Math.abs(p1.x-p2.x);
    const dy = Math.abs(p1.y-p2.y);
    return dx*dx+dy*dy;
  }
  static euclidianDistance(p1: GridPosition, p2: GridPosition): Float{
    return Math.sqrt(this.euclidianDistanceSquared(p1, p2));
  }

  static testEuclidianDistance(limit: Float){
    type GridEucildianCompare = {
      position: GridPosition;
      distance_squared: Float;
    };
    const limit_sq = limit*limit;
    const pq = new PQ.PriorityQueue((a:GridEucildianCompare,b:GridEucildianCompare) => a.distance_squared-b.distance_squared);
    
    const p0 = new GridPosition(0, 0);
    pq.enqueue({position: p0, distance_squared: this.euclidianDistanceSquared(p0, p0)});
    const comps = [];

    type PositionsAtDistance = {
      positions: GridPosition[];
      distance_squared: Float;
    }
    const positions_at_distance:PositionsAtDistance[] = [];


    while(!pq.isEmpty()){
      const top = pq.dequeue()!;
      const pos = top.position.copy();

      const positions: GridPosition[] = [];
      if(pos.x == 0 && pos.y == 0){
        positions.push(new GridPosition(pos.x, pos.y));
      }/*else if(pos.x == 0){
        positions.push(new GridPosition(pos.x, pos.y));
        positions.push(new GridPosition(pos.x, -pos.y));
      }*/else if(pos.y == 0){
        positions.push(new GridPosition(pos.x, 0));
        positions.push(new GridPosition(-pos.x, 0));
        positions.push(new GridPosition(0, pos.x));
        positions.push(new GridPosition(0, -pos.x));
      }else{
        positions.push(new GridPosition(pos.x, pos.y));
        positions.push(new GridPosition(-pos.x, pos.y));
        positions.push(new GridPosition(pos.x, -pos.y));
        positions.push(new GridPosition(-pos.x, -pos.y));
      }

      console.log(pos);
      console.log(top.distance_squared);
      comps.push({position: new GridPosition(pos.x, pos.y), distance_squared: top.distance_squared});
      comps.push({position: new GridPosition(-pos.x, pos.y), distance_squared: top.distance_squared});
      comps.push({position: new GridPosition(pos.x, -pos.y), distance_squared: top.distance_squared});
      comps.push({position: new GridPosition(-pos.x, -pos.y), distance_squared: top.distance_squared});

      const posx = new GridPosition(pos.x+1, pos.y);
      const dsx = this.euclidianDistanceSquared(p0, posx);
      if(dsx <= limit_sq){
        pq.enqueue({position: posx, distance_squared: dsx});
      }

      if(pos.x != pos.y){
        if(pos.y != 0){
          positions.push(new GridPosition(pos.y, pos.x));
          positions.push(new GridPosition(-pos.y, pos.x));
          positions.push(new GridPosition(pos.y, -pos.x));
          positions.push(new GridPosition(-pos.y, -pos.x));
        }
        comps.push({position: new GridPosition(pos.y, pos.x), distance_squared: top.distance_squared});
        comps.push({position: new GridPosition(-pos.y, pos.x), distance_squared: top.distance_squared});
        comps.push({position: new GridPosition(pos.y, -pos.x), distance_squared: top.distance_squared});
        comps.push({position: new GridPosition(-pos.y, -pos.x), distance_squared: top.distance_squared});
        //do y as well
        const posy = new GridPosition(pos.x, pos.y+1);
        const dsy = this.euclidianDistanceSquared(p0, posy);
        if(!pq.isEmpty() && pq.front()!.distance_squared != dsy && dsy <= limit_sq){
          pq.enqueue({position: posy, distance_squared: dsy});
        }
      }

      positions_at_distance.push({positions, distance_squared: top.distance_squared});
    }
    console.log(positions_at_distance);
    console.log(comps);
    return comps;
  }


  //generates track from p1 to p2 with one turn only
  static randomPointToPoint1TurnTrack(p1: GridPosition, p2: GridPosition): Track{
    const rand = Math.random();
    return this.oneTurnTrackFrom2Points(p1, p2, rand > 0.5);
    /*
    const track_part = new TrackPart();
    //straight line conditions
    const dir_x = p1.x > p2.x ? DirectionEnum.Left : DirectionEnum.Right;
    const dir_y = p1.y > p2.y ? DirectionEnum.Up : DirectionEnum.Down;
    const dist_x = Math.abs(p1.x-p2.x);
    const dist_y= Math.abs(p1.y-p2.y);
    if(p1.x === p2.x){
      if(p1.y !== p2.y){
        //only goes vertical
        track_part.addMove(dist_y, dir_y);
      }
    }else if(p1.y === p2.y){
      //horizontal
      track_part.addMove(dist_x, dir_x);
    }else{ // has turn
      const rand = Math.random();
      
      if(rand > 0.5){
        //vertical first
        track_part.addMove(dist_y, dir_y);
        track_part.addMove(dist_x, dir_x);
      }else{
        //horizontal first
        track_part.addMove(dist_x, dir_x);
        track_part.addMove(dist_y, dir_y);
      }
    }

    return new Track(track_part, p1);*/
  }
  static oneTurnTrackFrom2Points(p1: GridPosition, p2: GridPosition, horizontal_first: boolean=true): Track{
    const dir_x = p1.x > p2.x ? DirectionEnum.Left : DirectionEnum.Right;
    const dir_y = p1.y > p2.y ? DirectionEnum.Up : DirectionEnum.Down;
    const dist_x = Math.abs(p1.x-p2.x);
    const dist_y= Math.abs(p1.y-p2.y);
    const track_part = new TrackPart();
    if(dist_x == 0){
      if(dist_y != 0){
        track_part.addMove(dist_y, dir_y);
      }
    }else if(dist_y == 0){
      track_part.addMove(dist_x, dir_x);
    }else{
      if(horizontal_first){
        track_part.addMove(dist_x, dir_x);
        track_part.addMove(dist_y, dir_y);
      }else{
        track_part.addMove(dist_y, dir_y);
        track_part.addMove(dist_x, dir_x);
      }
    }
    return new Track(track_part, p1);
  }


  static filterInsideGrid(positions: GridPosition[], grid: RectGrid): GridPosition[]{
    return positions.filter((p) => grid.isInsideGrid(p.x, p.y));
  }

  static positionsExactDistanceAway(p: GridPosition, dist: Int32): GridPosition[]{
    if(dist == 0){
      return [new GridPosition(p.x, p.y)];
    }
    const positions: GridPosition[] = [];
    positions.push(new GridPosition(p.x, p.y-dist));
    for(let i = -dist+1; i < 0; i++){
      const dx = i + dist;
      positions.push(new GridPosition(p.x-dx, p.y-i));
      positions.push(new GridPosition(p.x-dx, p.y+i));
    }
    positions.push(new GridPosition(p.x-dist, p.y));
    positions.push(new GridPosition(p.x+dist, p.y));
    for(let i = 1; i < dist; i++){
      const dx = i - dist;
      positions.push(new GridPosition(p.x-dx, p.y-i));
      positions.push(new GridPosition(p.x-dx, p.y+i));
    }
    positions.push(new GridPosition(p.x, p.y+dist));
    return positions;
  }

  static allPositionsDistanceAway(p: GridPosition, dist: Int32): GridPosition[][]{
    const positions = [];
    for(let i = 0; i <= dist; i++){
      positions.push(this.positionsExactDistanceAway(p, i));
    }
    return positions;
  }
};



export const DirectionEnum = {
  Up: 0, Right: 1, Down: 2, Left: 3
} as const;

export type GridDirection = (typeof DirectionEnum)[keyof typeof DirectionEnum];

export type ActiveDirections = {
  left: boolean;
  up: boolean;
  right: boolean;
  down: boolean;
}

export type GridPositionWithDirections = {
  position: GridPosition;
  directions: ActiveDirections;
}

export const TurnDirectionEnum = {
  Straight: 0,
  Clockwise: 1,
  AntiClockwise: 2
} as const;

type TurnDirection = (typeof TurnDirectionEnum)[keyof typeof TurnDirectionEnum]

// Track - Physical space an object can move on (cannot go back on itself) e.g. left 2, right 2
// Path - Movement of an object (can go back on itself)

export class DirectionUtil{
  static directions: GridPosition[] = [new GridPosition(0, 1), new GridPosition(1, 0), new GridPosition(0, -1), new GridPosition(-1, 0)];
  static turnDirectionToRadians(dir: GridDirection): Float{
    switch(dir){
      case DirectionEnum.Up:
        return 0;
      case DirectionEnum.Right:
        return Math.PI*0.5;
      case DirectionEnum.Down:
        return Math.PI;
      case DirectionEnum.Left:
        return Math.PI*1.5;
    }
  }
  static getTurnDirection(dir: GridDirection, rads: Float): TurnDirection{
    rads %= (Math.PI*2);
    switch(dir){
      case DirectionEnum.Left:
        rads -= Math.PI*1.5;
        break;
      case DirectionEnum.Down:
        rads -= Math.PI;
        break;
      case DirectionEnum.Right:
        rads -= Math.PI*0.5;
        break;
      case DirectionEnum.Up:
        break;
      default:
        break;
    }
    if(rads < 0){
      rads += Math.PI*2;
    }
    if(rads === 0){
      return TurnDirectionEnum.Straight;
    }
    return rads < Math.PI ? TurnDirectionEnum.AntiClockwise : TurnDirectionEnum.Clockwise;
  }
  
  static isSameAxis(dir1: GridDirection, dir2: GridDirection): boolean{
    if(dir1 == DirectionEnum.Left || dir1 == DirectionEnum.Right){
      return dir2 == DirectionEnum.Left || dir2 == DirectionEnum.Right;
    }
    return dir2 == DirectionEnum.Up || dir2 == DirectionEnum.Down;
  }
  static opposite(direction: GridDirection): GridDirection{
    switch(direction){
      case DirectionEnum.Down:
        return DirectionEnum.Up;
      case DirectionEnum.Left:
        return DirectionEnum.Right;
      case DirectionEnum.Up:
        return DirectionEnum.Down;
      case DirectionEnum.Right:
        return DirectionEnum.Left;
    }
  }
  static copyMovePosition(dir: GridDirection, pos: GridPosition, move: Int32=1): GridPosition{
    const new_position = pos.copy();
    if(dir === DirectionEnum.Right){
      new_position.x += move;
    }else if(dir === DirectionEnum.Left){
      new_position.x -= move;
    }else if(dir === DirectionEnum.Up){
      new_position.y -= move;
    }else if(dir === DirectionEnum.Down){
      new_position.y += move;
    }
    return new_position;
  }
  static movePosition(dir: GridDirection, pos: GridPosition, move: Int32=1){
    if(dir === DirectionEnum.Right){
      pos.x += move;
    }else if(dir === DirectionEnum.Left){
      pos.x -= move;
    }else if(dir === DirectionEnum.Up){
      pos.y -= move;
    }else if(dir === DirectionEnum.Down){
      pos.y += move;
    }
  }
  static directionsBetween2Points(from: GridPosition, to: GridPosition): GridDirection[]{
    const dirs: GridDirection[] = [];
    if(from.x != to.x){
      if(from.x < to.x){
        dirs.push(DirectionEnum.Right);
      }else{
        dirs.push(DirectionEnum.Left);
      }
    }
    if(from.y != to.y){
      if(from.y < to.y){
        dirs.push(DirectionEnum.Down);
      }else{
        dirs.push(DirectionEnum.Up);
      }
    }
    return dirs;
  }
  static fromFloatsInGridDecimal(x: Float, y: Float): GridDirection {
    if(x < 0) x = 1 + x;
    if(y < 0) y = 1 + y;
    const diag = 1 - x < y;
    if(x > y){
      return diag ? DirectionEnum.Right : DirectionEnum.Up;
    }
    return diag ? DirectionEnum.Down : DirectionEnum.Left;
  }
  static toString(dir: GridDirection): string{
    switch(dir){
      case DirectionEnum.Down:
        return "Down";
      case DirectionEnum.Left:
        return "Left";
      case DirectionEnum.Up:
        return "Up";
      case DirectionEnum.Right:
        return "Right";
    }
    return "";
  }
  static blankActiveDirections(): ActiveDirections{
    return {left: false, up: false, right: false, down: false};
  }
  static setActiveDirection(active_directions: ActiveDirections, value: boolean, direction: GridDirection){
    switch(direction){
      case DirectionEnum.Left:
        active_directions.left = value;
        break;
      case DirectionEnum.Down:
        active_directions.down = value;
        break;
      case DirectionEnum.Right:
        active_directions.right = value;
        break;
      case DirectionEnum.Up:
        active_directions.up = value;
        break;
    }
  }
  static isActiveDirection(active_directions: ActiveDirections, direction:GridDirection): boolean{
    switch(direction){
      case DirectionEnum.Left:
        return active_directions.left;
      case DirectionEnum.Down:
        return active_directions.down;
      case DirectionEnum.Right:
        return active_directions.right;
      case DirectionEnum.Up:
        return active_directions.up;
    }
  }
  //static isSameDirection(dir)
}

type GridStraightMove = {
  direction: GridDirection;
  distance: Int32;
}

class StraightMoveUtil{
  static mergeMove(){

  }
}

export class TrackMap{

}


export class Track{
  part: TrackPart;
  starting_location: GridPosition;
  constructor(tp: TrackPart, pos: GridPosition){
    this.part = tp;
    this.starting_location = pos.copy();
  }
  toPositions(): GridPosition[]{
    const positions: GridPosition[] = [new GridPosition(this.starting_location.x, this.starting_location.y)];
    for(const pt of this.part.getMoves()){
      for(let i = 0; i < pt.distance; i++){
        positions.push(DirectionUtil.copyMovePosition(pt.direction, positions.at(-1)!));
      }
    }
    return positions;
  }
  endPoint(): GridPosition{
    const p = this.starting_location.copy();
    for(const part of this.part.getMoves()){
      DirectionUtil.movePosition(part.direction, p, part.distance);
    }
    return p;

  }
}

//
export class TrackPart{
  private moves: GridStraightMove[];
  constructor(){
    this.moves = [];
  }
  addMove(distance: Int32, direction: GridDirection){
    this.moves.push({direction, distance});
  }
  condenseToTrack(){

  }
  getMoves(): GridStraightMove[]{
    return this.moves;
  }
}


export class RectGrid{
  width: Int32;
  height: Int32;
  size: number;

  half_size: number;

  pixel_width: number;
  pixel_height: number;

  x: number;
  y: number;

  
  constructor(w: Int32, h: Int32, s: number){
    this.width = w;
    this.height = h;
    this.size = s;
    this.half_size = s/2;
    this.pixel_width = w*s;
    this.pixel_height = h*s;

    this.x = 0;
    this.y = 0;
  }
  isInsideGrid(x:number, y:number): boolean{
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  isInsidePixel(x: number, y: number): boolean{
    const right = this.x + this.pixel_width;
    const bottom = this.y + this.pixel_height;
    return x >= this.x && x <= right && y >= this.y && y <= bottom;
  }
  getPosition(x: number, y: number): GridPosition | undefined{
    if(!this.isInsidePixel(x, y)) return undefined;
    const gx = Math.floor((x - this.x)/this.size);
    const gy = Math.floor((y - this.y)/this.size);
    return new GridPosition(gx, gy);
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

export const TileStateEnum = {
  Nothing: 0, Path: 1, Highlight: 2, Preview: 3
} as const;

export type TileState = (typeof TileStateEnum)[keyof typeof TileStateEnum];

function randomTileState(): TileState{
  let r = Math.random();
  return Math.floor(r*Object.keys(TileStateEnum).length) as TileState;
}

export class WallTile{
  left: TileState;
  top: TileState;
  right: TileState;
  bottom: TileState;
  is_key: boolean;
  node_id: Int32 | undefined;
  is_selected: boolean;
  constructor(){
    this.left = TileStateEnum.Nothing;
    this.bottom = TileStateEnum.Nothing;
    this.right = TileStateEnum.Nothing;
    this.top = TileStateEnum.Nothing;
    this.is_key = false;
    this.is_selected = false;
  }
  /* no longer a thing
  setDirection(direction: GridDirection, value: boolean){
    switch(direction){
      case DirectionEnum.Down:
        this.bottom = Tile;
        break;
      case DirectionEnum.Left:
        this.left = TileStateEnum.Nothing;
        break;
      case DirectionEnum.Up:
        this.top = value;
        break;
      case DirectionEnum.Right:
        this.right = TileStateEnum.Nothing;
        break;
    }
  }*/
  clear(){
    this.left = TileStateEnum.Nothing;
    this.bottom = TileStateEnum.Nothing;
    this.right = TileStateEnum.Nothing;
    this.top = TileStateEnum.Nothing;
    this.is_key = false;
    this.is_selected = false;
  }
  getDirections(): GridDirection[]{
    const dirs: GridDirection[] = [];
    if(this.left !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Left);
    }
    if(this.top !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Up);
    }
    if(this.right !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Right);
    }
    if(this.bottom !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Down);
    }
    return dirs;
  }
  getDirectionsOtherThan(not_dir: GridDirection): GridDirection[]{
    const dirs: GridDirection[] = [];
    if(not_dir !== DirectionEnum.Left && this.left !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Left);
    }
    if(not_dir !== DirectionEnum.Up && this.top !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Up);
    }
    if(not_dir !== DirectionEnum.Right && this.right !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Right);
    }
    if(not_dir !== DirectionEnum.Down && this.bottom !== TileStateEnum.Nothing){
      dirs.push(DirectionEnum.Down);
    }
    return dirs;
  }
  setNodeId(id: Int32){
    this.is_key = true;
    this.node_id = id;
  }
  clearNode(){
    this.is_key = false;
    this.node_id = undefined;
  }
  setTileActiveDirection(active: ActiveDirections, value: TileState){
    if(active.left){
      this.left = value;
    }
    if(active.down){
      this.bottom = value;
    }
    if(active.right){
      this.right = value;
    }
    if(active.up){
      this.top = value;
    }
  }
  setTileState(direction: GridDirection, value: TileState){
    switch(direction){
      case DirectionEnum.Down:
        this.bottom = value;
        break;
      case DirectionEnum.Left:
        this.left = value;
        break;
      case DirectionEnum.Up:
        this.top = value;
        break;
      case DirectionEnum.Right:
        this.right = value;
        break;
    }
  }
  randomise(){
    this.left = randomTileState();
    this.right = randomTileState();
    this.bottom = randomTileState();
    this.top = randomTileState();
  }
}

export class WallGrid{
  width: Int32;
  height: Int32;
  grid: WallTile[][];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.grid = Array.from({length: h}, () => Array.from({length: w}, () => new WallTile()));
  }
  clear(){
    for(let x = 0; x < this.width; x++){
      for(let y = 0; y < this.height; y++){
        this.grid[y][x].clear();
      }
    }
  }
  setNodeId(x: Int32, y: Int32, id: Int32){
    this.grid[y][x].setNodeId(id);
  }
  getNodeId(x: Int32, y: Int32): Int32 | undefined{
    return this.grid[y][x].node_id;
  }
  clearNode(x: Int32, y: Int32){
    this.grid[y][x].clearNode();
  }
  setCellKeyNode(x: Int32, y: Int32, val: boolean){
    this.grid[y][x].is_key = val;
  }
  getTile(x: Int32, y: Int32): WallTile | undefined{
    if(!this.isInside(x, y)) return undefined;
    return this.grid[y][x];
  }
  getTileFromPosition(pos: GridPosition): WallTile | undefined{
    return this.getTile(pos.x, pos.y);
  }
  randomise(){
    for(let y = 0; y < this.height; y++){
      for(let x = 0; x < this.width; x++){
        this.grid[y][x].randomise();
      }
    }
  }
  isInside(x: Int32, y: Int32): boolean{
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  setCellState(x: Int32, y: Int32, direction: GridDirection, state: TileState){
    this.grid[y][x].setTileState(direction, state);
  }
  setCellStateFromActive(x: Int32, y: Int32, active: ActiveDirections, state: TileState){
    this.grid[y][x].setTileActiveDirection(active, state);
    /*if(state == TileStateEnum.Highlight){
      this.grid[y][x].is_selected = true;
    }else{
      this.grid[y][x].is_selected = false;
    }*/
  }

  addTrack(track: Track){
    console.log(track);
    let last_direction: GridDirection | undefined = undefined;
    const current = track.starting_location.copy();
    for(const pt of track.part.getMoves()){
      for(let i = 0; i < pt.distance; i++){
        if(last_direction != undefined){
          this.grid[current.y][current.x].setTileState(DirectionUtil.opposite(last_direction), TileStateEnum.Path); 
        }
        this.grid[current.y][current.x].setTileState(pt.direction, TileStateEnum.Path);
        DirectionUtil.movePosition(pt.direction, current);
        last_direction = pt.direction;
      }
    }
    if(last_direction != undefined){
      this.grid[current.y][current.x].setTileState(DirectionUtil.opposite(last_direction), TileStateEnum.Path); 
    }
  }
  shortestPath(start: GridPosition, end: GridPosition): GridPosition[] | undefined{
    const last_position: (GridPosition | undefined)[][] = Array.from({length: this.height}, () => Array.from({length: this.width}, () => undefined));
    last_position[start.y][start.x] = start;
    if(start.equals(end)){
      return [start];
    }
    let queue: GridPosition[] = [];
    queue.push(start);
    let times = 0; // can remove
    while(queue.length > 0){
      console.log(queue);
      times++;
      const next_q = [];
      for(let i = 0; i < queue.length; i++){
        const curr = queue[i];
        if(curr.equals(end)){
          //found path
          const path: GridPosition[] = [end];
          let pl = path.at(-1)!;
          let last = last_position[pl.y][pl.x]!;
          while(!last.equals(start)){
            path.push(last);
            pl = path.at(-1)!;
            last = last_position[pl.y][pl.x]!;
          }
          path.push(start);
          ArrayUtils.reverse(path);
          return path;
          //backtrack
        }
        const wall_tile = this.grid[curr.y][curr.x];
        if(wall_tile.left != TileStateEnum.Nothing && last_position[curr.y][curr.x-1] == undefined){
          const new_pos = new GridPosition(curr.x-1, curr.y);
          next_q.push(new_pos);
          last_position[curr.y][curr.x-1] = curr;
        }if(wall_tile.top && last_position[curr.y-1][curr.x] == undefined){
          const new_pos = new GridPosition(curr.x, curr.y-1);
          next_q.push(new_pos);
          last_position[curr.y-1][curr.x] = curr;
        }if(wall_tile.right != TileStateEnum.Nothing && last_position[curr.y][curr.x+1] == undefined){
          const new_pos = new GridPosition(curr.x+1, curr.y);
          next_q.push(new_pos);
          last_position[curr.y][curr.x+1] = curr;
          //console.log("right");
        }if(wall_tile.bottom && last_position[curr.y+1][curr.x] == undefined){
          const new_pos = new GridPosition(curr.x, curr.y+1);
          next_q.push(new_pos);
          last_position[curr.y+1][curr.x] = curr;
          //console.log("bot");
        }
      }
      queue = next_q;
    }
    return undefined;
  }
}

type PositionsAtDistance = {
  positions: GridPosition[];
  distance_squared: Float;
}

type GridEucildianCompare = {
  position: GridPosition;
  distance_squared: Float;
};

export class GridAlgorithms{
  static positionsAtDistance:PositionsAtDistance[] = [];
  private static distanceQueue = new PQ.PriorityQueue((a:GridEucildianCompare,b:GridEucildianCompare) => a.distance_squared-b.distance_squared);
  private static distancesSeen: number[] = [];

  static pathToTrack(path: GridPosition[]): Track{
    const part = new TrackPart();
    let direction = DirectionUtil.directionsBetween2Points(path[0], path[1])[0];
    let dist = 1;
    for(let i = 2; i < path.length; i++){
      const c_dir = DirectionUtil.directionsBetween2Points(path[i-1], path[i])[0];
      if(c_dir === direction){
        dist += 1;
      }else{
        part.addMove(dist, direction);
        direction = c_dir;
        dist = 1;
      }
    }
    const track = new Track(part, path[0]);
    return track;
  }

  static greatestPositionAtDistance(): Int32 | undefined{
    if(GridAlgorithms.positionsAtDistance.length == 0) return undefined;
    return GridAlgorithms.positionsAtDistance.at(-1)!.distance_squared;
  }

  static generatePositionsAtDistance(limit: Float){
    const limit_sq = limit*limit;
    //const pq = new PQ.PriorityQueue((a:GridEucildianCompare,b:GridEucildianCompare) => a.distance_squared-b.distance_squared);
    const pq = GridAlgorithms.distanceQueue;
    const p0 = new GridPosition(0, 0);
    if(pq.isEmpty()){
      pq.enqueue({position: p0, distance_squared: GridPosition.euclidianDistanceSquared(p0, p0)});
      GridAlgorithms.distancesSeen.push(0);
    }
    while(pq.front()!.distance_squared <= limit_sq){
      const top = pq.dequeue()!;
      const pos = top.position.copy();

      const positions: GridPosition[] = [];
      if(pos.x == 0 && pos.y == 0){
        positions.push(new GridPosition(pos.x, pos.y));
      }else if(pos.y == 0){
        positions.push(new GridPosition(pos.x, 0));
        positions.push(new GridPosition(-pos.x, 0));
        positions.push(new GridPosition(0, pos.x));
        positions.push(new GridPosition(0, -pos.x));
      }else{
        positions.push(new GridPosition(pos.x, pos.y));
        positions.push(new GridPosition(-pos.x, pos.y));
        positions.push(new GridPosition(pos.x, -pos.y));
        positions.push(new GridPosition(-pos.x, -pos.y));
      }

      const posx = new GridPosition(pos.x+1, pos.y);
      const dsx = GridPosition.euclidianDistanceSquared(p0, posx);

      console.log(`${this.distancesSeen} - ${pos.x}, ${pos.y}`);

      if(posx.x >= GridAlgorithms.distancesSeen.length || posx.y > GridAlgorithms.distancesSeen[posx.x]){
        pq.enqueue({position: posx, distance_squared: dsx});
        if(GridAlgorithms.distancesSeen.length == posx.x){
          GridAlgorithms.distancesSeen.push(0);
        }else{
          GridAlgorithms.distancesSeen[posx.x] = Math.max(GridAlgorithms.distancesSeen[posx.x], posx.y);
        }
      }

      if(pos.x != pos.y){
        if(pos.y != 0){
          positions.push(new GridPosition(pos.y, pos.x));
          positions.push(new GridPosition(-pos.y, pos.x));
          positions.push(new GridPosition(pos.y, -pos.x));
          positions.push(new GridPosition(-pos.y, -pos.x));
        }
        //do y as well
        const posy = new GridPosition(pos.x, pos.y+1);
        const dsy = GridPosition.euclidianDistanceSquared(p0, posy);
        if(posy.x >= GridAlgorithms.distancesSeen.length || posy.y > GridAlgorithms.distancesSeen[pos.x]){
          pq.enqueue({position: posy, distance_squared: dsy});
          if(GridAlgorithms.distancesSeen.length == posy.x){
            GridAlgorithms.distancesSeen.push(0);
          }else{
            GridAlgorithms.distancesSeen[posy.x] = Math.max(GridAlgorithms.distancesSeen[posy.x], posy.y);
          }
        }
      }
      if(GridAlgorithms.positionsAtDistance.length > 0 && GridAlgorithms.positionsAtDistance.at(-1)!.distance_squared === top.distance_squared){
        const last = GridAlgorithms.positionsAtDistance.at(-1)!;
        //console.log(`same distance sq ${pos.x}, ${pos.y} == ${last.positions[0].x}, ${last.positions[0].y} ${top.distance_squared}`);
        GridAlgorithms.positionsAtDistance[GridAlgorithms.positionsAtDistance.length-1].positions = last.positions.concat(positions);
      }else{
        GridAlgorithms.positionsAtDistance.push({positions, distance_squared: top.distance_squared});
      }
    }
  }
  static positionPathToDirectionPath(path: GridPosition[]):GridPositionWithDirections[]{
    const direction_path:GridPositionWithDirections[] = [];
    for(let i = 0; i < path.length; i++){
      const active = {
        left: false,
        down: false,
        right: false,
        up: false
      }
      if(i != 0){
        const back_directions = DirectionUtil.directionsBetween2Points(path[i], path[i-1]);
        for(const dir of back_directions){
          DirectionUtil.setActiveDirection(active, true, dir);
        }
      }
      if(i != path.length-1){
        const forward_directions = DirectionUtil.directionsBetween2Points(path[i], path[i+1]);
        for(const dir of forward_directions){
          DirectionUtil.setActiveDirection(active, true, dir);
        }
      }
      direction_path.push({position: path[i], directions: active});
    }
    return direction_path;
  }

  static positionsWithinRange(limit_squared: Float): GridPosition[]{
    const greatest_distance = GridAlgorithms.greatestPositionAtDistance();
    if(greatest_distance == undefined || greatest_distance < limit_squared){
      GridAlgorithms.generatePositionsAtDistance(limit_squared);
      let positions: GridPosition[] = [];
      for(const pd of GridAlgorithms.positionsAtDistance){
        positions = positions.concat(pd.positions);
      }
      return positions; 
    }
    //search for limit index
    const find_index = ArrayUtils.binarySearchLowerBound(GridAlgorithms.positionsAtDistance, (e:PositionsAtDistance) => limit_squared-e.distance_squared);
    //console.log(find_index);
    let positions: GridPosition[] = [];
    for(let i = 0; i < find_index; i++){
      positions = positions.concat(GridAlgorithms.positionsAtDistance[i].positions);
    }
    return positions;
  }

  static positionsWithin2Ranges(lower_range_squared: Float, upper_range_squared: Float): GridPosition[]{
    if(lower_range_squared > upper_range_squared){
      const tmp = lower_range_squared;
      lower_range_squared = upper_range_squared;
      upper_range_squared = tmp;
    }
    const greatest_distance = GridAlgorithms.greatestPositionAtDistance();
    if(greatest_distance == undefined || greatest_distance < upper_range_squared){
      GridAlgorithms.generatePositionsAtDistance(upper_range_squared);
    }
    const hi_index = ArrayUtils.binarySearchLowerBound(GridAlgorithms.positionsAtDistance, 
      (e:PositionsAtDistance) => upper_range_squared-e.distance_squared
    );
    const lo_index = ArrayUtils.binarySearchUpperBound(GridAlgorithms.positionsAtDistance, 
      (e:PositionsAtDistance) => lower_range_squared-e.distance_squared
    );
    let positions: GridPosition[] = [];
    for(let i = lo_index; i <= hi_index; i++){
      //console.log(GridAlgorithms.positionsAtDistance[i]);
      positions = positions.concat(GridAlgorithms.positionsAtDistance[i].positions);
    }
    return positions;
  }
}