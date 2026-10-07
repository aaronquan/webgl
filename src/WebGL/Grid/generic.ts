import * as WebGL from "./../globals";
import * as PQ from "@datastructures-js/priority-queue";

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


// 
export class CoordinateChunk{
  private coordinates: Coordinate[];
  private seen: SeenCoordinates;
  constructor(coords: Coordinate[]=[]){
    this.seen = new SeenCoordinates();
    this.coordinates = [];
    for(const c of coords){
      this.addCoordinate(c);
    }
  }
  hasXY(x: Int32, y: Int32): boolean{
    return this.hasCoordinate({x, y});
  }
  hasCoordinate(coord: Coordinate): boolean{
    return this.seen.isSeen(coord);
  }
  addXY(x: Int32, y: Int32){
    this.addCoordinate({x, y});
  }
  addCoordinate(coord: Coordinate){
    if(!this.seen.isSeen(coord)){
      this.coordinates.push(coord);
      this.seen.setSeen(coord);
    }
  }
  getAdjacents(): CoordinateChunk{
    const chunk = new CoordinateChunk();
    for(const c of this.coordinates){
      const adjacents = CoordinateChunk.adjacent(c);
      for(const adj of adjacents){
        if(!this.hasCoordinate(adj)){
          chunk.addCoordinate(adj);
        }
      }
    }
    return chunk;
  }
  static adjacent(coord: Coordinate): Coordinate[]{
    return [{x:coord.x+1, y:coord.y}, 
      {x:coord.x, y:coord.y+1}, 
      {x:coord.x-1, y: coord.y},
      {x: coord.x, y: coord.y-1}
    ];
  }
}

type PositionsAtDistance = {
  positions: Coordinate[];
  distance_squared: Float;
}

type GridEucildianCompare = {
  position: Coordinate;
  distance_squared: Float;
};

export class GridAlgorithms{
  static positions_at_distance:PositionsAtDistance[] = [];
  private static distance_queue = new PQ.PriorityQueue<GridEucildianCompare>((a:GridEucildianCompare,b:GridEucildianCompare) => a.distance_squared-b.distance_squared);
  private static distances_seen: Float[] = [];

  static coordinateDistanceSquared(c1: Coordinate, c2: Coordinate): Float{
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    return dx*dx+dy*dy;
  }

