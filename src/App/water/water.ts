import * as Matrix from "./../../WebGL/Matrix/matrix";
import * as App from "./../app";
import * as Grid from "./../grid"
import * as Shader from "./../../WebGL/Shaders/custom";
import * as Shapes from './../../WebGL/Shapes/Shapes';
import * as Colour from './../../WebGL/colour';
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
    const w = 30;
    const h = 30;
    this.grid = new Grid.RectGrid(w, h, 20);
    this.state = Array.from({length: w}, () => Array.from({length: h}, () => WaterStateEnum.Nothing));

    this.hovered = undefined;
  }

  drop(x: Int32, y: Int32){
    //check below
    if(this.grid.isInsideGrid(x, y)){
      while(y < this.grid.height && this.state[y][x] == WaterStateEnum.Nothing){
        y++;
      }
      const my = y-1;
      if(y == this.grid.height){
        this.state[my][x] = WaterStateEnum.Flow;
      }else{
        if(this.state[y][x] == WaterStateEnum.Flow){
          this.state[my][x] = WaterStateEnum.Flow;
        }else{
          //hit a wall or still
          if(x-1 >= 0 && this.state[my][x-1] == WaterStateEnum.Nothing){
          //check left
            while(x-1 >= 0 && this.state[my][x-1] == WaterStateEnum.Nothing){
              //check below
              if(this.state[y][x-1] == WaterStateEnum.Nothing){
                console.log("drop left");
                this.drop(x-1, y);
                return;
              }else if(this.state[y][x-1] == WaterStateEnum.Flow){
                this.state[my][x-1] = WaterStateEnum.Flow;
                return;
              }
              x--;
            }
            if(x == 0){ // on left edge of map, water is flow
              this.state[my][0] = WaterStateEnum.Flow;
              return;
            }
            else if(x > 0){
              if(this.state[my][x-1] == WaterStateEnum.Flow){
                this.state[my][x] = WaterStateEnum.Flow;
              }else{
                this.state[my][x] = WaterStateEnum.Still;
              }
              return;
            }
          }
          else if(x+1 < this.grid.width && this.state[my][x+1] == WaterStateEnum.Nothing){
            //console.log("right");
            //check right
            while(x+1 < this.grid.width && this.state[my][x+1] == WaterStateEnum.Nothing){
              if(this.state[y][x+1] == WaterStateEnum.Nothing){
                console.log("drop right");
                this.drop(x+1, y);
                return;
              }else if(this.state[y][x+1] == WaterStateEnum.Flow){
                this.state[my][x+1] = WaterStateEnum.Flow;
                return;
              }
              x++;
            }
            if(x == this.grid.width){
              console.log("right lim");
            }else if(x < this.grid.width){
              if(this.state[my][x+1] == WaterStateEnum.Flow){
                this.state[my][x] = WaterStateEnum.Flow;
              }else{
                this.state[my][x] = WaterStateEnum.Still;
              }
            }
          }else{
            //
            console.log("open spot");
            if(this.state[my][x+1] == WaterStateEnum.Flow || this.state[my][x-1] == WaterStateEnum.Flow){
              this.state[my][x] = WaterStateEnum.Flow;
            }else{
              this.state[my][x] = WaterStateEnum.Still;
            }
          }
        }
      }
    }
  }

  private toggleWallAtHovered(){
    if(this.hovered != undefined){
      switch(this.state[this.hovered.y][this.hovered.x]){
        case WaterStateEnum.Nothing:
          this.state[this.hovered.y][this.hovered.x] = WaterStateEnum.Wall;
          break;
        case WaterStateEnum.Wall:
          this.state[this.hovered.y][this.hovered.x] = WaterStateEnum.Nothing;
          break;
        default:
          break;
      }
    }
  }
  stateAt(x: Int32, y: Int32): WaterState{
    return this.state[y][x];
  }
  
  protected handleKeyDown(ev: KeyboardEvent): void {
    if(this.hovered != undefined){
      this.drop(this.hovered.x, this.hovered.y);
    }
  }
  protected handleKeyUp(ev: KeyboardEvent): void {

  }
  protected handleMouseMove(ev: MouseEvent): void {
    const x = ev.clientX;
    const y = ev.clientY;
    const coll = this.grid.getPosition(x, y);
    this.hovered = coll;
  }
  protected handleMouseDown(ev: MouseEvent): void {
    console.log(this.hovered);
    this.toggleWallAtHovered();
  }

}

export class WaterRenderer implements App.IEngineRenderer<WaterEngine>{
  private perspective: Matrix.TransformationMatrix3x3;
  private solid_shader: Shader.MVPColourProgram;

  private cell_colours: Map<WaterState, Colour.ColourRGB>;

  private width: Int32;
  private height: Int32;

  constructor(width: Int32, height: Int32){
    this.width = width;
    this.height = height;
    this.perspective = Matrix.TransformationMatrix3x3.orthographic(0, width, height, 0);
    this.solid_shader = new Shader.MVPColourProgram();

    this.cell_colours = new Map();
    this.cell_colours.set(WaterStateEnum.Nothing, Colour.ColourUtils.black());
    this.cell_colours.set(WaterStateEnum.Wall, Colour.ColourUtils.white());
    this.cell_colours.set(WaterStateEnum.Still, Colour.ColourUtils.blue());
    this.cell_colours.set(WaterStateEnum.Flow , Colour.ColourUtils.red());
  }
  render(engine: WaterEngine){
    //background
    this.solid_shader.use();
    this.solid_shader.setColour(0.1, 0.2, 0.3);
    const bg_sq = WebGL.rectangleModel(0, 0, this.width, this.height);
    this.solid_shader.setMvp(this.perspective.multiplyCopy(bg_sq));
    Shapes.Quad.draw();

    const scale = Matrix.TransformationMatrix3x3.scale(engine.grid.size, engine.grid.size);
    for(let y = 0; y < engine.grid.height; y++){
      for(let x = 0; x < engine.grid.width; x++){
        const tr = Matrix.TransformationMatrix3x3.translate(x*engine.grid.size, y*engine.grid.size);

        //set colour depending on water state enum
        const colour = this.cell_colours.get(engine.stateAt(x, y))!;
        this.solid_shader.setColour(colour.red, colour.green, colour.blue);
        const model = tr.multiplyCopy(scale);
        this.solid_shader.setMvp(this.perspective.multiplyCopy(model));
        Shapes.Quad.draw();
      }
    }

    if(engine.hovered){
      this.solid_shader.setColour(1, 0.5, 1);
      const tr = Matrix.TransformationMatrix3x3.translate(engine.hovered.x*engine.grid.size, engine.hovered.y*engine.grid.size);
      const model = tr.multiplyCopy(scale);
      this.solid_shader.setMvp(this.perspective.multiplyCopy(model));
      Shapes.Quad.draw();
    }
    requestAnimationFrame(() => this.render(engine));
  }
}