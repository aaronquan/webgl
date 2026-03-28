import * as Matrix from "../WebGL/Matrix/matrix";
import * as App from "./app";
import * as Grid from "./grid"
import * as Shader from "./../WebGL/Shaders/custom";
import * as Shapes from '../WebGL/Shapes/Shapes';
import * as Texture from "./../WebGL/Texture/texture";
import * as Colour from "./../WebGL/colour";
import * as WebGL from "../WebGL/globals";
import * as Button from "./../Interface/button"

import * as ArrayUtils from "../utils/array";


interface Point extends Button.Point{};

type Int32 = number;
type Float = number;
type VoidFunction = () => void;
const EmptyFunction: VoidFunction = () => {};

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
    locations.push(pick);
  }


  return locations;
}

type TrackPosition = {
  distance_covered: Float,
  move_index: Int32
}

const NodeTypeEnum = {
  Basic: 0,
  Resource: 1,
  Requirement: 2
} as const;

type NodeType = (typeof NodeTypeEnum)[keyof typeof NodeTypeEnum];


//no capacity
class KeyNode{
  x: Int32;
  y: Int32;
  inventory: Map<Resource, Int32>;
  type: NodeType;
  constructor(x: Int32, y: Int32, ty: NodeType=NodeTypeEnum.Basic){
    this.x = x;
    this.y = y;
    this.inventory = new Map();
    this.type = ty;
    this.initialiseDefaultInventory();
  }

  protected initialiseDefaultInventory(){
    this.inventory.set(ResourceEnum.Water, 0);
    this.inventory.set(ResourceEnum.Apple, 0);
  }

  //can override
  update(t: Float){
    
  }
  distanceSq(p: Point){
    const dx = p.x - this.x - 0.5;
    const dy = p.y - this.y - 0.5;
    return dx*dx + dy*dy;
  }
  drawNodeUI(perspective: Matrix.TransformationMatrix3x3, solid_shader: Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer, 
    x: Float, y: Float){
    const white = WebGL.Colour.ColourUtils.white();
    solid_shader.use();
    const back_model = WebGL.WebGL.rectangleModel(x, y, 70, 70);
    solid_shader.setColour(0, 0, 0);
    solid_shader.setMvp(perspective.multiplyCopy(back_model));
    Shapes.Quad.draw();

    //details
    text_drawer.drawTextColour(perspective, x, y, this.x.toFixed(0), 15, white);
    text_drawer.drawTextColour(perspective, x, y+15, this.y.toFixed(0), 15, white);
  }
  getResourceInventory(res: Resource): Int32{
    if(!this.inventory.has(res)) return 0;
    return this.inventory.get(res)!;
  }
  deliverResource(){

  }

  //return number drawn from node
  drawResource(res: Resource, amount: Int32): Int32{
    const count = this.inventory.get(res)!;
    if(count > 0){
      if(count < amount){
        this.inventory.set(res, 0);
        return count;
      }
      this.inventory.set(res, count-amount);
      return amount;
    }
    return 0;
  }
}

class RequirementNode extends KeyNode{
  constructor(x: Int32, y: Int32){
    super(x, y);
  }
}

class ResourceGeneratorNode extends KeyNode{
  current_time: Float;
  gen_time: Float;
  resource: Resource;
  constructor(x: Int32, y: Int32){
    super(x, y);
    this.current_time = 0;
    this.gen_time = 1000;
    this.resource = ResourceEnum.Water;
    this.type = NodeTypeEnum.Resource;
  }
  update(t: Float){
    this.current_time += t;
    if(this.current_time >= this.gen_time){
      this.current_time -= this.gen_time;
      const n_resources = this.inventory.get(this.resource)!;
      this.inventory.set(this.resource, n_resources+1);
    }
  }
  drawNodeUI(perspective: Matrix.TransformationMatrix3x3, solid_shader: Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer, 
    x: Float, y: Float){
    const white = WebGL.Colour.ColourUtils.white();
    solid_shader.use();
    const back_model = WebGL.WebGL.rectangleModel(x, y, 70, 70);
    solid_shader.setColour(0, 0, 0);
    solid_shader.setMvp(perspective.multiplyCopy(back_model));
    Shapes.Quad.draw();

    //details
    text_drawer.drawTextColour(perspective, x, y, this.x.toFixed(0), 15, white);
    text_drawer.drawTextColour(perspective, x, y+15, this.y.toFixed(0), 15, white);

  }
}

