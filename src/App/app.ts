import WebGL from "../WebGL/globals";
import * as Shapes from '../WebGL/Shapes/Shapes';
import * as CustomShader from "../WebGL/Shaders/custom";
import * as Matrix from "../WebGL/Matrix/matrix";
import * as Grid from "./grid";



interface IEngine{
  addEvents: () => void;
}

export class BaseEngine implements IEngine{
  constructor(){};
  addEvents(){
    this.addKeyEvents();
  }
  private addKeyEvents(){
    window.addEventListener("keydown", (ev) => this.handleKeyDown(ev));
    window.addEventListener("keyup", (ev) => this.handleKeyUp(ev));
    window.addEventListener("mousemove", (ev) => this.handleMouseMove(ev));
    window.addEventListener("mousedown", (ev) => this.handleMouseDown(ev));
    window.addEventListener("mouseup", (ev) => this.handleMouseUp(ev));
  }

  //to override
  protected handleKeyDown(ev: KeyboardEvent){};
  //to override
  protected handleKeyUp(ev: KeyboardEvent){};
  //to override
  protected handleMouseMove(ev: MouseEvent){};
  //to override
  protected handleMouseDown(ev: MouseEvent){};
  //to override
  protected handleMouseUp(ev: MouseEvent){};

}

export interface IEngineRenderer<E extends IEngine>{
  render: (engine: E) => void;
}

interface IRenderer{
  render: () => void;
}

export class App<E extends IEngine>{
  private engine: E;
  private renderer: IEngineRenderer<E>;

  constructor(engine: E, renderer: IEngineRenderer<E>){
    this.engine = engine;
    this.renderer = renderer;
  }
  addEvents(){
    this.engine.addEvents();
  }
  draw(){
    this.renderer.render(this.engine);
  }
}

type Position = {
  x: number, y: number
};

export class MyEngine extends BaseEngine{
  width: number;
  height: number
  obj: number[];
  positions: Position[];
  mouse: Position;

  grid: Grid.RectGrid;

  //gw: number;
  //gh: number;
  //gsize: number;

  mouse_grid_coord: Position | undefined;

  constructor(){
    super();
    this.obj = [];
    this.positions = [];
    this.mouse = {x: 0, y: 0};
    this.width = 500;
    this.height = 500;

    this.grid = new Grid.RectGrid(10, 10, 25);
    //this.gw = 10;
    //this.gh = 10;
    //this.gsize = 25;
    //this

    this.mouse_grid_coord = undefined;
  }
  protected override handleKeyDown(ev: KeyboardEvent): void {
    this.obj.push(Math.random());
    console.log(this.mouse);
  }
  protected override handleKeyUp(ev: KeyboardEvent): void {
    
  }
  protected override handleMouseMove(ev: MouseEvent): void {
    this.mouse = {x: ev.clientX, y: ev.clientY};
    const coords = document.getElementById("coords") as HTMLElement;
    coords.innerText = `x: ${ev.clientX}, y: ${ev.clientY}`;
    //const grid_width = this.grid.pixel_width;
    //const grid_height = this.grid.pixel_height;
    this.mouse_grid_coord = this.grid.getPosition(this.mouse.x, this.mouse.y);
  }
  protected override handleMouseDown(ev: MouseEvent): void{
    this.positions.push({x: (this.mouse.x*2/this.width) - 1, y: 1 - (this.mouse.y*2/this.height)});
    //console.log({x: this.mouse.x/this.width - 1, y: this.mouse.y/this.height - 1});
  }
}

