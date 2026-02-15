import * as Matrix from "../WebGL/Matrix/matrix";
import * as App from "./app";
import * as Grid from "./grid"
import * as Shader from "./../WebGL/Shaders/custom";
import * as Shapes from '../WebGL/Shapes/Shapes';
import * as Texture from "./../WebGL/Texture/texture";
import * as Colour from "./../WebGL/colour";
import WebGL from "../WebGL/globals";

import * as ArrayUtils from "../utils/array";


type Int32 = number;
type Float = number;

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

function generateKeyLocations(grid: Grid.RectGrid, n_locations: Int32=5): Grid.GridPosition[]{
  const locations: Grid.GridPosition[] = [];
  locations.push(new Grid.GridPosition(0, 0)); //start at corner
  let away = getLocationsAway(grid, locations.at(-1)!, 8);
  locations.push(randomPick(away));
  while(locations.length < n_locations){
    away = getLocationsAway(grid, locations.at(-1)!, 7);

    const pick = randomPick(away);
    locations.push(randomPick(away));
  }


  return locations;
}

export class Car{

}

export class MultiGridObject{
  width: Int32;
  height: Int32;
  active_cells: boolean[];
  constructor(w: Int32, h: Int32){
    this.width = w;
    this.height = h;
    this.active_cells = [];
  }
}

export class WallEngine extends App.BaseEngine{
  grid: Grid.WallGrid;
  rect_grid: Grid.RectGrid;

  mouse_over: Grid.GridPosition | undefined;

  highlighted_positions: Grid.GridPosition[];
  is_circle_positions: boolean;

  key_positions: Grid.GridPosition[];
  adding_position: Grid.GridPosition | undefined;
  adding_path_hori_first: boolean;

  selected_key1: Grid.GridPosition | undefined;
  selected_key2: Grid.GridPosition | undefined;

  test_objects: MultiGridObject[];

  highlight_path: Grid.GridPosition[];

  constructor(){
    super();
    const w = 10; const h = 10;
    const s = 80;
    this.grid = new Grid.WallGrid(w,h);
    this.rect_grid = new Grid.RectGrid(w, h, s);
    this.mouse_over = undefined;
    this.highlighted_positions = [];
    this.key_positions = generateKeyLocations(this.rect_grid, 3);
    this.is_circle_positions = false;

    if(this.key_positions.length >= 2){
      for(let i = 1; i < this.key_positions.length; i++){
        const path = Grid.GridPosition.randomPointToPoint1TurnTrack(this.key_positions[i-1], this.key_positions[i]);
        this.grid.addTrack(path);
        this.grid.grid[this.key_positions[i].y][this.key_positions[i].x].is_key = true;
      }
      this.grid.grid[this.key_positions[0].y][this.key_positions[0].x].is_key = true;
    }
    let arr = [1,2,3,4,5];
    ArrayUtils.reverse(arr);
    console.log(arr);
    const sh_path = this.grid.shortestPath(this.key_positions[0], this.key_positions[1]);
    console.log(sh_path);
    
    this.test_objects = [];
    this.adding_path_hori_first = true;
    this.highlight_path = [];
    /*
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
    */
  }
  

  addKeyPosition(x: Int32, y: Int32){
    this.key_positions.push(new Grid.GridPosition(x, y));
  }

