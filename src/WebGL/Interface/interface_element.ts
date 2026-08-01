import * as WebGL from "./../globals";
type Int32 = number;
type Float = number;

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
  isInside(point: WebGL.Matrix.Point2D){
    const in_x = this.x < point.x && point.x < this.x+this.width;
    const in_y = this.y < point.y  && point.y < this.y+this.height;
    return in_x && in_y;
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

export class Rect{
  left: Float;
  right: Float;
  bot: Float;
  top: Float; // higher value than bot
  // l < r && b < t
  constructor(l: Float, r: Float, b: Float, t: Float){
    this.left = l;
    this.right = r;
    this.bot = b;
    this.top = t;
  }
  move(x: Float, y: Float){
    this.left += x; this.right += x;
    this.bot += y; this.top += y;
  }
  isInside(x: Float, y: Float){
    const in_x = this.left <= x && x <= this.right;
    const in_y = this.bot <= y && y <= this.top;
    return in_x && in_y;
  }
}

//export * as ScrollBar from "./scroll_bar"