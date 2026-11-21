import * as WebGL from "./../globals"
import * as InterfaceElement from "./interface_element";

import ColourUtils = WebGL.Colour.ColourUtils;

export class HuePicker extends InterfaceElement.InterfaceElement{
  
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, gradient_shader: WebGL.Shader.MVPHorizontalGradientProgram){
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
  }
}