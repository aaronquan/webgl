import * as WebGL from "./../../WebGL/globals";

import * as NumberUtils from "./../../utils/numbers";

//ressim imports
import * as Grid from "./grid";
import * as Node from "./nodes";
import * as Resource from "./resource";
import * as Car from "./car";
import * as NodeGraph from "./node_graph";
import * as Consts from "./consts";

//interface webgl imports
import Button = WebGL.Interface.Button;
import Options = WebGL.Interface.Options;
import Theme = WebGL.Interface.Theme;

import Point = WebGL.Matrix.Point2D;
import Mat3 = WebGL.Matrix.TransformationMatrix3x3;
import Colour = WebGL.Colour;

type Int32 = number;
type Float = number;
type VoidFunction = () => void;
const EmptyFunction: VoidFunction = () => {};

const theme: WebGL.Interface.Theme.InterfaceTheme = {
  primary: WebGL.Colour.ColourUtils.fromHex("40EB9E"),
  secondary: WebGL.Colour.ColourUtils.fromHex("4fb286"),
  tertiary: WebGL.Colour.ColourUtils.fromHex("77FFC2"),
  background: WebGL.Colour.ColourUtils.fromHex("3c896d"),
  secondary_background: WebGL.Colour.ColourUtils.fromHex("266C52"),
  close: WebGL.Colour.ColourUtils.fromHex("546d64"),
  close_hover: WebGL.Colour.ColourUtils.fromHex("CC1212"),
}

class TileV2{
  //left: TileV2 | 
  //left_wall: boolean;
}

export class ResourceSimEngine extends WebGL.App.BaseEngine{
  screen_width: Int32;
  screen_height: Int32;

  global_mouse_point: WebGL.Matrix.Point2D;

  grid: Grid.WallGrid;
  rect_grid: Grid.RectGrid;

  main_game: MainGame;

  side_interface: SimSideInterface;
  constructor(w: Int32, h: Int32){
    super();
    this.screen_width = w;
    this.screen_height = h;
    this.global_mouse_point = new Point();
    this.grid = new Grid.WallGrid(10, 10);
    this.rect_grid = new Grid.RectGrid(10, 10, 40);
    this.main_game = new MainGame(5, 5, 600, 600)
    this.side_interface = new SimSideInterface(605, 10);
    this.side_interface.setTheme(theme);

    
    this.addInterfaceFunctions();
  }

  addInterfaceFunctions(){
    this.side_interface.setDebugKeyFunction(() => {
      console.log(this.main_game.key_nodes);
    });

    this.side_interface.setSaveFunction(() => {
      this.main_game.saveToText();
    });

    this.side_interface.setLoadFunction(() => {
      this.main_game.loadFromSave();
    });

    this.side_interface.setClearFunction(() => {
      this.main_game.clear();
    });

    this.side_interface.setGenGraphFunction(() => {
      this.main_game.generateRoadGraph();
    });

    this.side_interface.setAddCarFunction(() => {
      //this.main_game.
    });

    this.side_interface.setCarDestFunction(() => {

    });
  }
  
  protected handleMouseMove(ev: MouseEvent){
    const mouse_point = new WebGL.Matrix.Point2D(ev.clientX, ev.clientY);
    this.global_mouse_point = mouse_point;
    this.side_interface.onMouseMove(mouse_point);
    const gp = this.main_game.getGridPoint(mouse_point);
    this.main_game.onMouseMove(mouse_point);
    if(this.main_game.isInside(mouse_point)){
      this.side_interface.text1 = `${gp.x.toFixed(2)}, ${gp.y.toFixed(2)}`;
    }else{
      this.side_interface.text1 = "NA";
    }
    this.side_interface.text2 = this.main_game.hover_side != undefined 
    ? Consts.ConstUtil.cellSectionToString(this.main_game.hover_side) 
    : "NA";
    if(this.side_interface.edit_state == Consts.WallEditStateEnum.Adding){
      this.main_game.updatePreview();
    }else if(this.side_interface.edit_state == Consts.WallEditStateEnum.Selecting){
      //this.main_game.printHoveredTile();
    }
  }
  protected handleMouseDown(ev: MouseEvent){
    this.side_interface.onMouseDown(this.global_mouse_point);
    
    this.main_game.onMouseDown(this.global_mouse_point);
    switch(this.side_interface.edit_state){
      case Consts.WallEditStateEnum.Adding:
        this.main_game.addOnHoveredTile();
        break;
      case Consts.WallEditStateEnum.Deleting:
        this.main_game.deleteHovered();
        break;
      case Consts.WallEditStateEnum.Selecting:
        this.main_game.printHoveredTile();
      
    }
  }

