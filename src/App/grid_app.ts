import * as Matrix from "../WebGL/Matrix/matrix";
import * as App from "./app";
import * as Grid from "./grid"
import * as Shader from "./../WebGL/Shaders/custom";
import * as Shapes from '../WebGL/Shapes/Shapes';
import WebGL from "../WebGL/globals";

export class WallEngine extends App.BaseEngine{
  grid: Grid.WallGrid;

  constructor(){
    super();
    this.grid = new Grid.WallGrid(10,10);
  }

  override handleKeyDown(ev: KeyboardEvent){
    this.grid.randomise();
  }
}

export class WallRenderer implements App.IEngineRenderer<WallEngine>{
  grid_tile_shader: Shader.MVPSolidPathProgram;
  vp: Matrix.TransformationMatrix3x3;
  constructor(){
    this.grid_tile_shader = new Shader.MVPSolidPathProgram();
    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
  }
  render(engine: WallEngine){
    //const perspective = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
    const gs = 50;
    const ctx = WebGL.gl;
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
        if(engine.grid.grid[y][x].left){
          this.grid_tile_shader.setLeft(1.0);
        }else{
          this.grid_tile_shader.setLeft(0.0);
        }
        if(engine.grid.grid[y][x].bottom){
          this.grid_tile_shader.setBot(1.0);
        }else{
          this.grid_tile_shader.setBot(0.0);
        }
        if(engine.grid.grid[y][x].right){
          this.grid_tile_shader.setRight(1.0);
        }else{
          this.grid_tile_shader.setRight(0.0);
        }
        if(engine.grid.grid[y][x].top){
          this.grid_tile_shader.setTop(1.0);
        }else{
          this.grid_tile_shader.setTop(0.0);
        }
        this.grid_tile_shader.setSize(0.2);
        Shapes.Quad.drawRelative();
      }
    }
    const model = Matrix.TransformationMatrix3x3.translate(0, 0);
    model.multiply(Matrix.TransformationMatrix3x3.scale(gs, gs));
    requestAnimationFrame(() => this.render(engine));
  }

}