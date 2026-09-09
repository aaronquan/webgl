import * as WebGL from "./../../WebGL/globals";
import { ITEngine } from "./it_engine";

type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;
import { simple } from "../../WebGL/Shaders/Fragment/Source/fragment_source";

export class ITRenderer extends WebGL.App.SimpleAppRenderer<ITEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;
  circle_shader: WebGL.Shader.MVPCircleOnlyProgram;
  diamond_shader: WebGL.Shader.MVPDiamondProgram;
  hexagon_shader: WebGL.Shader.MVPHexagonProgram;
  hexagonp_shader: WebGL.Shader.MVPHexagonPointyProgram;

  simple_shader: WebGL.Shader.SimpleColourProgram;

  colours: WebGL.Colour.ColourRGBCollection;

  canvas_width: Int32;
  canvas_height: Int32;

  constructor(w: Int32, h: Int32){
    super(w, h);
    this.canvas_width = w;
    this.canvas_height = h;
    this.font_names.push("font16-Sheet.png");
    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.circle_shader = new WebGL.Shader.MVPCircleOnlyProgram();
    this.diamond_shader = new WebGL.Shader.MVPDiamondProgram();
    this.hexagon_shader = new WebGL.Shader.MVPHexagonProgram();
    this.hexagonp_shader = new WebGL.Shader.MVPHexagonPointyProgram();

    this.simple_shader = new WebGL.Shader.SimpleColourProgram();

    this.colours = new WebGL.Colour.ColourRGBCollection();
    this.colours.addBaseColours();
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


    const hex1 = new WebGL.Grid.Hexagon.Hexagon(1, 1, 0);
    const hex_pts = hex1.toPoints(0, 50);
    hex_pts.push(hex_pts[0]);
    
    //this.drawLinesFromPoints(hex_pts);

    //draw the hex grid
    //engine.hex_grid.drawOutlineWithLayout(this.orthographic, this.colour_shader, WebGL.Colour.ColourUtils.green(), 4);
    
    //engine.hex_grid.drawOutline(this.orthographic, this.colour_shader, 20, 30, 30, WebGL.Colour.ColourUtils.green(), 4);
    

    //this.drawLinesFromPoints(scaled_points);

    //test diamond drawing
    this.diamond_shader.use();
    const model = WebGL.WebGL.rectangleModel(150, 150, 100, 100);

    this.diamond_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.pink());
    this.diamond_shader.setMvp(this.orthographic.multiplyCopy(model));
    WebGL.Shapes.Quad.drawRelative();

    
    this.hexagon_shader.use();
    this.hexagon_shader.setOrientation(WebGL.Grid.Hexagon.HexOrientationEnum.Pointy);
    let hm = WebGL.WebGL.rectangleModel(250, 250, 100, 100);
    this.hexagon_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.pink());
    this.hexagon_shader.setMvp(this.orthographic.multiplyCopy(hm));
    WebGL.Shapes.Quad.drawRelative();

    //engine.hex_grid.drawSolidWithLayout(this.orthographic, this.hexagon_shader, this.colours.getColour("blue")!);
    engine.hex_grid.drawOutlineWithLayout(this.orthographic, this.colour_shader, WebGL.Colour.ColourUtils.green(), 4);
    if(engine.hover_hex != undefined){
      engine.hex_grid.drawSolidHexWithLayout(this.orthographic, this.hexagon_shader, engine.hover_hex.x,
        engine.hover_hex.y, this.colours.getColour("pink")!
      );
    }
    /*
    engine.tri_grid.drawOutline(this.orthographic, this.colour_shader, this.colours.getColour("blue")!, 2);

    if(engine.test_triangle.length >= 3){
      this.simple_shader.use();
      this.simple_shader.setColourFromColourRGB(this.colours.getColour("blue")!);
      //WebGL.Shapes.Triangle
      
      WebGL.Shapes.Triangle.drawGlobal(
        engine.test_triangle[0],
        engine.test_triangle[1],
        engine.test_triangle[2],
        this.canvas_width, this.canvas_height
      );
    }*/



    /*
    this.hexagonp_shader.use();
    hm = WebGL.WebGL.rectangleModel(450, 250, 20, 20);
    this.hexagonp_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.pink());
    this.hexagonp_shader.setMvp(this.orthographic.multiplyCopy(hm));
    WebGL.Shapes.Quad.drawRelative();
    */
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