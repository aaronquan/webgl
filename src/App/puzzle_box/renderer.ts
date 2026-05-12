import * as WebGL from "./../../WebGL/globals";
import * as PEngine from "./engine";
import { PuzzleEngine } from "./engine";

type Int32 = number;

export class PuzzleRenderer extends WebGL.App.SimpleAppRenderer<PuzzleEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;

  my_shape_colour: WebGL.Colour.ColourRGB;
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");

    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.my_shape_colour = WebGL.Colour.ColourUtils.red();
  }
  render(engine: PuzzleEngine){
    this.text_drawer.drawText(this.orthographic, 50, 50, "hi here", 15);
    engine.option_select.draw(this.orthographic, this.colour_shader, this.text_drawer);
  }

  renderShape(shape: PEngine.GridShape, x: Int32, y: Int32){
    
    const cell_size = 24;

    const rect_size = 20;

    const clear_border = (cell_size-rect_size)*0.5;

    let gx = x;
    for(let py = 0; py < shape.height; py++){
      gx = x;
      for(let px = 0; px < shape.width; px++){
        if(shape.hasPartAt(px, py)){
          WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 
            gx+clear_border, y+clear_border, 
            rect_size, rect_size, this.my_shape_colour);
        }
        x += cell_size;
      }
      y += cell_size;
    }

  }
}