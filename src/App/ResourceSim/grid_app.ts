import * as Matrix from "../../WebGL/Matrix/matrix";
import * as App from "./../../WebGL/app";
import * as Grid from "./grid";

//webgl imports
import * as Shader from "../../WebGL/Shaders/custom";
import * as Shapes from '../../WebGL/Shapes/Shapes';
import * as Texture from "../../WebGL/Texture/texture";
import * as Colour from "../../WebGL/colour";
import * as WebGL from "../../WebGL/globals";

import * as Node from "./nodes";
import * as Resource from "./resource";
import * as Car from "./car";
import * as NodeGraph from "./node_graph"

import * as ArrayUtils from "../../utils/array";
import * as NumberUtils from "../../utils/numbers";

import * as Texts from "./texts";

//interface imports
import * as Options from "./../../Interface/options";
import * as InternalWindow from "./../../Interface/internal_window";
import * as Button from "../../Interface/button";
import * as TextInput from "../../Interface/text_input";


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

const WallEditStateEnum = {
  Default: 0,
  Adding: 1,
  Deleting: 2,
  Selecting: 3
} as const;

type WallEditState = (typeof WallEditStateEnum)[keyof typeof WallEditStateEnum];

const GridCellSectionEnum =  {
  ...Grid.DirectionEnum,
  Center: 4
} as const;

type GridCellSection = (typeof GridCellSectionEnum)[keyof typeof GridCellSectionEnum];

export class WallEngine extends App.BaseEngine{
  grid: Grid.WallGrid;
  rect_grid: Grid.RectGrid;

  mouse_over_cell: Grid.GridPosition | undefined;
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

  car_collection: Car.CarCollection;

  buttons: Button.ButtonSet;
  toggle_buttons: Button.ToggleButtonSet;

  hovered_node: Node.KeyNode | undefined;
  nodes: Node.KeyNode[];
  node_size: Float;

  view: Matrix.TransformationMatrix3x3;

  overlay_element: HTMLDivElement | undefined;

  last_time: Float;

  node_graph: NodeGraph.RoadGraph;

  active_nodes: Map<Int32, Node.KeyNode>;
  node_id: Int32;

  edit_state: WallEditState;
  hover_grid_side: GridCellSection | undefined;

  selected_nodes: Set<Int32>;

  hovered_car: Int32 | undefined;
  selected_car: Int32 | undefined;
  car_buttons: Button.SingleSelectToggleButtonSet;

  test_text_box: TextInput.TextInput;

  graph_updated_status: boolean;

  //test_options: Options.SingleSelectOptions;
  //edit_state_options: Options.SingleSelectOptions;
  select_options: Options.SingleSelectOptions[];

  test_internal_window: InternalWindow.InternalWindow;