export class MyRenderer implements IEngineRenderer<MyEngine>{
  transform_colour: CustomShader.TransformColourProgram;
  transform_circle: CustomShader.TransformCircleProgram;
  mvp_colour: CustomShader.MVPColourProgram;
  mvp_outline_circle: CustomShader.MVPOutlineCircleProgram;
  mvp_outline_rect: CustomShader.MVPOutlineRectProgram;
  mvp_solid_line: CustomShader.MVPSolidLineProgram;
  vp: Matrix.TransformationMatrix3x3;
  constructor(){
    this.transform_colour = new CustomShader.TransformColourProgram();
    this.transform_circle = new CustomShader.TransformCircleProgram();
    this.mvp_colour = new CustomShader.MVPColourProgram();
    this.mvp_outline_circle = new CustomShader.MVPOutlineCircleProgram();
    this.mvp_outline_rect = new CustomShader.MVPOutlineRectProgram();
    this.mvp_solid_line = new CustomShader.MVPSolidLineProgram();
    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
  }
  renderGrid(engine: MyEngine){
    this.mvp_colour.use();
    const perspective = Matrix.TransformationMatrix3x3.orthographic(0, 500, 500, 0);
    const view = Matrix.TransformationMatrix3x3.translate(0, 0);
    this.vp = perspective.multiplyCopy(view);
    //this.mvp_colour.setView(view);
    //const model = Matrix.TransformationMatrix3x3.translate(100, 100);
    //model.multiply(Matrix.TransformationMatrix3x3.scale(100, 100));
    //this.mvp_colour.setColour(0, 0, 0);
    //Shapes.CenterQuad.drawRelative();
    //this.mvp_colour.setView(view);
    for(let y = 0; y < engine.grid.height; y++){
      for(let x = 0; x < engine.grid.width; x++){
        const model = engine.grid.getTransformation(x, y);
        const mvp = this.vp.multiplyCopy(model);
        this.mvp_colour.setMvp(mvp);
        this.mvp_colour.setColour(x/engine.grid.width, y/engine.grid.height, 0.5);
        Shapes.Quad.drawRelative();
      }
    }
  }
  render(engine: MyEngine){
    if(WebGL.gl){
      const gl = WebGL.gl;
      
      gl.clear(gl.COLOR_BUFFER_BIT);
      //gl.clearColor(1,1,1,1);
      gl.colorMask(true, true, true, false);

      this.renderGrid(engine);
      if(engine.mouse_grid_coord != undefined){
        this.mvp_outline_circle.use();
        this.mvp_outline_circle.setOutlineColour(1,0,0,1);
        this.mvp_outline_circle.setCentre(0.5, 0.5);
        this.mvp_outline_circle.setRadius(0.5);
        this.mvp_outline_circle.setOutlineRadius(0.1);
        const model = engine.grid.getCenterTransformation(engine.mouse_grid_coord.x, engine.mouse_grid_coord.y);
        model.multiply(Matrix.TransformationMatrix3x3.scale(1.6, 1.2));
        this.mvp_outline_circle.setMvp(this.vp.multiplyCopy(model));
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        Shapes.CenterQuad.drawRelative();
        gl.disable(gl.BLEND);
      }
      this.mvp_outline_circle.use();
      const model = Matrix.TransformationMatrix3x3.translate(200, 200);
      model.multiply(Matrix.TransformationMatrix3x3.scale(50, 50));
      this.mvp_outline_circle.setCentre(0.5, 0.5);
      this.mvp_outline_circle.setRadius(0.5);
      this.mvp_outline_circle.setOutlineRadius(0.1);
      this.mvp_outline_circle.setOutlineColour(1, 0.5, 0, 1);
      this.mvp_outline_circle.setMvp(this.vp.multiplyCopy(model));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      Shapes.Quad.drawRelative();
      gl.disable(gl.BLEND);

      
      const lmodel = Matrix.TransformationMatrix3x3.translate(250, 250);
      lmodel.multiply(Matrix.TransformationMatrix3x3.scale(150, 150));
      this.mvp_solid_line.use();
      this.mvp_solid_line.setEquation(1.6, 12.6, -12.5);
      this.mvp_solid_line.setMvp(this.vp.multiplyCopy(lmodel));
      this.mvp_solid_line.setThickness(0.6);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      Shapes.Quad.drawRelative();
      gl.disable(gl.BLEND);
  
    }
    requestAnimationFrame(() => this.render(engine));
  };
  
}


export class TestRenderer{
  transform_colour: CustomShader.TransformColourProgram;
  constructor(){
    this.transform_colour = new CustomShader.TransformColourProgram();
  }

  render(){
    if(WebGL.gl){
      const gl = WebGL.gl;
      gl.clear(gl.COLOR_BUFFER_BIT);

      this.transform_colour.use();
      this.transform_colour.setMatrix(Matrix.TransformationMatrix3x3.scale(0.5, 0.5));

      Shapes.Quad.drawArrays();

      this.transform_colour.setColour(0.5, 0.8, 0.5);
      this.transform_colour.setMatrix(Matrix.TransformationMatrix3x3.rotate(0.4));

      Shapes.RightTriangle.draw();

      this.transform_colour.setMatrix(Matrix.TransformationMatrix3x3.translate(-0.9, -0.9));
      this.transform_colour.setColour(0.6, 0.4, 0.7);

      Shapes.Quad.drawArrays();

      this.randomDraw(this.transform_colour);
    }
  }

  private randomDraw(shader: CustomShader.TransformColourProgram){
    for(let i = 0; i < 100; i++){
      const sh = Math.floor(Math.random()*3);
      const matrix = Matrix.TransformationMatrix3x3.translate(Math.random()-0.5, Math.random()-0.5);
      matrix.multiply(Matrix.TransformationMatrix3x3.scale(Math.random()/2, Math.random()/2));
      shader.setMatrix(matrix);
      shader.setColour(Math.random(),Math.random(),Math.random());
      switch(sh){
        case 0:
          Shapes.Quad.draw();
          break;
        case 1:
          Shapes.Quad.drawArrays();
          break;
        case 2:
          Shapes.RightTriangle.draw();
          break;
      }

    }
  }
}