  static generatePositionsAtDistance(limit_sq: Float){
    //const limit_sq = limit*limit;

    const pq = GridAlgorithms.distance_queue;
    const p0: Coordinate = {x:0, y:0};
    if(pq.isEmpty()){
      pq.enqueue({position: p0, distance_squared: GridAlgorithms.coordinateDistanceSquared(p0, p0)});
      GridAlgorithms.distances_seen.push(0);
    }
    while(pq.front()!.distance_squared <= limit_sq){
      const top = pq.dequeue()!;
      const pos = top.position;

      const positions: Coordinate[] = [];
      if(pos.x == 0 && pos.y == 0){
        positions.push({...pos});
      }else if(pos.y == 0){
        positions.push({x:pos.x, y:0});
        positions.push({x:-pos.x, y:0});
        positions.push({x:0, y:pos.x});
        positions.push({x:0, y:-pos.x});
      }else{
        positions.push({x:pos.x, y:pos.y});
        positions.push({x:-pos.x, y:pos.y});
        positions.push({x:pos.x, y:-pos.y});
        positions.push({x:-pos.x, y:-pos.y});
      }

      const posx = {x:pos.x+1, y:pos.y};
      const dsx = GridAlgorithms.coordinateDistanceSquared(p0, posx);

      //console.log(`${this.distances_seen} - ${pos.x}, ${pos.y}`);

      if(posx.x >= GridAlgorithms.distances_seen.length || posx.y > GridAlgorithms.distances_seen[posx.x]){
        pq.enqueue({position: posx, distance_squared: dsx});
        if(GridAlgorithms.distances_seen.length == posx.x){
          GridAlgorithms.distances_seen.push(0);
        }else{
          GridAlgorithms.distances_seen[posx.x] = Math.max(GridAlgorithms.distances_seen[posx.x], posx.y);
        }
      }

      if(pos.x != pos.y){
        if(pos.y != 0){
          positions.push({x:pos.y, y:pos.x});
          positions.push({x:-pos.y, y:pos.x});
          positions.push({x:pos.y, y:-pos.x});
          positions.push({x:-pos.y, y:-pos.x});
        }
        //do y as well
        const posy = {x:pos.x, y:pos.y+1};
        const dsy = GridAlgorithms.coordinateDistanceSquared(p0, posy);
        if(posy.x >= GridAlgorithms.distances_seen.length || posy.y > GridAlgorithms.distances_seen[pos.x]){
          pq.enqueue({position: posy, distance_squared: dsy});
          if(GridAlgorithms.distances_seen.length == posy.x){
            GridAlgorithms.distances_seen.push(0);
          }else{
            GridAlgorithms.distances_seen[posy.x] = Math.max(GridAlgorithms.distances_seen[posy.x], posy.y);
          }
        }
      }
      if(GridAlgorithms.positions_at_distance.length > 0 && GridAlgorithms.positions_at_distance.at(-1)!.distance_squared === top.distance_squared){
        const last = GridAlgorithms.positions_at_distance.at(-1)!;
        //console.log(`same distance sq ${pos.x}, ${pos.y} == ${last.positions[0].x}, ${last.positions[0].y} ${top.distance_squared}`);
        GridAlgorithms.positions_at_distance[GridAlgorithms.positions_at_distance.length-1].positions = last.positions.concat(positions);
      }else{
        GridAlgorithms.positions_at_distance.push({positions, distance_squared: top.distance_squared});
      }
    }
  }
  static greatestCoordinateAtDistance(): Int32 | undefined{
      if(GridAlgorithms.positions_at_distance.length == 0) return undefined;
      return GridAlgorithms.positions_at_distance.at(-1)!.distance_squared;
    }
  static coordinatesWithinRange(limit_squared: Float, center: Coordinate={x:0, y:0}):Coordinate[]{
    const greatest_distance = GridAlgorithms.greatestCoordinateAtDistance();
    if(greatest_distance == undefined || greatest_distance < limit_squared){
      GridAlgorithms.generatePositionsAtDistance(limit_squared);
      let positions: Coordinate[] = [];
      for(const pd of GridAlgorithms.positions_at_distance){
        positions = positions.concat(pd.positions.map((p) => {
          return {x: p.x+center.x, y: p.y+center.y};
        }));
      }
      return positions; 
    }
    //search for limit index
    const find_index = WebGL.Utils.Array.binarySearchLowerBound(GridAlgorithms.positions_at_distance, (e:PositionsAtDistance) => limit_squared-e.distance_squared);
    //console.log(find_index);
    let positions: Coordinate[] = [];
    for(let i = 0; i < find_index; i++){
      positions = positions.concat(GridAlgorithms.positions_at_distance[i].positions.map((p) => {
        return {x: p.x+center.x, y: p.y+center.y};
      }));
    }
    return positions;
  }
}

export class GenericGrid2D<T> implements Grid{
  width: Int32;
  height: Int32;
  protected grid: (T | undefined)[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.grid = Array.from({length: this.width*this.height}, () => undefined);
  }
  isValidCoordinate(coord: WebGL.Grid.Generic.Coordinate): boolean{
    return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height;
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
  getCenterGlobalXYFromCoord(coord: Coordinate): WebGL.Matrix.Point2D{
    const x = this.x + coord.x*this.cell_size + this.cell_size*0.5;
    const y = this.y + coord.y*this.cell_size + this.cell_size*0.5;
    return new WebGL.Matrix.Point2D(x, y);
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

export class SeenCoordinates{
  private seen: Map<Int32, Set<Int32>>;
  constructor(){
    this.seen = new Map();
  }
  isSeen(coord: Coordinate):boolean{
    if(!this.seen.has(coord.x)){
      return false;
    }
    return this.seen.get(coord.x)!.has(coord.y);
  }
  setSeen(coord: Coordinate){
    if(!this.seen.has(coord.x)){
      this.seen.set(coord.x, new Set([coord.y]));
    }
    this.seen.get(coord.x)!.add(coord.y);
  }
}