  constructor(){
    super();
    const w = 10; const h = 10;
    const s = 80;
    this.grid = new Grid.WallGrid(w,h);
    this.rect_grid = new Grid.RectGrid(w, h, s);
    this.mouse_over_cell = undefined;
    this.highlighted_positions = [];
    this.key_positions = [];

    this.active_nodes = new Map();
    this.node_id = 0;

    this.is_circle_positions = false;
    this.nodes = [];
    
    this.node_size = 0.15;

    this.car_collection = new Car.CarCollection();
    
    this.test_objects = [];
    this.adding_path_hori_first = true;
    this.highlight_path = [];

    this.buttons = new Button.ButtonSet();
    this.toggle_buttons = new Button.ToggleButtonSet();
    this.graph_updated_status = false;
    this.test_internal_window = new InternalWindow.InternalWindow(100, 50, 200, 200);

    // adding buttons
    const butt_x = 810;

    this.select_options = [];
    const edit_state_options = new Options.SingleSelectOptions(["Off", "Add", "Del", "Sel"], butt_x+90, 80, 15);
    edit_state_options.onSelected = (id: Int32) => {
      switch(id){
        case 0:
          this.edit_state = WallEditStateEnum.Default;
          break;
        case 1:
          this.edit_state = WallEditStateEnum.Adding;
          break;
        case 2:
          this.edit_state = WallEditStateEnum.Deleting;
          break;
        case 3:
          this.edit_state = WallEditStateEnum.Selecting;
          break;
        default:
          break;
      }
    }

    this.select_options.push(edit_state_options);

    const car_plan_button = new Button.BasicButton(butt_x, 10, 80, 25, 9);
    car_plan_button.text = "New Plan";
    car_plan_button.onPressed = () => {
      //console.log(this.car.last_key);
      this.key_positions = generateKeyLocations(this.rect_grid, 3);
      /*
      if(this.car.last_key){
        const next_key = this.randomKeyOtherThan1(this.car.last_key);
        const path = this.grid.shortestPath(this.car.last_key, next_key);
        //console.log(path);
        if(path != undefined && this.car.plan == undefined){
          const track = Grid.GridAlgorithms.pathToTrack(path);
          this.car.setPlan(track);
        }
      }*/
    }
    this.buttons.addButton(car_plan_button);

    const example_plan_button = new Button.BasicButton(butt_x, 130, 80, 25, 7);
    example_plan_button.text = "New Example";
    example_plan_button.onPressed = () => {
      this.clearGrid();
      this.key_positions = generateKeyLocations(this.rect_grid, 3);
      if(this.key_positions.length >= 2){
        for(let i = 1; i < this.key_positions.length; i++){
          const path = Grid.GridPosition.randomPointToPoint1TurnTrack(this.key_positions[i-1], this.key_positions[i]);
          this.grid.addTrack(path);
          this.grid.grid[this.key_positions[i].y][this.key_positions[i].x].is_key = true;
          if(i == this.key_positions.length-1){
            //this.car.setPlan(path);
          }
        }
        this.grid.grid[this.key_positions[0].y][this.key_positions[0].x].is_key = true;
      }
      const sh_path = this.grid.shortestPath(this.key_positions[0], this.key_positions[1]);
      this.createKeyNodes();
    }

    this.buttons.addButton(example_plan_button);

    const generate_graph_button = new Button.BasicButton(butt_x, 160, 80, 25, 8);
    generate_graph_button.text = "Gen Graph";
    generate_graph_button.onPressed = () => {
      this.node_graph.generate(this.grid, this.active_nodes);
      this.graph_updated_status = true;
    };

    this.buttons.addButton(generate_graph_button);

    const validate_button = new Button.BasicButton(butt_x, 190, 80, 25, 8);
    validate_button.text = "Validate";
    validate_button.onPressed = () => {
      const valid = this.validateGrid();
      console.log(valid);
    };
    this.buttons.addButton(validate_button);

    const clear_button = new Button.BasicButton(butt_x, 220, 80, 25, 8);
    clear_button.text = "Clear Grid";
    clear_button.onPressed = () => {
      this.clearGrid();
      this.graph_updated_status = false;
    };
    this.buttons.addButton(clear_button);

    const short_path_button = new Button.BasicButton(butt_x, 250, 80, 25, 6);
    short_path_button.text = "Shortest Path";
    short_path_button.onPressed = () => {
      if(this.selected_nodes.size == 2){
        const it = this.selected_nodes.values();
        const first = it.next().value!;
        const second = it.next().value!;
        console.log(`finding shortest path from ${first} to ${second}`);
        const path = this.node_graph.shortestPath(first, second);
        if(path != undefined){
          //todo
        }
      }else{
        console.log("needs 2 nodes selected");
      }
    }
    this.buttons.addButton(short_path_button);

    const add_car_button = new Button.BasicButton(butt_x, 280, 80, 25, 8);
    add_car_button.text = "Add car";
    add_car_button.onPressed = () => {
      if(this.selected_nodes.size == 1){
        const id = this.selected_nodes.values().next().value!;
        const node = this.active_nodes.get(id)!;
        console.log(node);
        this.addCar(node);
        //const car = new Car.ResourceCar(node);
        //this.cars.push(car);
        console.log("adding car");
      }
    }
    this.buttons.addButton(add_car_button);

    const car_path_button = new Button.BasicButton(butt_x, 310, 80, 25, 8);
    car_path_button.text = "Car Path To";
    car_path_button.onPressed = () => {
      if(this.selected_nodes.size == 1 && this.selected_car != undefined){
        const car = this.car_collection.get(this.selected_car)!;
        if(!car.isReadyToGo()){
          console.log("car already on journey");
          
        }else if(this.graph_updated_status){
          console.log("Graph not updated to visuals");
        
        }else{
          //check graph path to node
          const from_id = car.starting_node.getId();
          const to_id = this.selected_nodes.values().next().value!;
          if(from_id === to_id){
            console.log("car already at location");
          }else{
            const shortest_path = this.node_graph.shortestPath(from_id, to_id);
            console.log(shortest_path);
            
          }
        }
      }else{
        console.log("requires selected node and selected car");
      }
    };
    this.buttons.addButton(car_path_button);

    const car_delete_button = new Button.BasicButton(butt_x, 340, 80, 25, 8);
    car_delete_button.text = "Car Del";
    car_delete_button.onPressed = () => {
      this.deleteSelectedCar();
    };
    this.buttons.addButton(car_delete_button);

    const add_button = new Button.ToggleButton(butt_x, 45, 80, 20, 10);
    add_button.on_text = "Add On";
    add_button.off_text = "Add Off";
    add_button.onToggleOn = () => {
      delete_button.toggleOff();
      select_button.toggleOff();
      this.edit_state = WallEditStateEnum.Adding;
    };
    add_button.onToggleOff = () => {
      this.edit_state = WallEditStateEnum.Default;
    };

    this.toggle_buttons.addButton(add_button);

    const delete_button = new Button.ToggleButton(butt_x, 70, 80, 20, 10);
    delete_button.on_text = "Del On";
    delete_button.off_text = "Del Off";
    delete_button.onToggleOn = () => {
      add_button.toggleOff();
      select_button.toggleOff();
      this.edit_state = WallEditStateEnum.Deleting;
    };
    delete_button.onToggleOff = () => {
      this.edit_state = WallEditStateEnum.Default;
    }
    this.toggle_buttons.addButton(delete_button);

    const select_button = new Button.ToggleButton(butt_x, 95, 80, 20, 10);
    select_button.on_text = "Sel On";
    select_button.off_text = "Sel Off";
    select_button.onToggleOn = () => {
      delete_button.toggleOff();
      add_button.toggleOff();
      this.edit_state = WallEditStateEnum.Selecting;
    }
    select_button.onToggleOff = () => {
      this.edit_state = WallEditStateEnum.Default;
    }

    this.toggle_buttons.addButton(select_button);

    this.car_buttons = new Button.SingleSelectToggleButtonSet();

    this.view = Matrix.TransformationMatrix3x3.identity();

    this.last_time = 0;

    this.node_graph = new NodeGraph.RoadGraph();
    //this.node_graph.generate(this.grid, this.a); // now generated by button press

    this.edit_state = WallEditStateEnum.Default;
    this.hover_grid_side = undefined;

    this.selected_nodes = new Set();

    this.hovered_car = undefined;
    this.selected_car = undefined;

    this.test_text_box = new TextInput.TextInput(200, 810, 600, 20);
  }
  addKeyNode(node: Node.KeyNode){
    if(this.grid.getNodeId(node.x, node.y) != undefined){
      console.log("node already here");
      return;
    }
    //console.log(node);
    this.grid.setNodeId(node.x, node.y, this.node_id);
    //console.log(this.grid.getTile(node.x, node.y));
    //this.nodes.push(node);
    node.setId(this.node_id);
    this.active_nodes.set(this.node_id, node);
    console.log(`adding node ${this.node_id.toString()}`);
    this.node_id++;
    this.updateHoveredNode();

    this.graph_updated_status = false;
  }
  deleteKeyNode(node: Node.KeyNode){
    this.selected_nodes.delete(node.getId());
    this.grid.getTile(node.x, node.y)!.clearKey();
    //this.grid.setCellKeyNode(node.x, node.y, false);
    console.log(`clearing node ${this.node_id.toString()}`);
    this.active_nodes.delete(node.getId());
    console.log(`deleting node ${this.node_id.toString()}`);
    this.updateHoveredNode();
    this.graph_updated_status = false;
  }
  clearGrid(){
    this.grid.clear();
    this.clearKeyNodes();
    this.clearCars();
    this.graph_updated_status = false;
  }
  clearKeyNodes(){
    for(const [id, node] of this.active_nodes){
      this.deleteKeyNode(node);
      //todo delete car on node
    }
    this.active_nodes.clear();
    this.graph_updated_status = false;
  }
  clearCars(){
    this.car_collection.clear();
  }

