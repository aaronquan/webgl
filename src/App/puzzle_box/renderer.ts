import * as WebGL from "./../../WebGL/globals";
import * as PEngine from "./engine";
import { PuzzleEngine } from "./engine";



type Int32 = number;

export class PuzzleRenderer extends WebGL.App.SimpleAppRenderer<PuzzleEngine>{
  colour_shader: WebGL.Shader.MVPColourProgram;

  my_shape_colour: WebGL.Colour.ColourRGB;
  grid_colours: WebGL.Colour.ColourRGB[];
  constructor(w: Int32, h: Int32){
    super(w, h);
    this.font_names.push("font16-Sheet.png");

    this.colour_shader = new WebGL.Shader.MVPColourProgram();
    this.my_shape_colour = WebGL.Colour.ColourUtils.red();
    this.grid_colours = [];
  }
  render(engine: PuzzleEngine){
    engine.option_select.draw(this.orthographic, this.colour_shader, this.text_drawer);

    //this.drawStaticShapeLabel(engine.my_shapes[2], 200, 200);

    this.drawShapeGrid(engine, engine.interface_grid);

    for(const label of engine.shape_labels){
      this.drawShapeLabel(label);
    }

    if(engine.dragged_shape != undefined && engine.mouse_point != undefined){
      this.drawShape(engine.dragged_shape, engine.mouse_point.x, engine.mouse_point.y);
    }
    const hovered_shape_id = engine.getHoveredShapeId();
    if(hovered_shape_id != undefined){
      this.text_drawer.drawText(this.orthographic, 50, 50, hovered_shape_id.toString(), 15);
    }

    engine.interface.draw(this.orthographic, this.colour_shader, this.text_drawer);
  }

  fillColours(n_colours: Int32){
    while(this.grid_colours.length < n_colours){
      this.grid_colours.push(WebGL.Colour.ColourUtils.random());
    }
  }
  drawShapeInstance(){

  }

  drawShapeGrid(engine: PuzzleEngine, grid: PEngine.ShapeGridInterface){
    const grey = WebGL.Colour.ColourUtils.grey();
    WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 
      grid.x, grid.y, 
      grid.interfaceWidth(), grid.interfaceHeight(), 
      grey
    );
    const black = WebGL.Colour.ColourUtils.black();
    const red = WebGL.Colour.ColourUtils.red();
    const rect_size = grid.cell_size - 4;
    const clear_border = (grid.cell_size-rect_size)*0.5;
    for(let gy = 0; gy < grid.grid.height; gy++){
      for(let gx = 0; gx < grid.grid.width; gx++){
        const id = grid.grid.object_id[gx+gy*grid.grid.width];
        let col = black;
        if(engine.isInPositionPreview(gx, gy)){
          col = red;
        }else if(id != undefined){
          this.fillColours(id+1);
          col = this.grid_colours[id];
        }
        WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 
          grid.x+gx*grid.cell_size+clear_border, grid.y+gy*grid.cell_size+clear_border, 
          rect_size, rect_size, col
        );
        
      }
    }
  }

  drawShapeLabel(label: PEngine.ShapeLabel){
    label.draw(this.orthographic, this.colour_shader);
  }
  drawShape(shape: PEngine.GridShapeInstance, x: Int32, y: Int32){
    const mx = x+(shape.width*0.5);
    const my = y+(shape.height*0.5);
    const cell_size = 24;
    const rect_size = 20;
    const clear_border = (cell_size-rect_size)*0.5;
    let sy = my-(cell_size*shape.height*0.5);
    const sx = mx-(cell_size*shape.width*0.5);
    let gx = sx;
    for(let py = 0; py < shape.height; py++){
      gx = sx;
      for(let px = 0; px < shape.width; px++){
        if(shape.getPart(px, py)){
          WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 
            gx+clear_border, sy+clear_border, 
            rect_size, rect_size, this.my_shape_colour);
        }
        gx += cell_size;
      }
      sy += cell_size;
    }
  }
  renderTetris(engine: PuzzleEngine){
    const red = WebGL.Colour.ColourUtils.red();
    WebGL.WebGL.drawColourRect(this.orthographic, this.colour_shader, 
      10, 10, 
      200, 200, 
      red
    );
    
  }
}