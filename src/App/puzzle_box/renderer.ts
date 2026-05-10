import * as WebGL from "./../../WebGL/globals";
import { PuzzleEngine } from "./engine";

type Int32 = number;

export class PuzzleRenderer extends WebGL.App.SimpleAppRenderer<PuzzleEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");

    this.colour_shader = new WebGL.Shader.MVPColourProgram();
  }
  render(engine: PuzzleEngine){
    this.text_drawer.drawText(this.orthographic, 50, 50, "hi here", 15);
    engine.option_select.draw(this.orthographic, this.colour_shader, this.text_drawer);
  }
}