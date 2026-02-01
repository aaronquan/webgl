import * as Matrix from "../WebGL/Matrix/matrix";
import * as App from "./app";
import * as Grid from "./grid"
import * as Shader from "./../WebGL/Shaders/custom";
import * as Shapes from '../WebGL/Shapes/Shapes';
import WebGL from "../WebGL/globals";

import * as ArrayUtils from "../utils/array";


type Int32 = number;

function randomPick<T>(arr: T[]): T{
  const p = Math.floor(Math.random()*arr.length);
  return arr[p];
}

//filter out any positions that are too close the avoid position, anything within distance
function filterPositionsTooClose(positions: Grid.GridPosition[], avoid: Grid.GridPosition, distance: number): Grid.GridPosition[]{
  const filtered = [];
  for(const pos of positions){
    if(Grid.GridPosition.manhattanDistance(pos, avoid) >= distance){
      filtered.push(pos);
    }
  }
  return filtered;
}


function intersectionGridPosition(arr1: Grid.GridPosition[], arr2: Grid.GridPosition[]): Grid.GridPosition[]{
  const arr1Positions: Map<number, Set<number>> = new Map();
  const intersection = [];
  for(const pos of arr1){
    if(arr1Positions.has(pos.x)){
      arr1Positions.get(pos.x)!.add(pos.y);
    }else{
      arr1Positions.set(pos.x, new Set([pos.y]));
    }
  }
  for(const pos of arr2){
    if(arr1Positions.has(pos.x)){
      if(arr1Positions.get(pos.x)!.has(pos.y)){
        intersection.push(pos);
      }
    }
  }
  return intersection;
}

function addIfInside(grid: Grid.RectGrid, positions: Grid.GridPosition[], pos: Grid.GridPosition){
  if(grid.isInsideGrid(pos.x, pos.y)){
    positions.push(pos);
  }
}

function getLocationsAway(grid: Grid.RectGrid, pos: Grid.GridPosition, away: number): Grid.GridPosition[]{
  if(away == 0){
    return [new Grid.GridPosition(pos.x, pos.y)];
  }
  const positions: Grid.GridPosition[] = [];
  addIfInside(grid, positions, new Grid.GridPosition(pos.x, pos.y-away));
  for(let i = -away+1; i < 0; i++){
    const dx = i + away;
    addIfInside(grid, positions,new Grid.GridPosition(pos.x-dx, pos.y-i));
    addIfInside(grid, positions,new Grid.GridPosition(pos.x-dx, pos.y+i));
  }
  addIfInside(grid, positions,new Grid.GridPosition(pos.x-away, pos.y));
  addIfInside(grid, positions,new Grid.GridPosition(pos.x+away, pos.y));
  for(let i = 1; i < away; i++){
    const dx = i - away;
    addIfInside(grid, positions,new Grid.GridPosition(pos.x-dx, pos.y-i));
    addIfInside(grid, positions,new Grid.GridPosition(pos.x-dx, pos.y+i));
  }
  addIfInside(grid, positions,new Grid.GridPosition(pos.x, pos.y+away));
  return positions;
}

function generateKeyLocations(grid: Grid.RectGrid): Grid.GridPosition[]{
  const locations: Grid.GridPosition[] = [];
  locations.push(new Grid.GridPosition(0, 0)); //start at corner
  let away = getLocationsAway(grid, locations.at(-1)!, 8);
  locations.push(randomPick(away));
  while(locations.length < 14){
    away = getLocationsAway(grid, locations.at(-1)!, 7);

    const pick = randomPick(away);
    locations.push(randomPick(away));
  }


  return locations;
}

export class WallEngine extends App.BaseEngine{
  grid: Grid.WallGrid;
  rect_grid: Grid.RectGrid;

  mouse_over: Grid.GridPosition | undefined;

  highlighted_positions: Grid.GridPosition[];
  is_circle_positions: boolean;

  key_positions: Grid.GridPosition[];

