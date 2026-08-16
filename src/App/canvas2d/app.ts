
import * as WebGL from "./../../WebGL/globals";
//for testing anything on screen for future offscreen canvas usage

type Int32 = number;

class TestEngine extends WebGL.App.BaseEngine{

}

class TestRenderer extends WebGL.App.SimpleAppRenderer<TestEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  saved_textures: WebGL.Texture.TextureCollection;
  texture_renderer: WebGL.Shader.MVPTextureProgram;

  constructor(w: Int32, h: Int32){
    super(w, h);
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.saved_textures = new WebGL.Texture.TextureCollection();
    this.texture_renderer = new WebGL.Shader.MVPTextureProgram();
  }
  render(e: TestEngine){
    //console.log(this.colour_shader);
    WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 500, 10, 100, 100, WebGL.Colour.ColourUtils.blue());
    //console.log("render");
    //console.log(e);
  }

}

export function runCanvas2DApp(canvas: HTMLCanvasElement){
  const width = canvas.width;
  const height = canvas.height;
  canvas.width = width*0.5;

  //create canvas for webgl2
  const body = document.getElementById("body")!;
  console.log(body);
  const gl_canvas = document.createElement("canvas");
  body.appendChild(gl_canvas);
  WebGL.WebGL.initialise(gl_canvas);
  gl_canvas.width = width*0.5;
  gl_canvas.height = height;
  gl_canvas.style.position = "absolute";
  gl_canvas.style.left = "50%";
  gl_canvas.style.top = "0";

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = 'red';
  ctx.fillRect(10, 10, 10, 10);
  const id = ctx.getImageData(0, 0, 20, 20);

  const tex = new WebGL.Texture.CanvasTexture();
  tex.setImageData(id);
  tex.load(() => {
    console.log("loaded");
  });
  const engine = new TestEngine();
  const renderer = new TestRenderer(gl_canvas.width, gl_canvas.height);
  renderer.saved_textures.addTexture("test", tex);

  const app = new WebGL.App.App(engine, renderer);
  app.loadResources(() => {
    app.initApp();
    console.log("init app");
  });

  //console.log(tex);
  
}