  protected override handleKeyDown(ev: KeyboardEvent){
    //this.grid.randomise();
    console.log(ev.key);
    if(ev.key == 'q'){
      this.is_circle_positions = !this.is_circle_positions;
      if(this.mouse_over != undefined){
        this.setHighlightedPositions(this.mouse_over);
      }
    }else if(ev.key == 'w'){
      //run path closest
      if(this.highlight_path.length > 0){
        this.highlight_path = [];
      }
      else if(this.selected_key1 != undefined && this.selected_key2 != undefined){
        console.log("find path");
        const path = this.grid.shortestPath(this.selected_key1, this.selected_key2);
        console.log(path);
        if(path != undefined){
          this.highlight_path = path;
        }
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

  protected override handleMouseDown(ev: MouseEvent){
    if(this.mouse_over != undefined){
      if(this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_key){
        if(this.selected_key1 == undefined){
          this.selected_key1 = this.mouse_over;
          console.log("setting1")
        }
        else if(this.selected_key2 == undefined && !this.selected_key1.equals(this.mouse_over)){
          this.selected_key2 = this.mouse_over;
          console.log("setting2")
        }
        else{
          if(this.selected_key1.equals(this.mouse_over)){
            if(this.selected_key2 != undefined){
              this.selected_key1 = this.selected_key2;
              this.selected_key2 = undefined;
            }else{
              this.selected_key1 = undefined;
            }
          }
          else if(this.selected_key2 != undefined && this.selected_key2.equals(this.mouse_over)){
            this.selected_key2 = undefined;
          }else{
            this.selected_key1 = this.selected_key2;
            this.selected_key2 = this.mouse_over;
          }
        }
      }else{
        if(this.selected_key1 != undefined){
          console.log("adding copy");
          this.key_positions.push(this.mouse_over.copy());
          this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_key = true;
          const path = Grid.GridPosition.randomPointToPoint1TurnTrack(this.mouse_over, this.selected_key1);
          this.grid.addTrack(path);
        }
      }
    }
    //this.adding_position
  }

  protected override handleMouseUp(ev: MouseEvent): void {
    
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

interface MultiColourTileShader{
  setLeftColour:(r: Float, g: Float, b: Float) => void;
  setBotColour:(r: Float, g: Float, b: Float) => void;
  setRightColour:(r: Float, g: Float, b: Float) => void;
  setTopColour:(r: Float, g: Float, b: Float) => void;
  setMidColour:(r: Float, g: Float, b: Float) => void;
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
  sprite_sheet_shader: Shader.MVPSpriteSheetProgram;
  multi_colour_tile_shader: Shader.MVPMultiColourPathProgram;
  texture_shader: Shader.MVPTextureProgram;
  vp: Matrix.TransformationMatrix3x3;
  draw_width: Int32;
  draw_height: Int32;

  //test_tex: Texture.Texture;
  font: Texture.CustomFont;
  render_string: string;

  constructor(w: Int32, h: Int32){
    this.grid_tile_shader = new Shader.MVPSolidPathProgram();
    this.pri_tile_shader = new Shader.MVPPathCenterCircleProgram();
    this.multi_colour_tile_shader = new Shader.MVPMultiColourPathProgram();
    this.solid_shader = new Shader.MVPColourProgram();
    this.sprite_sheet_shader = new Shader.MVPSpriteSheetProgram();
    this.texture_shader = new Shader.MVPTextureProgram();
    this.draw_width = w;
    this.draw_height = h;
    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
    //Texture.Texture.setup();
    //this.test_tex = new Texture.Texture("letters_Sheet.png");
    //this.test_tex.load();
    //this.test_tex.active(0);

    this.font = new Texture.CustomFont("letters_Sheet.png");
    this.font.load();
    this.font.active(0);

    this.render_string = "cabbac";
  }
  drawString(s: string, x: Int32, y: Int32, size: Int32){
    const gl = WebGL.gl!;
    const scale = Matrix.TransformationMatrix3x3.scale(size, size);
    this.sprite_sheet_shader.use();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    for(let i = 0; i < s.length; i++){
      const translate = Matrix.TransformationMatrix3x3.translate(x+size*i, y);
      const model = translate.multiplyCopy(scale);
      this.sprite_sheet_shader.setMvp(this.vp.multiplyCopy(model));
      this.font.setChar(this.sprite_sheet_shader, s[i]);
      Shapes.Quad.draw();
    }
    gl.disable(gl.BLEND);
  }
  drawKeyTile(engine: WallEngine, x: Int32, y: Int32){
    //expects shader vars setup
    const gs = engine.rect_grid.size;
    const tx = x*gs;
    const ty = y*gs;
    this.pri_tile_shader.use();
    const is_key1 = engine.selected_key1 != undefined && engine.selected_key1.x == x && engine.selected_key1.y == y;
    const is_key2 = engine.selected_key2 != undefined && engine.selected_key2.x == x && engine.selected_key2.y == y;
    if(is_key1 || is_key2){
      this.pri_tile_shader.setColour(1, 0, 1);
    }else{
      this.pri_tile_shader.setColour(0, 1, 1);
    }

    const model = Matrix.TransformationMatrix3x3.translate(tx, ty);
    model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));

    this.setTile(this.pri_tile_shader, engine.grid, x, y);
    this.pri_tile_shader.setMvp(this.vp.multiplyCopy(model));
    Shapes.Quad.drawRelative();
  }
  drawWallTile(engine: WallEngine, x: Int32, y: Int32){
    const gs = engine.rect_grid.size;
    const tx = x*gs;
    const ty = y*gs;
    const model = Matrix.TransformationMatrix3x3.translate(tx, ty);
    model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
    this.grid_tile_shader.use();
    this.setTile(this.grid_tile_shader, engine.grid, x, y);
    this.grid_tile_shader.setSize(0.2);
    this.grid_tile_shader.setMvp(this.vp.multiplyCopy(model));
    Shapes.Quad.drawRelative();
  }
  render(engine: WallEngine){
    //const perspective = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
    const gs = engine.rect_grid.size;
    
    //const ctx = WebGL.gl;
    //setup shader vars
    this.grid_tile_shader.use();
    this.grid_tile_shader.setBackgroundColour(1.0, 1.0, 0.0);
    this.grid_tile_shader.setColour(0.0, 0.0, 1.0);

    this.pri_tile_shader.use();
    this.pri_tile_shader.setCircleRadius(0.18);
    this.pri_tile_shader.setSize(0.2);
    this.pri_tile_shader.setColour(0, 1, 1);
    this.pri_tile_shader.setBackgroundColour(1, 1, 0);

    for(let y = 0; y < engine.grid.height; y++){
      for(let x = 0; x < engine.grid.width; x++){
        if(engine.grid.grid[y][x].is_key){
          this.drawKeyTile(engine, x, y);
        }
        else{
          this.drawWallTile(engine, x, y);
        }
      }
    }
    this.grid_tile_shader.use();
    this.grid_tile_shader.setColour(1, 0, 0);
    for(let i = 1; i < engine.highlight_path.length-1; i++){
      //this.solid_shader.use();
      //this.solid_shader.setColour(0.5, 0.5, 0);
      const cell = engine.highlight_path[i];
      //const model = WebGL.rectangleModel(cell.x*gs, cell.y*gs, gs, gs);
      //this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      //this.grid_tile_shader.setMvp(this.vp.multiplyCopy(model));
      this.drawWallTile(engine, cell.x, cell.y);
      //Shapes.Quad.draw();
    }

    this.drawString(this.render_string, 100, 100, 25);

    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setBackgroundColour(1.0, 0.5, 0.5);
    this.setMultiTile(this.multi_colour_tile_shader, false, true, true, false, Colour.ColourUtils.green(), Colour.ColourUtils.white());
    this.multi_colour_tile_shader.setSize(0.1);
    const tm = Matrix.TransformationMatrix3x3.scale(gs, gs);
    this.multi_colour_tile_shader.setMvp(this.vp.multiplyCopy(tm));
    Shapes.Quad.drawRelative();

    /*
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
    }*/
   /*
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
    */
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
  setMultiTile(shader: MultiColourTileShader, left: boolean, top: boolean, right: boolean, bot: boolean, active_colour: Colour.ColourRGB, inactive_colour: Colour.ColourRGB){
    if(left || top || right || bot){
      shader.setMidColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setMidColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(left){
      shader.setLeftColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setLeftColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(top){
      shader.setTopColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setTopColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(right){
      shader.setRightColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setRightColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(bot){
      shader.setBotColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setBotColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
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