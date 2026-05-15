import * as WebGL from "./../globals";
import { InterfaceElement } from "./interface_element";

type Int32 = number;
type Float = number;
export class HorizontalScrollBar extends InterfaceElement{
  bar_width: Float;
  value: Float;
  window_width: Int32;
  content_width: Int32;

  bar_colour: WebGL.Colour.ColourRGB;
  hover_bar_colour: WebGL.Colour.ColourRGB;
  grabbed_bar_colour: WebGL.Colour.ColourRGB;
  background_colour: WebGL.Colour.ColourRGB;

  scroll_drag: boolean;
  scroll_bar_hover: boolean;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32, window_width: Int32, content_width: Int32){
    super(x, y, width, height);


    this.window_width = window_width;
    this.content_width = content_width;
    this.bar_width = width * (this.window_width/this.content_width);
    this.value = 0;

    this.bar_colour = WebGL.Colour.ColourUtils.grey(0.3);
    this.hover_bar_colour = WebGL.Colour.ColourUtils.grey(0.5);
    this.grabbed_bar_colour = WebGL.Colour.ColourUtils.grey(0.7);
    this.background_colour = WebGL.Colour.ColourUtils.black();

    this.scroll_drag = false;
    this.scroll_bar_hover = false;
    
  }
  validScroll(): boolean{
    return this.content_width > this.window_width;
  }
  windowOffsetX(): Float{
    const diff = this.content_width - this.window_width;
    return diff*this.value;
  }
  barOffsetX(): Float{
    const diff = this.width-this.bar_width;
    return diff*this.value;
  }

  isInsideBar(point: WebGL.Matrix.Point2D){
    const offset_x = this.barOffsetX();
    const in_x = this.x + offset_x < point.x && point.x < this.x + offset_x + this.bar_width;
    const in_y = this.y < point.y && point.y < this.y + this.height;
    return in_x && in_y;
  }

  setScroll(x: Int32){
    const left_bar = x - (this.bar_width*0.5);
    const rx = left_bar - this.x;
    const new_scroll = rx / (this.width-this.bar_width);
    if(new_scroll < 0){
      this.value = 0;
    }else if(new_scroll > 1){
      this.value = 1;
    }else{
      this.value = new_scroll;
    }
  }

  onMouseDown(point: WebGL.Matrix.Point2D){
    if(this.isInside(point)){
      this.scroll_drag = true;
      this.scroll_bar_hover = true;
      this.setScroll(point.x);
    }
  }
  onMouseUp(){
    this.scroll_drag = false;
  }
  onMouseMove(point: WebGL.Matrix.Point2D){
    this.scroll_bar_hover = this.isInsideBar(point);
    if(this.scroll_drag){
      this.setScroll(point.x);
    }
  }

  //todo and test
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram){
    this.drawBackground(vp, colour_shader, WebGL.Colour.ColourUtils.black());

    //draw bar
    const bc = this.scroll_bar_hover ? (this.scroll_drag ? this.grabbed_bar_colour : this.hover_bar_colour) : this.bar_colour;
    WebGL.WebGL.drawColourRect(vp, colour_shader, 
      this.x+this.barOffsetX(), this.y, 
      this.bar_width, this.height,
      bc
    );
  }

}

