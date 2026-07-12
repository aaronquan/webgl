import * as WebGL from "./../../WebGL/globals";
import * as Grid from "./grid";
import type { ResourceSimEngine } from "./resource_engine";

type Int32 = number;
type Float = number;

import Colour = WebGL.Colour;

interface MultiColourTileShader{
  setLeftColour:(r: Float, g: Float, b: Float) => void;
  setBotColour:(r: Float, g: Float, b: Float) => void;
  setRightColour:(r: Float, g: Float, b: Float) => void;
  setTopColour:(r: Float, g: Float, b: Float) => void;
  setMidColour:(r: Float, g: Float, b: Float) => void;
  setLeftColourFromColourRGB:(c: Colour.ColourRGB) => void;
  setBotColourFromColourRGB:(c: Colour.ColourRGB) => void;
  setRightColourFromColourRGB:(c: Colour.ColourRGB) => void;
  setTopColourFromColourRGB:(c: Colour.ColourRGB) => void;
  setMidColourFromColourRGB:(c: Colour.ColourRGB) => void;
}

export class ResourceSimRenderer extends WebGL.App.SimpleAppRenderer<ResourceSimEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;

  multi_colour_tile_shader: WebGL.Shader.MVPMultiColourPathProgram;
  multi_colour_centre_circle_shader: WebGL.Shader.MVPMultiColourCentreCirclePathProgram;

  tile_state_colours: Map<Grid.TileState, Colour.ColourRGB>;
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");

    //colour initialisations
    this.tile_state_colours = new Map();
    this.tile_state_colours.set(Grid.TileStateEnum.Nothing, Colour.ColourUtils.yellow());
    this.tile_state_colours.set(Grid.TileStateEnum.Highlight, Colour.ColourUtils.red());
    this.tile_state_colours.set(Grid.TileStateEnum.Path, Colour.ColourUtils.blue());
    this.tile_state_colours.set(Grid.TileStateEnum.Preview, Colour.ColourUtils.fromRGB(0.3, 0.8, 0.2));

    //shader initialisations
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.multi_colour_tile_shader = new WebGL.Shader.MVPMultiColourPathProgram();
    this.multi_colour_centre_circle_shader = new WebGL.Shader.MVPMultiColourCentreCirclePathProgram();

    this.setInitialTextureParameters();
  }

  setInitialTextureParameters(){
    const default_colour = this.tile_state_colours.get(Grid.TileStateEnum.Nothing)!;
    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setSize(0.12);
    this.multi_colour_tile_shader.setBackgroundColourFromColourRGB(default_colour);

    this.multi_colour_centre_circle_shader.use();
    this.multi_colour_centre_circle_shader.setSize(0.12);
    this.multi_colour_centre_circle_shader.setCircleRadius(0.15);
    this.multi_colour_centre_circle_shader.setBackgroundColourFromColourRGB(default_colour);
  }

  render(engine: ResourceSimEngine){
    engine.side_interface.draw(this.orthographic, this.colour_shader, this.text_drawer);

    engine.main_game.enableScissors();
    this.drawGridBackground(engine);
    this.drawGridTiles(engine);
    //this.drawTile(engine, 2, 2);
    if(engine.side_interface.grid_on){
      engine.main_game.drawGrid(this.orthographic, this.colour_shader, 2);
    }
    engine.main_game.disableScissors();
  }

  drawGridBackground(engine: ResourceSimEngine){
    engine.main_game.drawBackground(this.orthographic, this.colour_shader);
    
    //engine.main_game.drawGrid(this.orthographic, this.colour_shader, 2);
  }

  drawTile(engine: ResourceSimEngine, x: Int32, y: Int32){
    const gs = engine.main_game.grid_size;
    const tile = engine.main_game.chunk_holder.getTile(x, y);
    if(tile != undefined){
      
      const x_off = engine.main_game.x + (x-engine.main_game.grid_left)*gs;
      const y_off = engine.main_game.y + (y-engine.main_game.grid_top)*gs;
      const model = WebGL.WebGL.rectangleModel(x_off, y_off, gs, gs);
      if(tile.isKeyNode()){
        this.multi_colour_centre_circle_shader.use();
        this.multi_colour_centre_circle_shader.setMvp(this.orthographic.multiplyCopy(model));
        this.setTileShader(this.multi_colour_centre_circle_shader, tile);
      }else{
        this.multi_colour_tile_shader.use();
        this.multi_colour_tile_shader.setMvp(this.orthographic.multiplyCopy(model));
        this.setTileShader(this.multi_colour_tile_shader, tile);
      }
      WebGL.Shapes.Quad.draw();
    }
  }

  drawGridTiles(engine: ResourceSimEngine){
    const sx = Math.floor(engine.main_game.grid_left);
    const ex = Math.floor(engine.main_game.grid_right);
    const sy = Math.floor(engine.main_game.grid_top);
    const ey = Math.floor(engine.main_game.grid_bot);
    //const gs = engine.main_game.grid_size;
    for(let y = sy; y <= ey; y++){
      for(let x = sx; x <= ex; x++){
        this.drawTile(engine, x, y);
        /*
        const tile = engine.main_game.chunk_holder.getTile(x, y);
        if(tile != undefined){
          this.multi_colour_tile_shader.use();
          const x_off = engine.main_game.x + (x-engine.main_game.grid_left)*gs;
          const y_off = engine.main_game.y + (y-engine.main_game.grid_top)*gs;
          const model = WebGL.WebGL.rectangleModel(x_off, y_off, gs, gs);
          this.multi_colour_tile_shader.setMvp(this.orthographic.multiplyCopy(model));
          this.setTileShader(this.multi_colour_tile_shader, tile);
          WebGL.Shapes.Quad.draw();
        }
        */
      }
    }
  }

  getMidColour(tile: Grid.WallTile): Colour.ColourRGB{
    if(tile.is_preview){
      return this.tile_state_colours.get(Grid.TileStateEnum.Preview)!;
    }
    else if(!tile.isClear()){
      return this.tile_state_colours.get(Grid.TileStateEnum.Path)!;
    }
    else if(tile.is_selected){
      return this.tile_state_colours.get(Grid.TileStateEnum.Highlight)!;
    }
    //else if(tile.isKeyNode()){
    //  return this.tile_state_colours.get(Grid.TileStateEnum.Path)!;
    //}
    return this.tile_state_colours.get(Grid.TileStateEnum.Nothing)!;
  }

  setTileShader(shader: MultiColourTileShader, tile: Grid.WallTile){
    shader.setLeftColourFromColourRGB(this.tile_state_colours.get(tile.left)!);
    shader.setBotColourFromColourRGB(this.tile_state_colours.get(tile.top)!);
    shader.setRightColourFromColourRGB(this.tile_state_colours.get(tile.right)!);
    shader.setTopColourFromColourRGB(this.tile_state_colours.get(tile.bottom)!);
    const mid_colour = this.getMidColour(tile);
    shader.setMidColourFromColourRGB(mid_colour);
  }
}