  protected handleMouseUp(ev: MouseEvent): void {
    this.side_interface.onMouseUp();
    this.main_game.onMouseUp();
  }
}

class MainGame{
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;
  grid_size: Int32;

  grid_left: Float;
  grid_top: Float;
  grid_right: Float;
  grid_bot: Float;

  grid_point: Point | undefined;
  drag_point: Point | undefined;
  mouse_grid_position: Grid.GridPosition | undefined;
  hover_side: Consts.GridCellSection | undefined;

  hovered_preview: Consts.PositionSide | undefined;

  chunk_holder: Grid.ChunkHolder;

  key_nodes: Node.NodeCollection;

  road_graph: NodeGraph.RoadGraph | undefined;

  test_save: string | undefined;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.grid_size = 60; // 50 with 0.1 radius gives misaligned grid

    this.grid_left = -1.0;
    this.grid_top = 1.5;
    this.grid_right = this.getRight();
    this.grid_bot = this.getBot();

    this.chunk_holder = new Grid.ChunkHolder();
    this.chunk_holder.requestChunkRange(this.grid_left, this.grid_right, this.grid_top, this.grid_bot);

    //this.chunk_holder.getTile(2, 1)?.setTileState(Grid.DirectionEnum.Left, Grid.TileStateEnum.Path);

    this.key_nodes = new Node.NodeCollection();

