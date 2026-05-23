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
    this.tile_state_colours.set(Grid.TileStateEnum.Preview, Colour.ColourUtils.fromRGB(0.3, 0.4, 1));

    //shader initialisations
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.multi_colour_tile_shader = new WebGL.Shader.MVPMultiColourPathProgram();
    this.multi_colour_centre_circle_shader = new WebGL.Shader.MVPMultiColourCentreCirclePathProgram();

    this.setInitialTextureParameters();
  }

  setInitialTextureParameters(){
    this.multi_colour_tile_shader.use();
    this.multi_colour_tile_shader.setSize(0.12);
    this.multi_colour_tile_shader.setBackgroundColourFromColourRGB(this.tile_state_colours.get(Grid.TileStateEnum.Nothing)!);
  }

  render(engine: ResourceSimEngine){
    engine.side_interface.draw(this.orthographic, this.colour_shader, this.text_drawer);

    engine.main_game.enableScissors();
    this.drawGridBackground(engine);
    this.drawGridTiles(engine);
    //this.drawTile(engine, 2, 2);
    engine.main_game.drawGrid(this.orthographic, this.colour_shader, 2);
    engine.main_game.disableScissors();
  }

  drawGridBackground(engine: ResourceSimEngine){
    engine.main_game.drawBackground(this.orthographic, this.colour_shader);
    
    //engine.main_game.drawGrid(this.orthographic, this.colour_shader, 2);
  }

  drawTile(engine: ResourceSimEngine, x: Int32, y: Int32){
    const sx = Math.floor(engine.main_game.grid_left);
    const ex = Math.floor(engine.main_game.grid_right);
    const sy = Math.floor(engine.main_game.grid_top);
    const ey = Math.floor(engine.main_game.grid_bot);
    const gs = engine.main_game.grid_size;
    const tile = engine.main_game.chunk_holder.getTile(x, y);
    const tx = 1+(engine.main_game.grid_left%1);
    const ty = engine.main_game.grid_top >= 0 ? engine.main_game.grid_top%1 : 1+(engine.main_game.grid_top%1);
    if(tile != undefined){
      this.multi_colour_tile_shader.use();
      const tx = 1+(engine.main_game.grid_left%1);
      const x_off = engine.main_game.x + (x-engine.main_game.grid_left)*gs;
      const y_off = engine.main_game.y + (y-engine.main_game.grid_top)*gs;
      const model = WebGL.WebGL.rectangleModel(x_off, y_off, gs, gs);
      this.multi_colour_tile_shader.setMvp(this.orthographic.multiplyCopy(model));
      this.setTileShader(this.multi_colour_tile_shader, tile);
      WebGL.Shapes.Quad.draw();
    }
  }

  drawGridTiles(engine: ResourceSimEngine){
    const sx = Math.floor(engine.main_game.grid_left);
    const ex = Math.floor(engine.main_game.grid_right);
    const sy = Math.floor(engine.main_game.grid_top);
    const ey = Math.floor(engine.main_game.grid_bot);
    const gs = engine.main_game.grid_size;
    for(let y = sy; y <= ey; y++){
      for(let x = sx; x <= ex; x++){
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
      }
    }
  }

  setTileShader(shader: MultiColourTileShader, tile: Grid.WallTile){
    shader.setLeftColourFromColourRGB(this.tile_state_colours.get(tile.left)!);
    shader.setBotColourFromColourRGB(this.tile_state_colours.get(tile.top)!);
    shader.setRightColourFromColourRGB(this.tile_state_colours.get(tile.right)!);
    shader.setTopColourFromColourRGB(this.tile_state_colours.get(tile.bottom)!);
    const mid_colour = WebGL.Colour.ColourUtils.blue();
    shader.setMidColourFromColourRGB(mid_colour);
  }
}