const ResourceEnum = {
  Water: 0,
  Apple: 1,
} as const;

type Resource = (typeof ResourceEnum)[keyof typeof ResourceEnum];

export class Car{
  //coordinates are from top-left corner
  x: Float; // center point 
  y: Float;
  size: Float;
  plan: Grid.Track | undefined;
  plan_position: TrackPosition;
  plan_index: Int32;
  turn_speed: Float; // per second?
  speed: Float; // per second
  rotation: Float; // in radians
  last_key: Grid.GridPosition | undefined;
  inventory: Resource | undefined;
  constructor(){
    this.x = 0;
    this.y = 0;
    this.size = 0.2;
    this.plan = undefined;
    this.plan_position = {distance_covered: 0, move_index: 0};
    this.plan_index = 0;
    this.speed = 0.01;
    this.turn_speed = 0.05;
    this.rotation = 0;
    this.last_key = undefined;
  }

  setPlan(plan: Grid.Track){
    //console.log(plan);
    this.plan = plan;
    this.x = plan.starting_location.x+0.5;
    this.y = plan.starting_location.y+0.5;
    this.last_key = plan.starting_location;
    //this.rotation = Grid.DirectionUtil.turnDirectionToRadians(plan.part.getMoves()[0].direction);
    this.plan_position = {distance_covered: 0, move_index: 0};
    //console.log(this.plan.part.getMoves().at(0)?.direction);
  }
  update(t:Float){
    if(this.plan){
      const moves = this.plan.part.getMoves();
      const dir = moves[this.plan_position.move_index].direction;
      const dir_movement = Grid.DirectionUtil.directions[dir];
      const target_rotation = Grid.DirectionUtil.turnDirectionToRadians(dir);
      const turn = Grid.DirectionUtil.getTurnDirection(dir, this.rotation);
      if(turn === Grid.TurnDirectionEnum.Clockwise){
        if(this.rotation + this.turn_speed > target_rotation && this.rotation < target_rotation){
          this.rotation = target_rotation;
          //console.log("stop rot clock");
        }else{
          this.rotation += this.turn_speed;
          this.rotation %= (Math.PI*2);
        }
      }else if(turn === Grid.TurnDirectionEnum.AntiClockwise){
        if(this.rotation - this.turn_speed < target_rotation && this.rotation > target_rotation){
          this.rotation = target_rotation;
          //console.log("stop rot anti");
        }else{
          this.rotation -= this.turn_speed;
          if(this.rotation < 0){
            this.rotation += Math.PI*2;
          }
        }
      }
      else if(this.plan_position.distance_covered+this.speed >= moves[this.plan_position.move_index].distance){
        const remaining = moves[this.plan_position.move_index].distance-this.plan_position.distance_covered;
        this.x += dir_movement.x*remaining;
        this.y -= dir_movement.y*remaining;
        if(this.plan_position.move_index+1 >= moves.length){
          this.plan_position = {distance_covered: 0, move_index: 0};
          this.last_key = this.plan.endPoint();
          this.plan = undefined;
        }else{
          this.plan_position = {distance_covered: 0, move_index: this.plan_position.move_index+1};
        }
      }else{
        this.x += dir_movement.x*this.speed;
        this.y -= dir_movement.y*this.speed;
        this.plan_position.distance_covered += this.speed;
      }
    }
  }
}

class ResourceCar{
  capacity: Int32;
  inventory: Map<Resource, Int32>;
  current_capacity: Int32;

  constructor(){
    this.capacity = 1;
    this.inventory = new Map();
    this.current_capacity = 0;
  }
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
  true_mouse: Matrix.Point2D | undefined;
  grid_true_mouse: Matrix.Point2D | undefined;

  highlighted_positions: Grid.GridPosition[];
  is_circle_positions: boolean;

  key_positions: Grid.GridPosition[];
  adding_position: Grid.GridPosition | undefined;
  adding_path_hori_first: boolean;

  selected_key1: Grid.GridPosition | undefined;
  selected_key2: Grid.GridPosition | undefined;

