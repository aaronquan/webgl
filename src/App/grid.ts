import * as Matrix from "../WebGL/Matrix/matrix";
import * as ArrayUtils from "../utils/array";
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

    return new Track(track_part, p1);
  }
  static turnTrackHorizontalFirst(p1: GridPosition, p2: GridPosition): Track{
    //todo
  }
  static turnTrackVerticalFirst(p1: GridPosition, p2: GridPosition): Track{
    //todo
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



const DirectionEnum = {
  Up: 0, Right: 1, Down: 2, Left: 3
} as const;

type GridDirection = (typeof DirectionEnum)[keyof typeof DirectionEnum];

// Track - Physical space an object can move on (cannot go back on itself) e.g. left 2, right 2
// Path - Movement of an object (can go back on itself)

class DirectionUtil{
  static directions: GridPosition[] = [new GridPosition(0, 1), new GridPosition(1, 0), new GridPosition(0, -1), new GridPosition(-1, 0)];
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

export class WallTile{
  left: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
  is_key: boolean;
  constructor(){
    this.left = false;
    this.bottom = false;
    this.right = false;
    this.top = false;
    this.is_key = false;
  }
 setDirection(direction: GridDirection, value: boolean){
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
  isInside(x: number, y: number): boolean{
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  addTrack(track: Track){
    console.log(track);
    let last_direction: GridDirection | undefined = undefined;
    const current = track.starting_location.copy();
    for(const pt of track.part.getMoves()){
      //console.log(pt);
      for(let i = 0; i < pt.distance; i++){
        //console.log(current);
        if(last_direction != undefined){
          this.grid[current.y][current.x].setDirection(DirectionUtil.opposite(last_direction), true); 
        }
        this.grid[current.y][current.x].setDirection(pt.direction, true);
        DirectionUtil.movePosition(pt.direction, current);
        last_direction = pt.direction;
      }
    }
    if(last_direction != undefined){
      this.grid[current.y][current.x].setDirection(DirectionUtil.opposite(last_direction), true); 
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
        if(wall_tile.left && last_position[curr.y][curr.x-1] == undefined){
          const new_pos = new GridPosition(curr.x-1, curr.y);
          next_q.push(new_pos);
          last_position[curr.y][curr.x-1] = curr;
        }if(wall_tile.top && last_position[curr.y-1][curr.x] == undefined){
          const new_pos = new GridPosition(curr.x, curr.y-1);
          next_q.push(new_pos);
          last_position[curr.y-1][curr.x] = curr;
        }if(wall_tile.right && last_position[curr.y][curr.x+1] == undefined){
          const new_pos = new GridPosition(curr.x+1, curr.y);
          next_q.push(new_pos);
          last_position[curr.y][curr.x+1] = curr;
          console.log("right");
        }if(wall_tile.bottom && last_position[curr.y+1][curr.x] == undefined){
          const new_pos = new GridPosition(curr.x, curr.y+1);
          next_q.push(new_pos);
          last_position[curr.y+1][curr.x] = curr;
          console.log("bot");
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