  deleteSelectedCar(){
    if(this.selected_car != undefined)
      this.car_collection.delete(this.selected_car);
  }

  addCar(node: Node.KeyNode){
    this.car_collection.addCarOnNode(node);
  }

  //a valid grid has nodes on all nodes with one direction attached. 
  //also requires neighbouring nodes to have opposite directions active
  validateGrid(): boolean{
    for(let y = 0; y < this.grid.width; y++){
      for(let x = 0; x < this.grid.height; x++){
        const tile = this.grid.getTile(x, y)!;
        if(x == 0 && tile.directionHasPath(Grid.DirectionEnum.Left)){
          console.log("Outside map left");
          return false;
        }
        if(y == 0 && tile.directionHasPath(Grid.DirectionEnum.Up)){
          console.log("Outside map up");
          return false;
        }
        if(y == this.grid.height-1 && tile.directionHasPath(Grid.DirectionEnum.Down)){
          console.log("Outside map down");
          return false;
        }
        if(x == this.grid.width-1 && tile.directionHasPath(Grid.DirectionEnum.Right)){
          console.log("Outside map right");
          return false
        }
        for(const dir of tile.getDirections()){
          const pos = new Grid.GridPosition(x, y);
          const next_position = Grid.DirectionUtil.copyMovePosition(dir, pos);
          const next_tile = this.grid.getTile(next_position.x, next_position.y)!;
          const opp = Grid.DirectionUtil.opposite(dir);
          if(!next_tile.directionHasPath(opp)){
            //no connecting 
            console.log(`No connecting path from ${pos.x}, ${pos.y} to ${next_position.x}, ${next_position.y}`);
            return false;
          }
        }
        if(tile.getDirections().length == 1 && tile.node_id == undefined){
          console.log(`Position: ${x} ${y} has no key node with only one exit path`);
          return false;
        }
      }
    }
    return true;
  }
  quickFixGrid(){
    //adds unfinished paths, adds nodes on deadends, and removes paths on map edges
    //TODO
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
    //console.log(rand_arr);
    const res_node = new Node.ResourceGeneratorNode(this.key_positions[rand_arr[0]].x, this.key_positions[rand_arr[0]].y);
    this.addKeyNode(res_node);

    const deliver_node = new Node.RequirementNode(this.key_positions[rand_arr[1]].x, this.key_positions[rand_arr[1]].y);
    this.addKeyNode(deliver_node);

    for(let i = 2; i < this.key_positions.length; i++){
      const node = new Node.KeyNode(this.key_positions[rand_arr[i]].x, this.key_positions[rand_arr[i]].y);
      //this.nodes.push(new Node.KeyNode(this.key_positions[rand_arr[i]].x, this.key_positions[rand_arr[i]].y));
      this.addKeyNode(node);
    }
    
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

  sideOnGrid(pos: WebGL.Matrix.Point2D | undefined): GridCellSection | undefined{
    if(pos != undefined){
      const dx = pos.x % 1;
      const dy = pos.y % 1;


      const dist = 0.015;
      if(NumberUtils.distanceSq(dx, dy, 0.5, 0.5) < dist){
        this.hover_grid_side = GridCellSectionEnum.Center;
      }else{
        const dir = Grid.DirectionUtil.fromFloatsInGridDecimal(dx, dy);
        this.hover_grid_side = dir;
      }
    }else{
      this.hover_grid_side = undefined;
    }
    return this.hover_grid_side;
  }

  protected override handleKeyDown(ev: KeyboardEvent){
    if(ev.key == 'q'){
      this.is_circle_positions = !this.is_circle_positions;
      if(this.mouse_over_cell != undefined){
        this.setHighlightedPositions(this.mouse_over_cell);
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
    }else if(ev.key == 'Escape'){
      this.deselectKeyNodes();
      this.deselectCar();
    }
    this.test_text_box.onKeyDown(ev);
  }
  protected override handleMouseMove(ev: MouseEvent): void {
    const true_mouse = new Matrix.Point2D(ev.offsetX, ev.offsetY);
    this.true_mouse = true_mouse;
    const inv = this.view.copy();
    inv.invert();
    this.grid_true_mouse = inv.transformPoint(true_mouse);
    this.grid_true_mouse.x/=this.rect_grid.size;
    this.grid_true_mouse.y/=this.rect_grid.size;
    const side = this.sideOnGrid(this.grid_true_mouse);
    const pos = this.rect_grid.getPosition(ev.offsetX, ev.offsetY);
    if(pos != undefined){
      if(this.mouse_over_cell == undefined || (this.mouse_over_cell.x != pos.x || this.mouse_over_cell.y != pos.y)){
        this.setHighlightedPositions(pos);
      }
    }else{
      this.highlighted_positions = [];
    }
    this.buttons.updateMouse(true_mouse);
    this.toggle_buttons.updateMouse(true_mouse);
    this.mouse_over_cell = pos;

    const true_grid = this.getGridTruePosition(ev.offsetX, ev.offsetY);

    this.updateHoveredNode();
    this.test_text_box.onMouseMove(true_mouse);
    for(const opt of this.select_options){
      opt.onMouseMove(true_mouse);
    }
    this.test_internal_window.mouseMove(true_mouse);
  }

  protected override handleMouseDown(ev: MouseEvent){
    if(this.mouse_over_cell != undefined){
     const cell = this.mouse_over_cell;
      if(this.hovered_car != undefined){
        this.selectCar(this.hovered_car);
      }

      //node selection
      else if(this.edit_state === WallEditStateEnum.Selecting){
        const grid_tile = this.grid.getTile(this.mouse_over_cell.x, this.mouse_over_cell.y);
        if(grid_tile != undefined && grid_tile.isKeyNode()){
          if(this.selected_nodes.has(grid_tile.node_id!)){
            grid_tile.is_selected = false;
            this.selected_nodes.delete(grid_tile.node_id!);
          }else{
            grid_tile.is_selected = true;
            this.selected_nodes.add(grid_tile.node_id!);
          }
        }
      }

      // edit walls with mouse input
      else if(this.edit_state === WallEditStateEnum.Adding){
        if(this.hover_grid_side != undefined){
          const changed = this.editSide(cell, this.hover_grid_side, Grid.TileStateEnum.Path);
          console.log(changed);
          //todo use changed, i.e. devalidates graph
        }

      }else if(this.edit_state === WallEditStateEnum.Deleting){
        if(this.hover_grid_side != undefined){
          const changed = this.editSide(cell, this.hover_grid_side, Grid.TileStateEnum.Nothing);
          console.log(changed);
          //todo use changed, i.e. devalidates graph
        }
      }
    }

    this.buttons.mouseDown();
    this.toggle_buttons.mouseDown();
    if(this.true_mouse != undefined){
      this.test_text_box.onMouseDown(this.true_mouse);
      for(const opt of this.select_options){
        opt.onMouseDown();
      }
      this.test_internal_window.mouseDown(this.true_mouse);
    }
  }

  
  protected override handleMouseUp(ev: MouseEvent): void {
    this.buttons.mouseUp();
    this.toggle_buttons.mouseUp();
    this.test_text_box.onMouseUp();
    for(const opt of this.select_options){
        opt.onMouseUp();
    }
    this.test_internal_window.mouseUp();
  }


  editSide(cell: Grid.GridPosition, side: GridCellSection, value: Grid.TileState): boolean{
    const side_to_direction = {
      [GridCellSectionEnum.Left]: Grid.DirectionEnum.Left,
      [GridCellSectionEnum.Down]: Grid.DirectionEnum.Down,
      [GridCellSectionEnum.Right]: Grid.DirectionEnum.Right,
      [GridCellSectionEnum.Up]: Grid.DirectionEnum.Up
    }
    const tile = this.grid.getTileFromPosition(cell)!;
    let changed = false; 
    if(side === GridCellSectionEnum.Center){
      const node_id = this.grid.getNodeId(cell.x, cell.y);
      if(value === Grid.TileStateEnum.Path){
        //adding node
        changed = node_id == undefined;
        const new_node = new Node.KeyNode(cell.x, cell.y);
        this.addKeyNode(new_node);
      }else{
        //deleting node
        changed = node_id != undefined;
        if(node_id != undefined){
          const node = this.active_nodes.get(node_id);
          if(node != undefined) this.deleteKeyNode(node);
        }
      }
    }else{
      changed = tile.getSideState(side) != value;
      this.grid.setCellState(cell.x, cell.y, side_to_direction[side], value);
    }
    return changed;
  }
  updateHoveredNode(){
    this.hovered_node = undefined;
    if(this.grid_true_mouse != undefined){
      for(const [id, node] of this.active_nodes){
        const dist = node.distanceSq(this.grid_true_mouse);
        if(dist < this.node_size*this.node_size){
          this.hovered_node = node;
        }
      }
    }
  }

  deselectKeyNodes(){
    for(const [id, node] of this.active_nodes){
      this.grid.setSelected(node.x, node.y, false);
    }
    this.selected_nodes.clear();
  }
  deselectCar(){
    if(this.selected_car != undefined){
      this.car_collection.get(this.selected_car)!.is_selected = false;
      this.selected_car = undefined;
    }
  }
  selectCar(car_id: Int32){
    //console.log("select");
    this.car_collection.select(car_id);
    this.selected_car = car_id;
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
  }

  getGridTruePosition(x: Float, y: Float): Matrix.Point2D{
    const inv = this.view.copy();
    inv.invert();
    this.grid_true_mouse = inv.transformPoint(new Matrix.Point2D(x, y));
    this.grid_true_mouse.x/=this.rect_grid.size;
    this.grid_true_mouse.y/=this.rect_grid.size;
    return this.grid_true_mouse;
  }

  gridPointCarCollision(grid_point: Matrix.Point2D): Int32 | undefined{
    for(const [id, car] of this.car_collection.cars){
      const left = car.x-car.size*0.5;
      const right = car.x+car.size*0.5;
      const top = car.y-car.size*0.5;
      const bot = car.y+car.size*0.5;

      if(left < grid_point.x && grid_point.x < right && top < grid_point.y && grid_point.y < bot){
        return id;
      }
    }
    return undefined;
  }

  update(time: Float){
    const update_time = time - this.last_time;
    for(const [id, node] of this.active_nodes){
      node.update(update_time);
    }
    this.car_collection.update(update_time)
    if(this.grid_true_mouse != undefined){
      const highlighted_car = this.gridPointCarCollision(this.grid_true_mouse);
      this.hovered_car = highlighted_car;
      //console.log(highlighted_car);
    }else{
      this.hovered_car = undefined;
    }

    TextInput.TextGlobals.update(update_time);

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

    this.tile_state_colours = new Map();
    this.tile_state_colours.set(Grid.TileStateEnum.Nothing, Colour.ColourUtils.yellow());
    this.tile_state_colours.set(Grid.TileStateEnum.Highlight, Colour.ColourUtils.red());
    this.tile_state_colours.set(Grid.TileStateEnum.Path, Colour.ColourUtils.blue());
    this.tile_state_colours.set(Grid.TileStateEnum.Preview, Colour.ColourUtils.fromRGB(0.3, 0.4, 1));

    this.background_colour = Colour.ColourUtils.yellow();
    this.key_colour = Colour.ColourUtils.pink();

    //set some default shader properties
    this.multi_colour_centre_circle_shader.use();
    this.multi_colour_centre_circle_shader.setSize(0.1);
    this.multi_colour_centre_circle_shader.setCircleRadius(0.17);
    this.multi_colour_centre_circle_shader.setBackgroundColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);

    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setSize(0.1);
    this.multi_colour_tile_shader.setBackgroundColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);

    this.white = WebGL.Colour.ColourUtils.white();

  }
  resize(w: Int32, h: Int32){
    this.perspective = Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
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
      this.textures.addFromUrl("apple", "apple.png");
      
      this.textures.load(() => this.loadFonts(onLoad));
    }, 200)
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
    }, 100);
  }
  addOverlayElement(overlay: HTMLDivElement){
    this.overlay_element = overlay;
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
  drawMultiKeyTile(engine: WallEngine, x: Int32, y: Int32){
    this.multi_colour_centre_circle_shader.use();
    const gs = engine.rect_grid.size;
    const model = WebGL.WebGL.rectangleModel(x*gs, y*gs, gs, gs);
    this.multi_colour_centre_circle_shader.setMvp(this.vp.multiplyCopy(model));
    //this.multi_colour_centre_circle_shader.setCircleRadius(0.1);
    this.setMultiTile(engine, this.multi_colour_centre_circle_shader, x, y, true);
    Shapes.Quad.draw();
    //this.setMultiTile(this.multi_colour_centre_circle_shader, engine.grid.grid[y][x].);
  }
  drawMultiWallTile(engine: WallEngine, x: Int32, y: Int32){
    this.multi_colour_tile_shader.use();
    const gs = engine.rect_grid.size;
    const model = WebGL.WebGL.rectangleModel(x*gs, y*gs, gs, gs);
    this.multi_colour_tile_shader.setMvp(this.vp.multiplyCopy(model));
    this.setMultiTile(engine, this.multi_colour_tile_shader, x, y, false);
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
  drawCar(car: Car.ResourceCar, engine: WallEngine){
    const gs = engine.rect_grid.size;
    const cs = car.size*gs;

    if(car.is_selected){
      const outline_size = 4;
      //const half_outline = outline_size*0.5;
      //draw outline
      this.solid_shader.use();
      this.solid_shader.setColour(1, 1, 1);

      const outline_model = WebGL.WebGL.rectangleModel(
        car.x*gs, car.y*gs, 
        cs+outline_size, cs+outline_size
      );
      this.solid_shader.setMvp(this.perspective.multiplyCopy(outline_model));

      WebGL.Shapes.CenterQuad.draw();
    }

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

    this.drawGridLines(engine);

    for(const [id, car] of engine.car_collection.cars){
      this.drawCar(car, engine);
    }

    this.displayNodeSheet(engine);


    //draw buttons
    engine.buttons.draw(this.perspective, this.solid_shader, this.text_drawer);
    engine.toggle_buttons.draw(this.perspective, this.solid_shader, this.text_drawer);

    if(engine.true_mouse){
      //console.log(engine.true_mouse)
      const text = `x ${engine.true_mouse.x}, y ${engine.true_mouse.y}`;
      this.text_drawer.drawText(this.vp, 40, 300, text, 15);
    }
    if(engine.grid_true_mouse){
      const text = `x ${engine.grid_true_mouse.x.toFixed(2)}, y ${engine.grid_true_mouse.y.toFixed(2)}`;
      this.text_drawer.drawText(this.vp, 40, 400, text, 15);
    }

    if(engine.hover_grid_side != undefined){
      const text = engine.hover_grid_side === GridCellSectionEnum.Center ? "Center" 
      : Grid.DirectionUtil.toString(engine.hover_grid_side as Grid.GridDirection);
      this.text_drawer.drawText(this.vp, 20, 700, text, 15);
    }

    if(engine.hovered_car != undefined){
      this.displayCarDetails(engine.car_collection.get(engine.hovered_car)!, engine);
    }


    // status texts
    const graph_status_text = engine.graph_updated_status ? Texts.SimStatus.graph_is_update : Texts.SimStatus.graph_needs_update;
    this.text_drawer.drawText(this.perspective, 0, 0, graph_status_text, 10);

    engine.test_text_box.draw(this.perspective, this.solid_shader, this.text_drawer);
    for(const opt of engine.select_options){
      opt.draw(this.perspective, this.solid_shader, this.text_drawer);
    }

    engine.test_internal_window.draw(this.perspective, this.solid_shader);
    this.drawInWindowTest(engine.test_internal_window);
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
  setMultiTile(engine: WallEngine, shader: MultiColourTileShader, x: Int32, y: Int32, center_circle: boolean=false){
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
    }else if(!center_circle && tile.bottom == Grid.TileStateEnum.Nothing && tile.left == Grid.TileStateEnum.Nothing 
      && tile.top == Grid.TileStateEnum.Nothing && tile.right == Grid.TileStateEnum.Nothing){
        shader.setMidColour(this.background_colour.red, this.background_colour.green, this.background_colour.blue);
    }else{
      const c = this.tile_state_colours.get(Grid.TileStateEnum.Path)!;
      shader.setMidColour(c.red, c.green, c.blue);
    }
    //this.setMultiTile(shader, tile.);
  }
  drawResource(res: Resource.Resource, x: Float, y: Float, size: Float){
    this.texture_shader.use();
    switch(res){
      case Resource.ResourceEnum.Water:
        this.textures.active("drop", 3);
        this.texture_shader.setTextureId(3);
        break;
      case Resource.ResourceEnum.Apple:
        break;
    }
    const model = WebGL.WebGL.rectangleModel(x, y, size, size);
    this.texture_shader.setMvp(this.perspective.multiplyCopy(model));
    Shapes.Quad.draw();
  }
  drawResourceInventory(node: Node.KeyNode, x: Int32, y: Int32, res_size: Int32, num_size: Int32){
    let rx = x;
    //const res_size = 15;
    //const num_size = 5;
    for(const [res, amount] of node.inventory){
      this.drawResource(res, rx, y, res_size);
      const str = amount.toString()
      const offset = str.length*num_size;
      this.text_drawer.drawText(this.perspective, rx+res_size-offset, y+res_size-num_size, str, num_size);
      rx += res_size;
    }
  }
  displayNodeSheet(engine: WallEngine){
    if(engine.hovered_node != undefined && engine.true_mouse != undefined){
      //background
      const text_size = 12;
      const x = engine.true_mouse.x+20;
      const y = engine.true_mouse.y;
      const ui_height = engine.hovered_node.drawNodeUI(this.perspective, this.solid_shader, this.text_drawer, x, y, text_size);
      this.drawResourceInventory(engine.hovered_node, x, y+ui_height, 20, 10);

      /*
      if(engine.hovered_node.type === Node.NodeTypeEnum.Resource){
        const res_node = engine.hovered_node as Node.ResourceGeneratorNode;
        //show resources in node //TODO
        this.text_drawer.drawText(this.perspective, x, y+31, "Res", 15);
        this.drawResource(res_node.resource, x, y+46);
        this.text_drawer.drawText(this.perspective, x+15, y+46, res_node.getResourceInventory(res_node.resource).toString(), 15);

      }else if(engine.hovered_node.type === Node.NodeTypeEnum.Requirement){
        const req_node = engine.hovered_node as Node.RequirementNode;
        this.text_drawer.drawText(this.perspective, x, y+31, "Req", 15);
        this.drawResource(req_node.require_resource, x, y+46);
      }*/

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
  displayCarDetails(car: Car.ResourceCar, engine: WallEngine){
    //displaying on bottom left
    const y = engine.rect_grid.pixel_height + 10;
    const text_size = 10;
    let car_text = `id ${car.id.toString()}`;
    if(car.is_selected){
      car_text += " selected";
    }
    this.text_drawer.drawText(this.perspective, 10, y, car_text, text_size);
    const x_text = `x ${car.x.toFixed(2)}`;
    this.text_drawer.drawText(this.perspective, 10, y+text_size, x_text, text_size);
    const y_text = `y ${car.y.toFixed(2)}`;
    this.text_drawer.drawText(this.perspective, 10, y+(text_size*2), y_text, text_size);

    const car_node_id = car.starting_node.getId();
    const st_node_text = `Start node id ${car_node_id.toString()}`;
    this.text_drawer.drawText(this.perspective, 10, y+(text_size*3), st_node_text, text_size);

    const target_node_text = car.target_node != undefined ? 
    `Target node id ${car.target_node.getId().toString()}` : "No Target";
    this.text_drawer.drawText(this.perspective, 10, y+(text_size*4), target_node_text, text_size);
  }
  drawInWindowTest(window: InternalWindow.InternalWindow){
    if(window.visible){
      const p = window.getWindowPosition();
      this.text_drawer.drawText(this.perspective, p.x+10, p.y+10, "Hello world", 10);
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