  constructor(){
    super();
    const w = 80; const h = 80
    this.grid = new Grid.WallGrid(w,h);
    this.rect_grid = new Grid.RectGrid(w, h, 10);
    this.mouse_over = undefined;
    this.highlighted_positions = [];
    this.key_positions = generateKeyLocations(this.rect_grid);
    this.is_circle_positions = false;
    console.log(this.grid);

    if(this.key_positions.length >= 2){
      for(let i = 1; i < this.key_positions.length; i++){
        console.log(this.key_positions[i]);
        const path = Grid.GridPosition.randomPointToPoint1TurnTrack(this.key_positions[i-1], this.key_positions[i]);
        console.log(path);
        console.log(path.toPositions());
        this.grid.addTrack(path);
      }

    }

    Grid.GridPosition.testEuclidianDistance(3.4);

    Grid.GridAlgorithms.generatePositionsAtDistance(4);
    Grid.GridAlgorithms.generatePositionsAtDistance(6);
    console.log(Grid.GridAlgorithms.positionsAtDistance);
    Grid.GridAlgorithms.generatePositionsAtDistance(20);
    console.log(Grid.GridAlgorithms.positionsAtDistance);

    Grid.GridAlgorithms.positionsWithinRange(10);
    Grid.GridAlgorithms.positionsWithin2Ranges(6, 13);

    const out = ArrayUtils.binarySearch([1,2,3], (t: number) => {
      return 1-t;
    });
    console.log(out);
    const ind = ArrayUtils.binarySearchUpperBound([1,2,3], (t: number) => {
      return 3-t;
    });
    console.log(ind);
  }

  protected override handleKeyDown(ev: KeyboardEvent){
    //this.grid.randomise();
    console.log(ev.key);
    if(ev.key == 'q'){
      this.is_circle_positions = !this.is_circle_positions;
      if(this.mouse_over != undefined){
        this.setHighlightedPositions(this.mouse_over);
      }
    }
  }
  protected override handleMouseMove(ev: MouseEvent): void {
    const pos = this.rect_grid.getPosition(ev.offsetX, ev.offsetY);
    if(pos != undefined){
      if(this.mouse_over == undefined || (this.mouse_over.x != pos.x || this.mouse_over.y != pos.y)){
        this.setHighlightedPositions(pos);
      }
    }else{
      this.highlighted_positions = [];
    }
    this.mouse_over = pos;
    //this.mouse_over = pos;
  }


  setHighlightedPositions(pos: Grid.GridPosition){
    if(this.is_circle_positions){
      this.highlighted_positions = Grid.GridAlgorithms.positionsWithin2Ranges(20,36).map((p) => new Grid.GridPosition(pos.x+p.x, pos.y+p.y));
      this.highlighted_positions = filterPositionsTooClose(this.highlighted_positions, new Grid.GridPosition(0, 0), 3);
    }else{
      this.highlighted_positions = ArrayUtils.flatten(Grid.GridPosition.allPositionsDistanceAway(pos, 6));
      this.highlighted_positions = Grid.GridPosition.filterInsideGrid(this.highlighted_positions, this.rect_grid);
      this.highlighted_positions = filterPositionsTooClose(this.highlighted_positions, new Grid.GridPosition(0, 0), 3);
    }
    //console.log(pos);
  }
}

interface TileShader{
  setLeft:(v: number) => void;
  setBot:(v: number) => void;
  setRight:(v: number) => void;
  setTop:(v: number) => void;
}