    this.test_save = `3,6
4,2
4,3
2,2
2,2,0,0,1,0
3,2,1,0,1,0
4,2,1,0,1,1
5,2,1,0,0,1
4,3,0,1,0,0
5,3,0,1,1,0`;
  }
  enableScissors(){
    WebGL.WebGL.enableScissor(this.x, this.y, this.width, this.height);
  }
  disableScissors(){
    WebGL.WebGL.disableScissor();
  }
  printHoveredTile(){
    if(this.mouse_grid_position != undefined){
      const tile = this.chunk_holder.getTileFromPosition(this.mouse_grid_position);
      console.log(tile);
    }
  }
  onMouseMove(global_point: Point){
    this.grid_point = this.isInside(global_point) ? this.getGridPoint(global_point) : undefined;
    this.mouse_grid_position = this.grid_point != undefined ? new Grid.GridPosition(Math.floor(this.grid_point.x), Math.floor(this.grid_point.y)) : undefined;
    
    if(this.grid_point != undefined){
      if(this.drag_point != undefined){
        //drag move grid
        const dx = this.grid_point.x - this.drag_point.x;
        const dy = this.grid_point.y - this.drag_point.y;
        this.grid_left -= dx;
        this.grid_top -= dy;
        this.grid_right = this.getRight();
        this.grid_bot = this.getBot();
      }
      this.hover_side = this.sideOnGrid(this.grid_point);
    }else{
      this.hover_side = undefined;
    }
  }
  onMouseDown(global_point: Point){
    if(this.isInside(global_point)){
      this.drag_point = this.grid_point;
    }
  }
  onMouseUp(){
    this.drag_point = undefined;
  }
  updatePreview(){
    this.removeHoveredPreview();
    if(this.mouse_grid_position != undefined && this.hover_side != undefined){
      const tile = this.chunk_holder.getTileFromPosition(this.mouse_grid_position);
      if(tile != undefined){
        if(this.hover_side !== Consts.GridCellSectionEnum.Center){
          const direction = Consts.ConstUtil.side_to_direction[this.hover_side];
          if(tile.getSideState(direction) == Grid.TileStateEnum.Nothing){
            tile.setTileState(direction, Grid.TileStateEnum.Preview);
            this.hovered_preview = {side: this.hover_side, position: this.mouse_grid_position.copy()};
          }
        }else{
          if(!tile.isKeyNode()){
            tile.is_preview = true;
            this.hovered_preview = {side: this.hover_side, position: this.mouse_grid_position.copy()};
          }
        }
      }
    }
  }
  removeHoveredPreview(){
    if(this.hovered_preview != undefined){
      if(this.hovered_preview.side != this.hover_side || this.hovered_preview.position != this.mouse_grid_position){
        const tile = this.chunk_holder.getTileFromPosition(this.hovered_preview.position)!; //has to be a tile if hovered_preview is set
        if(tile != undefined){
          if(this.hovered_preview.side !== Consts.GridCellSectionEnum.Center){
            const direction = Consts.ConstUtil.side_to_direction[this.hovered_preview.side];
            if(tile.getSideState(direction) == Grid.TileStateEnum.Preview){
              tile.setTileState(direction, Grid.TileStateEnum.Nothing);
            }
          }else{
            tile.is_preview = false;
          }
        }
      }
    }
  }

  deleteHovered(){
    if(this.mouse_grid_position != undefined && this.hover_side != undefined){
      const tile = this.chunk_holder.getTileFromPosition(this.mouse_grid_position);
      if(tile != undefined){
        this.addOnTile(tile, this.hover_side, Grid.TileStateEnum.Nothing);
        if(this.hover_side == Consts.GridCellSectionEnum.Center){
          //delete node
          const node = tile.key_node;
          if(node != undefined){
            this.key_nodes.remove(node.getId());
            tile.key_node = undefined;
          }

        }
      }
    }
  }

  addOnTile(tile: Grid.WallTile, side: Consts.GridCellSection, state: Grid.TileState=Grid.TileStateEnum.Path){
    if(side !== Consts.GridCellSectionEnum.Center){
      //if(tile.getSideState(Consts.ConstUtil.side_to_direction[side]) == Grid.TileStateEnum.Nothing){
        tile.setTileState(Consts.ConstUtil.side_to_direction[side], state);
      //}
    }else{
      if(state == Grid.TileStateEnum.Nothing){
        //delete key node
        if(tile.key_node != undefined){
          const id = tile.key_node.getId();
          this.key_nodes.remove(id);
          tile.is_key = false;
          tile.is_preview = false;
          //const node = this.key_nodes.getNode(id);
        }
        //this.key_nodes.getNode
      }else{
        //to test
        //add key node
        console.log("adding key node");
        this.addKeyNodeOnTile(tile);
      }
      
    }
  }

  addOnHoveredTile(state: Grid.TileState=Grid.TileStateEnum.Path){
    if(this.mouse_grid_position != undefined && this.hover_side != undefined){
      const tile = this.chunk_holder.getTile(this.mouse_grid_position.x, this.mouse_grid_position.y);
      if(tile != undefined){
        this.addOnTile(tile, this.hover_side, state);
      }
    }
  }

  addKeyNodeOnTile(tile: Grid.WallTile){
    const node = new Node.KeyNode(tile);
    this.key_nodes.addNode(node);
    if(!tile.is_key){
      tile.is_key = true;
      tile.is_preview = false;
    }
  }

  sideOnGrid(grid_point: Point): Consts.GridCellSection{
    const dx = grid_point.x % 1;
    const dy = grid_point.y % 1;
    const radius = 0.15;
    if(NumberUtils.distanceSq(dx, dy, 0.5, 0.5) < radius*radius){
      return Consts.GridCellSectionEnum.Center;
    }
    return Grid.DirectionUtil.fromFloatsInGridDecimal(dx, dy);
  }

  isInside(global_point: Point): boolean{
    const in_x = this.x <= global_point.x && global_point.x <= this.x+this.width;
    const in_y = this.y <= global_point.y && global_point.y <= this.y+this.height;
    return in_x && in_y;
  }
  getGridPoint(global_point: Point): Point{
    const gx = global_point.x - this.x;
    const gy = global_point.y - this.y;
    return new Point(this.grid_left+gx/this.grid_size, this.grid_top+gy/this.grid_size);
  }
  getGridWidth(): Float{
    return this.width / this.grid_size;
  }
  getGridHeight(): Float{
    return this.height / this.grid_size;
  }
  getRight(): Float{
    return this.grid_left + this.getGridWidth();
  }
  getBot(): Float{
    return this.grid_top + this.getGridHeight();
  }
  drawBackground(vp: Mat3, colour_shader: WebGL.Shader.MVPColourProgram){
    WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.width, this.height, Colour.ColourUtils.yellow());
  }
  drawGrid(vp: Mat3, colour_shader: WebGL.Shader.MVPColourProgram, size: Float){
    const colour = Colour.ColourUtils.red()
    const hs = size*0.5;

    const sx = this.grid_left < 0 ? -(this.grid_left % 1) : 1 - (this.grid_left % 1);
    for(let x = sx; x < this.grid_right-this.grid_left; x++){
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x+x*this.grid_size-hs, this.y, size, this.height, colour);
    }

    const sy = this.grid_top < 0 ? -(this.grid_top % 1) : 1 - (this.grid_top % 1);
    for(let y = sy; y < this.grid_bot-this.grid_top; y++){
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y+y*this.grid_size-hs, this.width, size, colour);
    }
  }
  saveToText(){
    const node_ser = this.key_nodes.serialise();
    const grid_ser = this.chunk_holder.serialise();

    let content = `${node_ser.number_of_nodes.toString()},${grid_ser.number_of_tiles.toString()}\n`;
    content += node_ser.serialised_string;
    content += grid_ser.serialised_string;
    console.log(content);
    this.test_save = content;
    //todo: save to other locations
  }
  loadFromSave(){
    console.log(this.test_save);
    if(this.test_save == undefined) return;
    this.clear();
    const sp = this.test_save.split("\n");
    const nums = sp[0].split(",");
    const num_nodes = parseInt(nums[0]);
    const num_tiles = parseInt(nums[1]);
    let ln = 1
    for(let i = 0; i < num_nodes; i++){
      this.deserialiseNode(sp[ln]);
      ln++;
    }
    for(let i = 0; i < num_tiles; i++){
      this.chunk_holder.deserialise(sp[ln]);
      ln++;
    }
  }
  deserialiseNode(s: string){
    const sp = s.split(',');
    const x = parseInt(sp[0]);
    const y = parseInt(sp[1]);
    const tile = this.chunk_holder.getTile(x, y);
    if(tile != undefined){
      this.addKeyNodeOnTile(tile);
    }
  }
  generateRoadGraph(){
    console.log("generating graph");
    this.road_graph = new NodeGraph.RoadGraph();
    this.road_graph.generateGraphFromChunks(this.chunk_holder, this.key_nodes);
  }
  clearHighlights(){
    this.chunk_holder.clearHighlights();
  }
  clear(){
    this.key_nodes.clear();
    this.chunk_holder.clearChunks();
    this.road_graph = undefined;
  }

}

