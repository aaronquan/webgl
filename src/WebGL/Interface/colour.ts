import * as WebGL from "./../globals"
import * as InterfaceElement from "./interface_element";
import * as Colour from './../colour';

import ColourUtils = Colour.ColourUtils;

type Int32 = number;
type Float = number;

export class HuePicker extends InterfaceElement.InterfaceElement{
  hue_value: Float;
  dragging: boolean;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    super(x, y, width, height);
    this.hue_value = 0.0;
    this.dragging = false;
  }
  onMouseMove(pt: WebGL.Geometry.Base.Point2D){
    if(this.dragging){
      this.hue_value = (pt.x - this.x)/this.width;
      if(this.hue_value < 0){
        this.hue_value = 0;
      }else if(this.hue_value > 1){
        this.hue_value = 1;
      }
    }
  }
  onMouseDown(pt: WebGL.Geometry.Base.Point2D){
    if(this.isInside(pt)){
      this.hue_value = (pt.x - this.x)/this.width;
      this.dragging = true;
    }
  }
  onMouseUp(){
    this.dragging = false;
  }
  toRGB(): WebGL.Colour.ColourRGB{
    const val = this.hue_value * 6;
    const section = Math.floor(val);
    const ratio = val - section;
    switch(section){
      case 0:
        return WebGL.Colour.ColourUtils.fromRGB(1.0, ratio, 0);
      case 1:
        return WebGL.Colour.ColourUtils.fromRGB(1.0-ratio, 1.0, 0);
      case 2:
        return WebGL.Colour.ColourUtils.fromRGB(0, 1.0, ratio);
      case 3:
        return WebGL.Colour.ColourUtils.fromRGB(0, 1.0-ratio, 1.0);
      case 4:
        return WebGL.Colour.ColourUtils.fromRGB(ratio, 0, 1.0);
      case 5:
        return WebGL.Colour.ColourUtils.fromRGB(1.0, 0, 1.0-ratio);
    }
    return WebGL.Colour.ColourUtils.fromRGB(0, 0, 0);
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, gradient_shader: WebGL.Shader.MVPHorizontalGradientProgram){
    const sw = this.width/6;
    gradient_shader.use();
    // red to yellow
    const ry_model = WebGL.WebGL.rectangleModel(this.x, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.red());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.yellow());
    gradient_shader.setMvp(vp.multiplyCopy(ry_model));
    WebGL.Shapes.Quad.drawRelative();

    // yellow to green
    const yg_model = WebGL.WebGL.rectangleModel(this.x+sw, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.yellow());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.green());
    gradient_shader.setMvp(vp.multiplyCopy(yg_model));
    WebGL.Shapes.Quad.drawRelative();

    // green to cyan
    const gc_model = WebGL.WebGL.rectangleModel(this.x+sw*2, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.green());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.cyan());
    gradient_shader.setMvp(vp.multiplyCopy(gc_model));
    WebGL.Shapes.Quad.drawRelative();

    // cyan to blue
    const cb_model = WebGL.WebGL.rectangleModel(this.x+sw*3, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.cyan());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.blue());
    gradient_shader.setMvp(vp.multiplyCopy(cb_model));
    WebGL.Shapes.Quad.drawRelative();
    // blue to pink

    const bp_model = WebGL.WebGL.rectangleModel(this.x+sw*4, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.blue());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.pink());
    gradient_shader.setMvp(vp.multiplyCopy(bp_model));
    WebGL.Shapes.Quad.drawRelative();

    // pink to red

    const pr_model = WebGL.WebGL.rectangleModel(this.x+sw*5, this.y, sw, this.height);
    gradient_shader.setColourLeftFromColourRGB(ColourUtils.pink());
    gradient_shader.setColourRightFromColourRGB(ColourUtils.red());
    gradient_shader.setMvp(vp.multiplyCopy(pr_model));
    WebGL.Shapes.Quad.drawRelative();

    //indicator
    colour_shader.use();
    const indicator_width = 4;
    const indicator_model = WebGL.WebGL.rectangleModel(this.x+(this.hue_value*this.width)-(indicator_width*0.5), this.y, indicator_width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(indicator_model));
    colour_shader.setColourFromColourRGB(ColourUtils.white());
    WebGL.Shapes.Quad.drawRelative();
  }
}