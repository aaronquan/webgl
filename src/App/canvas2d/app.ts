
import * as WebGL from "./../../WebGL/globals";
//for testing anything on screen for future offscreen canvas usage

type Int32 = number;

class TestEngine extends WebGL.App.BaseEngine{

}

class TestRenderer extends WebGL.App.SimpleAppRenderer<TestEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  saved_textures: WebGL.Texture.GenericTextureCollection;
  texture_shader: WebGL.Shader.MVPTextureProgram;
  colour_texture_shader: WebGL.Shader.MVPTextureColourProgram;

  test_font: WebGL.Texture.Canvas2DFont;
  font2: WebGL.Texture.Canvas2DFont;

  constructor(w: Int32, h: Int32){
    super(w, h);
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.saved_textures = new WebGL.Texture.GenericTextureCollection();
    this.texture_shader = new WebGL.Shader.MVPTextureProgram();
    this.colour_texture_shader = new WebGL.Shader.MVPTextureColourProgram();
    this.test_font = new WebGL.Texture.Canvas2DFont("serif", 20);
    this.test_font.loadTextures();

    this.font2 = new WebGL.Texture.Canvas2DFont("Arial", 20);
    this.font2.loadTextures();
  }
  render(e: TestEngine){
    const gl = WebGL.WebGL.gl!;
    //console.log(this.colour_shader);
    //WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 10, -10, 100, 100, WebGL.Colour.ColourUtils.blue());
    //console.log("render");
    //console.log(e);
    //this.colour_shader.use();
    //this.colour_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.red());
    //const model = WebGL.WebGL.rectangleModel(50, 50, 50, 50);
    //this.colour_shader.setMvp(this.orthographic.multiplyCopy(model));
    //WebGL.Shapes.Quad.draw();

    //this.saved_textures.active("test", 1);
    //this.texture_renderer.use();
    //this.texture_renderer.setTextureId(1);
    //this.texture_renderer.setMvp(this.orthographic.multiplyCopy(model));
    //WebGL.Shapes.Quad.drawRelative();
    /*
    WebGL.WebGL.enableBlend();
    let x = 100;
    for(const c of "abcdef"){
      const dims = this.saved_textures.getDimensions(c)!;
      const a_model = WebGL.WebGL.rectangleModel(x, 100, dims.width, dims.height);
      this.saved_textures.active(c, 0);
      this.texture_renderer.setTextureId(0);
      this.texture_renderer.setMvp(this.orthographic.multiplyCopy(a_model));
      WebGL.Shapes.Quad.drawRelative();
      x += dims.width;
    }
    WebGL.WebGL.disableBlend();*/

    this.test_font.drawExample(this.orthographic, this.texture_shader);
    this.test_font.drawText(this.orthographic, this.colour_texture_shader, 100, 100, "hello");

    this.font2.drawText(this.orthographic, this.colour_texture_shader, 100, 140, "hello");
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

  const engine = new TestEngine();
  const renderer = new TestRenderer(gl_canvas.width, gl_canvas.height);

  
  const ctx = canvas.getContext("2d")!;


  /*

  //texture examples
  ctx.fillStyle = "grey";
  //ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = 'red';
  ctx.fillRect(10, 10, 50, 50);
  ctx.fillStyle = "blue";
  ctx.fillRect(40, 40, 5, 5);
  const id = ctx.getImageData(0, 0, 50, 50);
  
  console.log(id);
  
  const tex = new WebGL.Texture.CanvasTexture();
  tex.setImageData(id);
  tex.load(() => {
    console.log("texture loaded");
  },

  );
  
  renderer.saved_textures.addTexture("test", tex);
  */
  ctx.fillStyle = "blue";
  const font_size = 30;
  ctx.font = `${font_size.toString()}px serif`;


  for(const c of "j"){
    const metrics = ctx.measureText(c);
    console.log(metrics);

    ctx.fillText(c, 0, font_size);

    const a_width = Math.ceil(metrics.width);
    const a_height = font_size;

    const a = ctx.getImageData(metrics.actualBoundingBoxLeft, metrics.fontBoundingBoxDescent, 
      a_width, a_height);
    
    const a_tex = new WebGL.Texture.CanvasTexture();
    a_tex.setImageData(a);
    a_tex.load(() => {

    });
    renderer.saved_textures.addTexture(c, a_tex);
    
    ctx.clearRect(0, 0, 50, 50);
  }

  ctx.fillText("abcdefghijklmnopqrstuvwxyz", 0, font_size);


  const app = new WebGL.App.App(engine, renderer);
  app.loadResources(() => {
    app.initApp();
    console.log("init app");
  });

  //console.log(tex);
  
}


function addLetterTexture(letter: string){

}