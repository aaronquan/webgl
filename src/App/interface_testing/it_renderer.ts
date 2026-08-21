import * as WebGL from "./../../WebGL/globals";
import { ITEngine } from "./it_engine";

type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;

export class ITRenderer extends WebGL.App.SimpleAppRenderer<ITEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  circle_shader: WebGL.Shader.MVPCircleOnlyProgram;
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.circle_shader = new WebGL.Shader.MVPCircleOnlyProgram();
  }

  render(engine: ITEngine){
    engine.button.draw(this.orthographic, this.colour_shader, this.text_drawer);
    engine.toggle_button.draw(this.orthographic, this.colour_shader, this.text_drawer);


    for(let i = engine.windows.draw_order.length-1; i >= 0; i--){
      const id = engine.windows.draw_order[i];
      //console.log(id);
      engine.windows.windows[id].draw(this.orthographic, this.colour_shader);
      if(id === 0){
        engine.vwindow.drawContent(this.orthographic, this.colour_shader);
      }
    }

    //engine.vwindow.draw(this.orthographic, this.colour_shader);
    //engine.vwindow.drawContent(this.orthographic, this.colour_shader);

    //engine.hwindow.draw(this.orthographic, this.colour_shader);
    this.drawLinesFromPoints(engine.triangle.getDrawPoints());
    engine.triangle.drawPoints(this.orthographic, this.circle_shader);


    //test hexagon

    const hex_points = WebGL.Grid.Hexagon.Hexagon.getBasePoints(1);

    hex_points.push(hex_points[0].copy());
    const scaled_points = hex_points.map((p) => {
      return new Point2D(p.x*20 + 80, p.y*20 + 80);
    });


    const hex1 = new WebGL.Grid.Hexagon.Hexagon(0, 0, 0);
    const hex_pts = hex1.toPoints(0, 50);
    this.drawLinesFromPoints

    this.drawLinesFromPoints(scaled_points);
  }

  drawLinesFromPoints(points: Point2D[]){
    this.colour_shader.use();
    for(let i = 1; i < points.length; i++){
      const p1 = points[i-1];
      const p2 = points[i];
      const model = WebGL.WebGL.lineModel(p1.x, p1.y, p2.x, p2.y, 3);
      this.colour_shader.setMvp(this.orthographic.multiplyCopy(model));
      this.colour_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.red());
      WebGL.Shapes.Quad.draw();
    }
  }
}