  test_objects: MultiGridObject[];

  highlight_path: Grid.GridPositionWithDirections[];
  car: Car;

  resource_car: ResourceCar;

  buttons: Button.ButtonSet;

  hovered_node: KeyNode | undefined;
  nodes: KeyNode[];
  node_size: Float;

  view: Matrix.TransformationMatrix3x3;

  overlay_element: HTMLDivElement | undefined;

  last_time: Float;

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
    this.nodes = [];
    //this.nodes = this.key_positions.map((pos) => {
    //  return new KeyNode(pos.x, pos.y);
    //});
    this.node_size = 0.15;

    this.car = new Car();
    this.resource_car = new ResourceCar();

    if(this.key_positions.length >= 2){
      for(let i = 1; i < this.key_positions.length; i++){
        const path = Grid.GridPosition.randomPointToPoint1TurnTrack(this.key_positions[i-1], this.key_positions[i]);
        this.grid.addTrack(path);
        this.grid.grid[this.key_positions[i].y][this.key_positions[i].x].is_key = true;
        if(i == this.key_positions.length-1){
          this.car.setPlan(path);
        }
      }
      this.grid.grid[this.key_positions[0].y][this.key_positions[0].x].is_key = true;
    }
    const sh_path = this.grid.shortestPath(this.key_positions[0], this.key_positions[1]);
    console.log(sh_path);
    
    this.test_objects = [];
    this.adding_path_hori_first = true;
    this.highlight_path = [];

    this.buttons = new Button.ButtonSet();

    const car_plan_button = new Button.BasicButton(10, 10, 80, 50);
    car_plan_button.text = "New Plan";
    car_plan_button.onPressed = () => {
      console.log(this.car.last_key);
      if(this.car.last_key){
        const next_key = this.randomKeyOtherThan1(this.car.last_key);
        const path = this.grid.shortestPath(this.car.last_key, next_key);
        //console.log(path);
        if(path != undefined && this.car.plan == undefined){
          const track = Grid.GridAlgorithms.pathToTrack(path);
          this.car.setPlan(track);
        }
      }
    }
    this.buttons.addButton(car_plan_button);

    this.view = Matrix.TransformationMatrix3x3.identity();

