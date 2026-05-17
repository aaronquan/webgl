import * as WebGL from "./../../WebGL/globals";
import { ITEngine } from "./it_engine";

type Int32 = number;

export class ITRenderer extends WebGL.App.SimpleAppRenderer<ITEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
  }

  render(engine: ITEngine){
    engine.button.draw(this.orthographic, this.colour_shader, this.text_drawer);
    engine.toggle_button.draw(this.orthographic, this.colour_shader, this.text_drawer);
    engine.vwindow.drawAll(this.orthographic, this.colour_shader);
  }
}