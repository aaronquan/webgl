
import WebGL from './WebGL/globals';
import * as Shapes from './WebGL/Shapes/Shapes';
import * as CustomShader from './WebGL/Shaders/custom';
import * as Matrix from "./WebGL/Matrix/matrix";

import * as Mixin from './utils/mixin';
import * as App from './WebGL/app';
import * as Grid from './App/ResourceSim/grid_app';
import * as WebGLGlobals from './WebGL/globals';

import { newPuzzleApp } from './App/puzzle_box/app';

import * as Water from './App/water/water'
import * as Card from "./App/card/card";
import { newITApp } from './App/interface_testing/it_app';
import * as ResourceApp from "./App/ResourceSim/resource_app";

import * as Canvas2DApp from "./App/canvas2d/app";
//import * as CustomShaders from './shaders/custom';

const test_canvas2d = false; //change to move to canvas2d test

const canvas: HTMLCanvasElement = document.getElementById("app") as HTMLCanvasElement;

const overlay: HTMLDivElement = document.getElementById("overlay") as HTMLDivElement;

overlay.style.position = "absolute";
overlay.style.left = "50%";
overlay.style.top = "50%";
overlay.style.transform = "translate(-50%, -50%)";
overlay.style.color = "white";
overlay.textContent = "Loading";

canvas.width = window.innerWidth; // record this! TODO important for consistant resizing
canvas.height = window.innerHeight;

if(test_canvas2d){
  Canvas2DApp.runCanvas2DApp(canvas);
}else{
  WebGL.initialise(canvas);
  const gl = WebGL.gl;

  //const engine = new App.MyEngine();
  const engine = new Grid.WallEngine();
  engine.addOverlayElement(overlay);
  //const renderer = new App.MyRenderer();
  const renderer = new Grid.WallRenderer(canvas.width, canvas.height);
  renderer.addOverlayElement(overlay);


  const water_engine = new Water.WaterEngine();
  const water_renderer = new Water.WaterRenderer(canvas.width, canvas.height);

  const card_engine = new Card.CardEngine(canvas.width, canvas.height);
  const card_renderer = new Card.CardRenderer(canvas.width, canvas.height);
  //const app = ResourceApp.newApp(canvas.width, canvas.height);
  //const app = newPuzzleApp(canvas.width, canvas.height);

  const app = newITApp(canvas.width, canvas.height);

  app.loadResources(() => {
    console.log("running app");
    app.initApp();
    engine.onFinishLoading();
  });

  window.addEventListener("resize", (e: Event) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    app.resize(canvas.width, canvas.height, canvas);
  });
}