export class WallRenderer implements App.IEngineRenderer<WallEngine>{
  grid_tile_shader: Shader.MVPSolidPathProgram;
  pri_tile_shader: Shader.MVPPathCenterCircleProgram;
  solid_shader: Shader.MVPColourProgram;
  vp: Matrix.TransformationMatrix3x3;
  draw_width: Int32;
  draw_height: Int32;
  constructor(w: Int32, h: Int32){
    this.grid_tile_shader = new Shader.MVPSolidPathProgram();
    this.pri_tile_shader = new Shader.MVPPathCenterCircleProgram();
    this.solid_shader = new Shader.MVPColourProgram();
    this.draw_width = w;
    this.draw_height = h;
    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
  }
  render(engine: WallEngine){
    //const perspective = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
    const gs = engine.rect_grid.size;
    //const ctx = WebGL.gl;
    this.grid_tile_shader.use();
    this.grid_tile_shader.setBackgroundColour(1.0, 1.0, 0.0);
    this.grid_tile_shader.setColour(0.0, 0.0, 1.0);
    for(let y = 0; y < engine.grid.height; y++){
      for(let x = 0; x < engine.grid.width; x++){
        const tx = x*gs;
        const ty = y*gs;
        const model = Matrix.TransformationMatrix3x3.translate(tx, ty);
        model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
        const mvp = this.vp.multiplyCopy(model);
        this.grid_tile_shader.setMvp(mvp);
        this.setTile(this.grid_tile_shader, engine.grid, x, y);
        this.grid_tile_shader.setSize(0.2);
        Shapes.Quad.drawRelative();
      }
    }
    if(engine.mouse_over){
      const model = Matrix.TransformationMatrix3x3.translate(engine.mouse_over.x*gs, engine.mouse_over.y*gs);
      model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
      this.pri_tile_shader.use();
      this.pri_tile_shader.setCircleRadius(0.18);
      this.pri_tile_shader.setColour(0, 1, 1);
      this.pri_tile_shader.setBackgroundColour(1,1,0);
      //this.pri_tile_shader.setRight(1.0);
      this.pri_tile_shader.setSize(0.2);
      this.pri_tile_shader.setMvp(this.vp.multiplyCopy(model));
      this.setTile(this.pri_tile_shader, engine.grid, engine.mouse_over.x, engine.mouse_over.y);
      this.pri_tile_shader.setBot(1.0);
      Shapes.Quad.drawRelative();
    }
    this.solid_shader.use();
    this.solid_shader.setColour(0,0,1);
    for(let i = 0; i < engine.highlighted_positions.length; i++){
      const pos = engine.highlighted_positions[i];
      const model = engine.rect_grid.getTransformation(pos.x, pos.y);
      this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      Shapes.Quad.draw();
    }
    this.pri_tile_shader.use();
    for(const pos of engine.key_positions){
      const model = engine.rect_grid.getTransformation(pos.x, pos.y);
      const x = pos.x; const y = pos.y;
      this.pri_tile_shader.setCircleRadius(0.18);
      this.pri_tile_shader.setColour(0, 1, 1);
      this.pri_tile_shader.setBackgroundColour(1,1,0);
      this.pri_tile_shader.setSize(0.2);
      this.pri_tile_shader.setMvp(this.vp.multiplyCopy(model));
      this.setTile(this.pri_tile_shader, engine.grid, x, y);
      Shapes.Quad.drawRelative();
    }
    this.drawGridLines(engine);
    requestAnimationFrame(() => this.render(engine));
  }
  drawGridLines(engine: WallEngine){
    this.solid_shader.use();
    this.solid_shader.setColour(0.1,0.1,0.1);
    const line_thickness = 2;
    const half_thickness = line_thickness/2;
    for(let y = 0; y <= engine.grid.height; y++){
      const model = WebGL.rectangleModel(0, y*engine.rect_grid.size-half_thickness, engine.rect_grid.pixel_width, line_thickness);
      this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      Shapes.Quad.drawRelative();
    }
    for(let x = 0; x <= engine.grid.width; x++){
      const model = WebGL.rectangleModel(x*engine.rect_grid.size-half_thickness, 0, line_thickness, engine.rect_grid.pixel_height)
      
      this.solid_shader.setMvp(this.vp.multiplyCopy(model))
      Shapes.Quad.drawRelative();
    }
    Shapes.Quad.draw();
  }
  setTile(shader: TileShader, grid: Grid.WallGrid, x: Int32, y: Int32){
    if(!grid.isInside(x, y)) return;
    if(grid.grid[y][x].left){
      shader.setLeft(1.0);
    }else{
      shader.setLeft(0.0);
    }
    if(grid.grid[y][x].bottom){
      shader.setTop(1.0);
    }else{
      shader.setTop(0.0);
    }
    if(grid.grid[y][x].right){
      shader.setRight(1.0);
    }else{
      shader.setRight(0.0);
    }
    if(grid.grid[y][x].top){
      shader.setBot(1.0);
    }else{
      shader.setBot(0.0);
    }
  }
}