class SimSideInterface{
  x: Int32;
  y: Int32;
  edit_options: Options.DropdownOptions;
  edit_state: Consts.WallEditState;

  text1: string;
  text2: string;

  toggle_buttons: Button.ToggleButtonSet;
  buttons: Button.ButtonSet;
  grid_on: boolean;

  constructor(x: Int32, y: Int32){
    this.x = x;
    this.y = y;
    this.edit_options = new Options.DropdownOptions(x, y, 140, 20, ["Norm", "Add", "Del", "Sel"]);
    this.edit_state = Consts.WallEditStateEnum.Default;
    this.edit_options.onSelect = (id) => {
      switch(id){
        case 0:
          this.edit_state = Consts.WallEditStateEnum.Default;
          break;
        case 1:
          this.edit_state = Consts.WallEditStateEnum.Adding;
          break;
        case 2:
          this.edit_state = Consts.WallEditStateEnum.Deleting;
          break;
        case 3:
          this.edit_state = Consts.WallEditStateEnum.Selecting;
          break;
      }
    }
    this.text1 = "ok";
    this.text2 = "";
    this.toggle_buttons = new Button.ToggleButtonSet();
    this.buttons = new Button.ButtonSet();
    this.grid_on = false;
    const grid_toggle_button = new Button.ToggleButton(x+5, y+60, 125, 15);
    grid_toggle_button.on_text = "Grid Off";
    grid_toggle_button.off_text = "Grid On";
    grid_toggle_button.onToggleOn = () => {
      this.grid_on = true;
    }
    grid_toggle_button.onToggleOff = () => {
      this.grid_on = false;
    }
    grid_toggle_button.toggleOn();
    this.toggle_buttons.addButton(grid_toggle_button);

    const debug_key_button = new Button.BasicButton(x+5, y+80, 125, 15, 8);
    debug_key_button.text = "Print Key Nodes";
    this.buttons.addButton(debug_key_button);

    const save_button = new Button.BasicButton(x+5, y+100, 100, 15, 12);
    save_button.text = "Save";
    this.buttons.addButton(save_button);

    const load_button = new Button.BasicButton(x+5, y+120, 100, 15, 12);
    load_button.text = "Load";
    this.buttons.addButton(load_button);

    const clear_button = new Button.BasicButton(x+5, y+140, 100, 15, 12);
    clear_button.text = "Clear";
    this.buttons.addButton(clear_button);

    const generate_graph_button = new Button.BasicButton(x+5, y+160, 100, 15, 12);
    generate_graph_button.text = "Gen Graph";
    this.buttons.addButton(generate_graph_button);

    const add_car_button = new Button.BasicButton(x+5, y+180, 100, 15, 12);
    add_car_button.text = "Add Car";
    this.buttons.addButton(add_car_button);

    const set_car_destination_button = new Button.BasicButton(x+5, y+200, 100, 15, 10);
    set_car_destination_button.text = "Set Car Dest";
    this.buttons.addButton(set_car_destination_button);

    const show_closest_path_button = new Button.BasicButton(x+5, y+220, 100, 15, 10);
    show_closest_path_button.text = "Close Path";
    this.buttons.addButton(show_closest_path_button);

    const clear_highlights_button = new Button.BasicButton(x+5, y+240, 100, 15, 10);
    clear_highlights_button.text = "Clear HLights";
    this.buttons.addButton(clear_highlights_button);

  }
  setLoadFunction(f: VoidFunction){
    this.buttons.buttons[2].onPressed = f;
  }
  setSaveFunction(f: VoidFunction){
    this.buttons.buttons[1].onPressed = f;
  }
  setClearFunction(f: VoidFunction){
    this.buttons.buttons[3].onPressed = f;
  }

