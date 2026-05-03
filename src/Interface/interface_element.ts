import * as WebGL from "./../WebGL/globals";
type Int32 = number;

export class InterfaceElement{
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  drawBackground(vp: WebGL.Matrix.TransformationMatrix3x3, 
    colour_shader: WebGL.Shader.MVPColourProgram, 
    bg_colour: WebGL.Colour.ColourRGB){
    colour_shader.use();
    colour_shader.setColourFromColourRGB(bg_colour);
    const bg_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(bg_model));
    WebGL.Shapes.Quad.draw();
  }

}