    this.createKeyNodes();
    this.last_time = 0;

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
  addOverlayElement(overlay: HTMLDivElement){
    this.overlay_element = overlay;
  }
  onFinishLoading(){
    if(this.overlay_element != undefined){
      this.overlay_element.textContent = "";
    }
  }
  createKeyNodes(){
    this.nodes = [];
    const rand_arr = ArrayUtils.random0ToN(this.key_positions.length);
    console.log(rand_arr);
    const res_node = new ResourceGeneratorNode(this.key_positions[rand_arr[0]].x, this.key_positions[rand_arr[0]].y);

    this.nodes.push(res_node);

    const deliver_node = new RequirementNode(this.key_positions[rand_arr[1]].x, this.key_positions[rand_arr[1]].y);
    this.nodes.push(deliver_node);

    for(let i = 2; i < this.key_positions.length; i++){
      this.nodes.push(new KeyNode(this.key_positions[rand_arr[i]].x, this.key_positions[rand_arr[i]].y));
    }
    console.log(this.nodes);
  }
  randomKeyOtherThan1(not_included: Grid.GridPosition){
    const others = this.key_positions.filter((p) => {
      return !(not_included.x === p.x && not_included.y === p.y);
    });
    return others[Math.floor(Math.random()*others.length)];
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
        for(const dir_pos of this.highlight_path){
          this.grid.setCellStateFromActive(dir_pos.position.x, dir_pos.position.y, dir_pos.directions, Grid.TileStateEnum.Path);
        }
        this.highlight_path = [];
      }
      else if(this.selected_key1 != undefined && this.selected_key2 != undefined){
        console.log("find path");
        const path = this.grid.shortestPath(this.selected_key1, this.selected_key2);
        console.log(path);
        if(path != undefined){
          //this.highlight_path = path;
          const dir_path_positions = Grid.GridAlgorithms.positionPathToDirectionPath(path);
          for(const dir_pos of dir_path_positions){
            this.grid.setCellStateFromActive(dir_pos.position.x, dir_pos.position.y, dir_pos.directions, Grid.TileStateEnum.Highlight);
          }
          this.highlight_path = dir_path_positions;
          console.log(dir_path_positions);
          console.log(this.grid);
        }
      }
    }else if(ev.key == 'a'){
      this.view.translate(-this.rect_grid.size, 0);
    }else if(ev.key == 'd'){
      this.view.translate(this.rect_grid.size, 0);
    }
  }
  protected override handleMouseMove(ev: MouseEvent): void {
    const true_mouse = new Matrix.Point2D(ev.offsetX, ev.offsetY);
    this.true_mouse = true_mouse;
    const inv = this.view.copy();
    inv.invert();
    this.grid_true_mouse = inv.transformPoint(true_mouse);
    this.grid_true_mouse.x/=this.rect_grid.size;
    this.grid_true_mouse.y/=this.rect_grid.size;
    const pos = this.rect_grid.getPosition(ev.offsetX, ev.offsetY);
    if(pos != undefined){
      if(this.mouse_over == undefined || (this.mouse_over.x != pos.x || this.mouse_over.y != pos.y)){
        this.setHighlightedPositions(pos);
      }
      this.buttons.updateMouse(true_mouse);
    }else{
      this.highlighted_positions = [];
    }
    this.mouse_over = pos;

    const true_grid = this.getGridTruePosition(ev.offsetX, ev.offsetY);
    this.hovered_node = undefined;
    for(const node of this.nodes){
      const dist = node.distanceSq(true_grid);
      //console.log(node);
      //console.log(dist);
      if(dist < this.node_size*this.node_size){
        this.hovered_node = node;
      }
    }
    //this.mouse_over = pos;
  }

  protected override handleMouseDown(ev: MouseEvent){
    if(this.mouse_over != undefined){
      if(this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_key){
        if(this.selected_key1 == undefined){
          //set key1
          this.selected_key1 = this.mouse_over;
          this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_selected = true;
          console.log("setting1")
        }
        else if(this.selected_key2 == undefined && !this.selected_key1.equals(this.mouse_over)){
          //set key2
          this.selected_key2 = this.mouse_over;
          this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_selected = true;
          console.log("setting2")
        }
        else{
          if(this.selected_key1.equals(this.mouse_over)){
            //remove key1
            this.grid.grid[this.selected_key1.y][this.selected_key1.x].is_selected = false;
            if(this.selected_key2 != undefined){
              this.selected_key1 = this.selected_key2;
              this.selected_key2 = undefined;
            }else{
              this.selected_key1 = undefined;
            }
          }
          else if(this.selected_key2 != undefined && this.selected_key2.equals(this.mouse_over)){
            //remove key 2
            this.grid.grid[this.selected_key2.y][this.selected_key2.x].is_selected = false;
            this.selected_key2 = undefined;
          }else{
            //replace key1
            this.grid.grid[this.selected_key1.y][this.selected_key1.x].is_selected = false;
            this.grid.grid[this.mouse_over.y][this.mouse_over.x].is_selected = true;
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
      this.buttons.mouseDown();
    }
    
    //this.adding_position
  }

  protected override handleMouseUp(ev: MouseEvent): void {
    this.buttons.mouseUp();
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

  getGridTruePosition(x: Float, y: Float): Matrix.Point2D{
    const inv = this.view.copy();
    inv.invert();
    this.grid_true_mouse = inv.transformPoint(new Matrix.Point2D(x, y));
    this.grid_true_mouse.x/=this.rect_grid.size;
    this.grid_true_mouse.y/=this.rect_grid.size;
    return this.grid_true_mouse;
  }

  update(time: Float){
    const update_time = time - this.last_time;
    for(const node of this.nodes){
      node.update(update_time);
    }
    this.car.update(update_time);
    this.last_time = time;
  }
}

interface MultiColourTileShader{
  setLeftColour:(r: Float, g: Float, b: Float) => void;
  setBotColour:(r: Float, g: Float, b: Float) => void;
  setRightColour:(r: Float, g: Float, b: Float) => void;
  setTopColour:(r: Float, g: Float, b: Float) => void;
  setMidColour:(r: Float, g: Float, b: Float) => void;
}

interface DirectionTileShader extends TileShader{
  setLeft:(v: number) => void;
  setBot:(v: number) => void;
  setRight:(v: number) => void;
  setTop:(v: number) => void;
}

interface TileShader{
  use: () => void;
  setSize: (s: Float) => void;
  setMvp: (mat: Matrix.Matrix3x3) => void;
}

export class WallRenderer implements App.IEngineRenderer<WallEngine>{
  grid_tile_shader: Shader.MVPSolidPathProgram;
  pri_tile_shader: Shader.MVPPathCenterCircleProgram;
  solid_shader: Shader.MVPColourProgram;
  sprite_sheet_shader: Shader.MVPSpriteSheetProgram;
  multi_colour_tile_shader: Shader.MVPMultiColourPathProgram;
  multi_colour_centre_circle_shader: Shader.MVPMultiColourCentreCirclePathProgram;

  text_drawer: WebGL.TextDrawer;
  fonts: WebGL.FontLoader;

  tile_state_colours: Map<Grid.TileState, Colour.ColourRGB>;
  background_colour: Colour.ColourRGB;
  key_colour: Colour.ColourRGB;

  texture_shader: Shader.MVPTextureProgram;
  vp: Matrix.TransformationMatrix3x3;
  perspective: Matrix.TransformationMatrix3x3;
  draw_width: Int32;
  draw_height: Int32;

  render_string: string;

  textures: Texture.TextureCollection;

  white: Colour.ColourRGB;

  overlay_element: HTMLDivElement | undefined;

  constructor(w: Int32, h: Int32){
    this.grid_tile_shader = new Shader.MVPSolidPathProgram();
    this.pri_tile_shader = new Shader.MVPPathCenterCircleProgram();
    this.multi_colour_tile_shader = new Shader.MVPMultiColourPathProgram();
    this.multi_colour_centre_circle_shader = new Shader.MVPMultiColourCentreCirclePathProgram();
    this.solid_shader = new Shader.MVPColourProgram();
    this.sprite_sheet_shader = new Shader.MVPSpriteSheetProgram();
    this.texture_shader = new Shader.MVPTextureProgram();

    this.text_drawer = new WebGL.TextDrawer();
    this.fonts = new WebGL.FontLoader();

    this.draw_width = w;
    this.draw_height = h;
    this.perspective = Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
    this.vp = Matrix.TransformationMatrix3x3.identity();

    this.textures = new Texture.TextureCollection();


    //Texture.Texture.setup();
    //this.test_tex = new Texture.Texture("letters_Sheet.png");
    //this.test_tex.load();
    //this.test_tex.active(0);

    //this.font = new Texture.CustomFont("letters-Sheet.png");
    //this.font.load();
    //this.font.active(0);

    this.render_string = "hello world";

    this.tile_state_colours = new Map();
    this.tile_state_colours.set(Grid.TileStateEnum.Nothing, Colour.ColourUtils.yellow());
    this.tile_state_colours.set(Grid.TileStateEnum.Highlight, Colour.ColourUtils.red());
    this.tile_state_colours.set(Grid.TileStateEnum.Path, Colour.ColourUtils.blue());

    this.background_colour = Colour.ColourUtils.yellow();
    this.key_colour = Colour.ColourUtils.pink();

    //set some default shader properties
    this.multi_colour_centre_circle_shader.use();
    this.multi_colour_centre_circle_shader.setSize(0.1);
    this.multi_colour_centre_circle_shader.setCircleRadius(0.15);
    this.multi_colour_centre_circle_shader.setBackgroundColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);

    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setSize(0.1);
    this.multi_colour_tile_shader.setBackgroundColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);

    this.white = WebGL.Colour.ColourUtils.white();

  }
  loadTextures(onLoad:VoidFunction=EmptyFunction){
    //load textures
    if(this.overlay_element != undefined){
      this.overlay_element.textContent = "Loading Textures...";
    }
    setTimeout(() => {
      const texture_names = ["car.png", "base.png"];
      this.textures.addFromUrl("car", "car.png");
      this.textures.addFromUrl("drop", "drop.png");
      
      this.textures.load(() => this.loadFonts(onLoad));
    }, 2000)
  }
  loadFonts(onLoad:VoidFunction=EmptyFunction){
    if(this.overlay_element != undefined){
      this.overlay_element.textContent = "Loading Fonts...";
    }
    setTimeout(() => {
      const font_name = "letters-Sheet.png";
      const fn = "font16-Sheet.png";
      //this.fonts.addFont(font_name);
      this.fonts.addFont(fn);
      this.fonts.loadFonts(() => {
        //this.text_drawer.setFont(this.fonts.getFont(font_name)!);
        this.text_drawer.setFont(this.fonts.getFont(fn)!);
        this.text_drawer.loadFont();
        console.log("finished loading");
        if(onLoad) onLoad();
      });
    }, 1000);
  }
  addOverlayElement(overlay: HTMLDivElement){
    this.overlay_element = overlay;
  }
  /*
  drawString(s: string, x: Int32, y: Int32, size: Int32){
    const gl = WebGL.WebGL.gl!;
    const scale = Matrix.TransformationMatrix3x3.scale(size, size);
    this.sprite_sheet_shader.use();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    for(let i = 0; i < s.length; i++){
      if(s[i] == ' ') continue;
      const translate = Matrix.TransformationMatrix3x3.translate(x+size*i, y);
      const model = translate.multiplyCopy(scale);
      this.sprite_sheet_shader.setMvp(this.vp.multiplyCopy(model));
      this.font.setChar(this.sprite_sheet_shader, s[i]);
      Shapes.Quad.draw();
    }
    gl.disable(gl.BLEND);
  }*/
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
  drawMultiKeyTile(engine: WallEngine, x: Int32, y: Int32){
    this.multi_colour_centre_circle_shader.use();
    const gs = engine.rect_grid.size;
    const model = WebGL.WebGL.rectangleModel(x*gs, y*gs, gs, gs);
    this.multi_colour_centre_circle_shader.setMvp(this.vp.multiplyCopy(model));
    this.setMultiTile(engine, this.multi_colour_centre_circle_shader, x, y);
    Shapes.Quad.draw();
    //this.setMultiTile(this.multi_colour_centre_circle_shader, engine.grid.grid[y][x].);
  }
  drawMultiWallTile(engine: WallEngine, x: Int32, y: Int32){
    this.multi_colour_tile_shader.use();
    const gs = engine.rect_grid.size;
    const model = WebGL.WebGL.rectangleModel(x*gs, y*gs, gs, gs);
    this.multi_colour_tile_shader.setMvp(this.vp.multiplyCopy(model));
    this.setMultiTile(engine, this.multi_colour_tile_shader, x, y);
    Shapes.Quad.draw();
  }
  drawWallTile(shader: DirectionTileShader, engine: WallEngine, x: Int32, y: Int32){
    const gs = engine.rect_grid.size;
    const tx = x*gs;
    const ty = y*gs;
    const model = Matrix.TransformationMatrix3x3.translate(tx, ty);
    model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
    shader.use();
    this.setTile(shader, engine.grid, x, y);
    shader.setSize(0.2);
    shader.setMvp(this.vp.multiplyCopy(model));
    Shapes.Quad.drawRelative();
  }
  drawCar(engine: WallEngine){
    const car = engine.car;
    const gs = engine.rect_grid.size;
    const cs = car.size*gs;
    this.texture_shader.use();
    this.textures.active("car", 2);
    this.texture_shader.setTextureId(2);
    const model = WebGL.WebGL.rectangleModel(car.x*gs, car.y*gs, cs, cs);
    model.rotate(car.rotation+Math.PI);
    this.texture_shader.setMvp(this.vp.multiplyCopy(model));
    Shapes.CenterQuad.draw();
  }
  render(engine: WallEngine){
    //const perspective = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
    const gs = engine.rect_grid.size;
    this.vp = this.perspective.multiplyCopy(engine.view);
    
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
          this.drawMultiKeyTile(engine, x, y);
        }
        else{
          this.drawMultiWallTile(engine, x, y);
        }
      }
    }
    //this.grid_tile_shader.use();
    //this.grid_tile_shader.setColour(1, 0, 0);
    /*
    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setBackgroundColour(1, 1, 0);
    for(let i = 1; i < engine.highlight_path.length-1; i++){
      //this.solid_shader.use();
      //this.solid_shader.setColour(0.5, 0.5, 0);
      const cell = engine.highlight_path[i];
      //const model = WebGL.rectangleModel(cell.x*gs, cell.y*gs, gs, gs);
      //this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      //this.grid_tile_shader.setMvp(this.vp.multiplyCopy(model));
      this.setMultiTile(this.multi_colour_tile_shader, 
        cell.directions.left, cell.directions.up, 
        cell.directions.right, cell.directions.down,
        Colour.ColourUtils.red(), Colour.ColourUtils.yellow()
      );
      const tx = cell.position.x*gs;
      const ty = cell.position.y*gs;
      const model = Matrix.TransformationMatrix3x3.translate(tx, ty);
      model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
      this.multi_colour_tile_shader.use();
      this.multi_colour_tile_shader.setSize(0.2);
      this.multi_colour_tile_shader.setMvp(this.vp.multiplyCopy(model));
      Shapes.Quad.drawRelative();
      //Shapes.Quad.draw();
    }*/

    this.text_drawer.drawText(this.vp, 100, 100, this.render_string, 25);
    this.text_drawer.drawText(this.vp, 20, 200, "what is going on lets print this hhbbvv", 15);

    /*
    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setBackgroundColour(1.0, 0.5, 0.5);
    this.setMultiTile(this.multi_colour_tile_shader, false, true, true, false, Colour.ColourUtils.green(), Colour.ColourUtils.white());
    this.multi_colour_tile_shader.setSize(0.1);
    const tm = Matrix.TransformationMatrix3x3.scale(gs, gs);
    this.multi_colour_tile_shader.setMvp(this.vp.multiplyCopy(tm));
    Shapes.Quad.drawRelative();*/
    
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
   /*
    this.multi_colour_centre_circle_shader.use();
    //this.multi_colour_centre_circle_shader.setBackgroundColour(0.1, 0.8, 0.2);
    this.multi_colour_centre_circle_shader.setCircleRadius(0.2);
    this.multi_colour_centre_circle_shader.setSize(0.2);
    this.multi_colour_centre_circle_shader.setMidColour(0.8, 0.2, 0.3);
    this.multi_colour_centre_circle_shader.setBotColour(0.8, 0.2, 0.3);
    const tm = Matrix.TransformationMatrix3x3.scale(gs, gs);
    this.multi_colour_centre_circle_shader.setMvp(this.vp.multiplyCopy(tm));
    Shapes.Quad.drawRelative();
    */

    this.drawGridLines(engine);
    this.drawCar(engine);
    this.displayNodeSheet(engine);

    engine.buttons.draw(this.perspective, this.solid_shader, this.text_drawer);

    if(engine.true_mouse){
      //console.log(engine.true_mouse)
      const text = `x ${engine.true_mouse.x}, y ${engine.true_mouse.y}`;
      this.text_drawer.drawText(this.vp, 40, 300, text, 15);
    }
    if(engine.grid_true_mouse){
      const text = `x ${engine.grid_true_mouse.x.toFixed(2)}, y ${engine.grid_true_mouse.y.toFixed(2)}`;
      this.text_drawer.drawText(this.vp, 40, 400, text, 15);
    }
    //requestAnimationFrame((time) => this.render(time, engine));
  }
  drawGridLines(engine: WallEngine){
    this.solid_shader.use();
    this.solid_shader.setColour(0.1,0.1,0.1);
    const line_thickness = 2;
    const half_thickness = line_thickness/2;
    for(let y = 0; y <= engine.grid.height; y++){
      const model = WebGL.WebGL.rectangleModel(0, y*engine.rect_grid.size-half_thickness, engine.rect_grid.pixel_width, line_thickness);
      this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      Shapes.Quad.drawRelative();
    }
    for(let x = 0; x <= engine.grid.width; x++){
      const model = WebGL.WebGL.rectangleModel(x*engine.rect_grid.size-half_thickness, 0, line_thickness, engine.rect_grid.pixel_height)
      this.solid_shader.setMvp(this.vp.multiplyCopy(model));
      Shapes.Quad.drawRelative();
    }
    Shapes.Quad.draw();
  }
  setMultiTile(engine: WallEngine, shader: MultiColourTileShader, x: Int32, y: Int32){
    const tile = engine.grid.grid[y][x];
    const direction_tile_functions = [
      {var: tile.left, colour_func: shader.setLeftColour}, 
      {var: tile.right, colour_func: shader.setRightColour},
      {var: tile.bottom, colour_func: shader.setTopColour},
      {var: tile.top, colour_func: shader.setBotColour}
    ];
    for(const var_func of direction_tile_functions){
      const colour = this.tile_state_colours.get(var_func.var)!;
      var_func.colour_func.apply(shader, [colour.red, colour.green, colour.blue]);
    }
    if(tile.is_selected){
      shader.setMidColour(this.key_colour.red, this.key_colour.green, this.key_colour.blue);
    }else if(tile.bottom == Grid.TileStateEnum.Nothing && tile.left == Grid.TileStateEnum.Nothing 
      && tile.top == Grid.TileStateEnum.Nothing && tile.right == Grid.TileStateEnum.Nothing){
        shader.setMidColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);
    }else{
      const c = this.tile_state_colours.get(Grid.TileStateEnum.Path)!;
      shader.setMidColour(c.red, c.green, c.blue);
    }
    //this.setMultiTile(shader, tile.);
  }
  drawResource(res: Resource, x: Float, y: Float){
    this.texture_shader.use();
    switch(res){
      case ResourceEnum.Water:
        this.textures.active("drop", 3);
        this.texture_shader.setTextureId(3);
        break;
      case ResourceEnum.Apple:
        break;
    }
    const model = WebGL.WebGL.rectangleModel(x, y, 20, 20);
    this.texture_shader.setMvp(this.perspective.multiplyCopy(model));
    Shapes.Quad.draw();
  }
  displayNodeSheet(engine: WallEngine){
    if(engine.hovered_node != undefined && engine.true_mouse != undefined){
      //background
      const x = engine.true_mouse.x+20;
      const y = engine.true_mouse.y;
      engine.hovered_node.drawNodeUI(this.perspective, this.solid_shader, this.text_drawer, x, y);

      if(engine.hovered_node.type === NodeTypeEnum.Resource){
        const res_node = engine.hovered_node as ResourceGeneratorNode;
        //show resources in node //TODO
        this.text_drawer.drawText(this.perspective, x, y+31, "Res", 15);
        this.drawResource(res_node.resource, x, y+46);
        this.text_drawer.drawText(this.perspective, x+15, y+46, res_node.getResourceInventory(res_node.resource).toString(), 15);

      }else if(engine.hovered_node.type == NodeTypeEnum.Requirement){
        this.text_drawer.drawText(this.perspective, x, y+31, "Req", 15);
      }

      /*
      this.solid_shader.use();
      const back_model = WebGL.WebGL.rectangleModel(x, y, 70, 70);
      this.solid_shader.setColour(0, 0, 0);
      this.solid_shader.setMvp(this.perspective.multiplyCopy(back_model));
      Shapes.Quad.draw();

      //details
      this.text_drawer.drawTextColour(this.perspective, x, y, engine.hovered_node.x.toFixed(0), 15, this.white);
      this.text_drawer.drawTextColour(this.perspective, x, y+15, engine.hovered_node.y.toFixed(0), 15, this.white);*/
    }
    //engine.
  }
  displayResourceNodeSheet(engine: WallEngine){
    if(engine.hovered_node != undefined && engine.true_mouse != undefined){
      //background
      const x = engine.true_mouse.x+20;
      const y = engine.true_mouse.y;
      engine.hovered_node.drawNodeUI(this.perspective, this.solid_shader, this.text_drawer, x, y);
    }
  }
  /*
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
    if(bot){
      shader.setTopColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setTopColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(right){
      shader.setRightColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setRightColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
    if(top){
      shader.setBotColour(active_colour.red, active_colour.green, active_colour.blue);
    }else{
      shader.setBotColour(inactive_colour.red, inactive_colour.green, inactive_colour.blue);
    }
  }*/
  setTile(shader: DirectionTileShader, grid: Grid.WallGrid, x: Int32, y: Int32){
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