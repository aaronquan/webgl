
import WebGL from './WebGL/globals';
import * as Shapes from './WebGL/Shapes/Shapes';
import * as CustomShader from './WebGL/Shaders/custom';
import * as Matrix from "./WebGL/Matrix/matrix";

import * as Mixin from './utils/mixin';
import * as App from './App/app';
import * as Grid from './App/grid_app';
import * as WebGLGlobals from './WebGL/globals';

import * as Water from './App/water/water'
//import * as CustomShaders from './shaders/custom';

const canvas: HTMLCanvasElement = document.getElementById("app") as HTMLCanvasElement;

canvas.width = 900;
canvas.height = 900;

//console.log(txt.);
//const gl: WebGL2RenderingContext = canvas.getContext("webgl2")!;
WebGL.initialise(canvas);

const gl = WebGL.gl;


//const engine = new App.MyEngine();
const engine = new Grid.WallEngine();
//const renderer = new App.MyRenderer();
const renderer = new Grid.WallRenderer(canvas.width, canvas.height);
const app = new App.App(engine, renderer);


const water_engine = new Water.WaterEngine();
const water_renderer = new Water.WaterRenderer(canvas.width, canvas.height);

if(gl){
  app.addEvents();
  app.draw();
  //water_renderer.render(water_engine);
}else{

}

/*
function draw2(){
  //const transformColour = new CustomShader.TransformColourProgram();
  //const translateColour = new CustomShader.TranslateColourMixin();

  const t = Date.now();

  const matrix = Matrix.TransformationMatrix3x3.identity();
  //matrix.rotate(0.5);
  //const rot = Matrix.TransformationMatrix3x3.rotate(t/360);
  //matrix.multiply(rot);
  //const sc = Matrix.TransformationMatrix3x3.scale(1.0, 1.0);
  //matrix.multiply(sc);

  transformColour.use();
  transformColour.setTransform(matrix);
  transformColour.setColour(0.5, 0.8, 0.5);

  Shapes.RightTriangle.draw();
  requestAnimationFrame(draw2);
}

function drawScene(){

  gl?.clear(gl.COLOR_BUFFER_BIT);

  const transformColour = new CustomShader.TransformColourProgram();
  const translateColour = new CustomShader.TranslateColourProgram();

  const t = Date.now();

  const matrix = Matrix.TransformationMatrix3x3.translate(Math.sin(t/400)/1.5, Math.cos(t/600)/3);
  //matrix.rotate(0.5);
  const rot = Matrix.TransformationMatrix3x3.rotate(t/360);
  matrix.multiply(rot);
  const sc = Matrix.TransformationMatrix3x3.scale(1.0, 1.0);
  matrix.multiply(sc);

  transformColour.use();
  transformColour.setTransform(matrix);
  transformColour.setColour(0.5, 0.8, 0.5);

  //Shapes.RightTriangle.draw();
  Shapes.RightTriangle.draw();
  //Shapes.Quad.draw();

  //program.use();
  //program.setTranslate(-0.8, -0.8);
  translateColour.use();
  translateColour.setColour(0.4, 0.2, 0.5);
  translateColour.setTranslate(-0.4, -0.9);

  requestAnimationFrame(drawScene);
}
*/
