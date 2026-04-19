
import * as WebGL from "./../WebGL/globals";

type Int32 = number;

export class SingleSelectOptions{
  selected: Int32;
  options: string[];
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;
  text_size: Int32;
  padding: Int32;

  background_colour: WebGL.Colour.ColourRGB;
  text_colour: WebGL.Colour.ColourRGB;
  selected_colour: WebGL.Colour.ColourRGB;

  private dividers: Int32[];
  constructor(options: string[]){
    this.selected = 0;
    this.x = 10;
    this.y = 10;
    //this.width = 40;
    this.height = 20;
    this.text_size = 10;
    this.padding = 3;

    this.options = options;

    const n_chars = this.options.reduce((pv, cv) => {
      return pv + cv.length;
    }, 0);

    this.width = (this.text_size*n_chars)+(this.padding*(this.options.length+1));
    this.dividers = this.generateDividers(this.options, this.text_size);

    this.background_colour = WebGL.Colour.ColourUtils.white();
    this.text_colour = WebGL.Colour.ColourUtils.black();
    this.selected_colour = WebGL.Colour.ColourUtils.pink();
  }
  generateDividers(opts: string[], ts: Int32): Int32[]{
    const divs: Int32[] = [];
    let curr = 0;
    for(const s of opts){
      divs.push(curr);
      curr += s.length*ts;
    }
    return divs;
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer){
    const n_chars = this.options.reduce((pv, cv) => {
      return pv + cv.length;
    }, 0);
    const padding = this.padding;
    const width = (this.width);

    //background
    colour_shader.use();
    colour_shader.setColourFromColourRGB(this.background_colour);
    const backgrond_model = WebGL.WebGL.rectangleModel(this.x, this.y, width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(backgrond_model));
    WebGL.Shapes.Quad.draw();

    let offset = this.x+this.padding;
    const text_y = this.y+(this.height-this.text_size)*0.5;
    for(const str of this.options){
      //draw text
      const text_width = text_drawer.getTextWidth(str, this.text_size);
      text_drawer.drawTextColour(vp, offset, text_y, str, this.text_size, this.text_colour);

      //draw divider lines

      const line_model = WebGL.WebGL.rectangleModel(offset-this.padding, this.y, 1, this.height);
      colour_shader.use();
      colour_shader.setColourFromColourRGB(this.text_colour);
      colour_shader.setMvp(vp.multiplyCopy(line_model));
      WebGL.Shapes.Quad.draw();
      
      offset += this.padding+text_width;
    }
  }
}