  setDebugKeyFunction(f: VoidFunction){
    this.buttons.buttons[0].onPressed = f;
  }

  setGenGraphFunction(f: VoidFunction){
    this.buttons.buttons[4].onPressed = f;
  }

  setAddCarFunction(f: VoidFunction){
    this.buttons.buttons[5].onPressed = f;
  }

  setCarDestFunction(f: VoidFunction){
    this.buttons.buttons[6].onPressed = f;
  }

  setClosestPathFunction(f: VoidFunction){
    this.buttons.buttons[7].onPressed = f;
  }
  setClearHighlightsFunction(f: VoidFunction){
    this.buttons.buttons[8].onPressed = f;
  }

  setTheme(theme: Theme.InterfaceTheme){
    this.edit_options.setTheme(theme);
    this.toggle_buttons.setTheme(theme);
    this.buttons.setTheme(theme);
  }
  onMouseMove(point: WebGL.Matrix.Point2D){
    this.edit_options.onMouseOver(point);
    this.toggle_buttons.updateMouse(point);
    this.buttons.updateMouse(point);
  }
  onMouseDown(point: WebGL.Matrix.Point2D){
    const selected_option = this.edit_options.onMouseDown(point);
    if(!selected_option){
      this.toggle_buttons.mouseDown();
      this.buttons.mouseDown();
    }
  }
  onMouseUp(){
    this.toggle_buttons.mouseUp();
    this.buttons.mouseUp();
    //this.edit_options.on
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer){

    text_drawer.drawText(vp, this.x, this.y+20, this.text1, 15);
    text_drawer.drawText(vp, this.x, this.y+40, this.text2, 15);

    this.toggle_buttons.draw(vp, colour_shader, text_drawer);
    this.buttons.draw(vp, colour_shader, text_drawer);

    this.edit_options.draw(vp, colour_shader, text_drawer);
  }
}