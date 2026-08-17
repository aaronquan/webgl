
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
    const gl = WebGL.WebGL.gl!;
    //console.log(this.colour_shader);
    //WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 10, -10, 100, 100, WebGL.Colour.ColourUtils.blue());
    //console.log("render");
    //console.log(e);
    //this.colour_shader.use();
    //this.colour_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.red());
    const model = WebGL.WebGL.rectangleModel(100, 100, 50, 50);
    //this.colour_shader.setMvp(this.orthographic.multiplyCopy(model));
    //WebGL.Shapes.Quad.draw();

    this.saved_textures.active("test", 1);
    this.texture_renderer.use();
    this.texture_renderer.setTextureId(1);
    this.texture_renderer.setMvp(this.orthographic.multiplyCopy(model));
    WebGL.Shapes.Quad.draw();
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
  gl_canvas.width = width*0.5;
  gl_canvas.height = height;
  gl_canvas.style.position = "absolute";
  gl_canvas.style.left = "50%";
  gl_canvas.style.top = "0";
  WebGL.WebGL.initialise(gl_canvas);

  
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = 'red';
  ctx.fillRect(10, 10, 20, 20);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, 5, 5);
  const id = ctx.getImageData(0, 0, 50, 50);
  console.log(id);
  
  const tex = new WebGL.Texture.CanvasTexture();
  tex.setImageData(id);
  tex.load(() => {
    console.log("texture loaded");
  },

  );
  
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