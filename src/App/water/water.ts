import * as Matrix from "./../../WebGL/Matrix/matrix";
import * as App from "./../app";
import * as Grid from "./../grid"
import * as Shader from "./../../WebGL/Shaders/custom";
import * as Shapes from './../../WebGL/Shapes/Shapes';
import WebGL from "./../../WebGL/globals";

type Int32 = number;

const WaterStateEnum = {
  Nothing: 0,
  Wall: 1,
  Still: 2,
  Flow: 3,
}

type WaterState = typeof WaterStateEnum[keyof typeof WaterStateEnum];


export class WaterEngine extends App.BaseEngine{
  grid: Grid.RectGrid; 

  hovered: Grid.GridPosition | undefined;

  private state: WaterState[][];
  constructor(){
    super();
    const w = 10;
    const h = 10;
    this.grid = new Grid.RectGrid(10, 10, 20);
    this.state = Array.from({length: w}, () => Array.from({length: h}, () => WaterStateEnum.Nothing));

    this.hovered = undefined;
  }

  drop(x: Int32, y: Int32){

  }

  private toggleWallAtHovered(){
    if(this.hovered != undefined){
      switch(this.state[this.hovered.y][this.hovered.y]){
        case WaterStateEnum.Nothing:
          this.state[this.hovered.y][this.hovered.y] = WaterStateEnum.Wall;
          break;
        case WaterStateEnum.Wall:
          this.state[this.hovered.y][this.hovered.y] = WaterStateEnum.Nothing;
          break;
        default:
          break;
      }
    }
  }
  
  protected handleKeyDown(ev: KeyboardEvent): void {
    this.toggleWallAtHovered();
  }
  protected handleKeyUp(ev: KeyboardEvent): void {
    //throw new Error("Method not implemented.");
  }
  protected handleMouseMove(ev: MouseEvent): void {
    const x = ev.clientX;
    const y = ev.clientY;
    const coll = this.grid.getPosition(x, y);
    this.hovered = coll;
  }
  protected handleMouseDown(ev: MouseEvent): void {
    //throw new Error("Method not implemented.");
  }

}

export class WaterRenderer implements App.IEngineRenderer<WaterEngine>{
  private perspective: Matrix.TransformationMatrix3x3;
  private solid_shader: Shader.MVPColourProgram;

  private cell_colours: Map<WaterState, Int32>;

  constructor(width: Int32, height: Int32){
    this.perspective = Matrix.TransformationMatrix3x3.orthographic(0, width, height, 0);
    this.solid_shader = new Shader.MVPColourProgram();

    this.cell_colours = new Map();
  }
  render(engine: WaterEngine){
    const test_shape = WebGL.rectangleModel(10, 10, 100, 50);
    this.solid_shader.use();
    this.solid_shader.setColour(1, 1, 1);

    this.solid_shader.setMvp(this.perspective.multiplyCopy(test_shape));
    Shapes.Quad.draw();

    const scale = Matrix.TransformationMatrix3x3.scale(engine.grid.size, engine.grid.size);
    for(let y = 0; y < engine.grid.height; y++){
      for(let x = 0; x < engine.grid.width; x++){
        const tr = Matrix.TransformationMatrix3x3.translate(x*engine.grid.size, y*engine.grid.size);

        //set colour depending on water state enum

        this.solid_shader.setColour(y/10, 0, x/10);
        const model = tr.multiplyCopy(scale);
        this.solid_shader.setMvp(this.perspective.multiplyCopy(model));
        Shapes.Quad.draw();
      }
    }
    if(engine.hovered){
      this.solid_shader.setColour(1, 1, 1);
      Shapes.Quad.draw();
    }

  }
}