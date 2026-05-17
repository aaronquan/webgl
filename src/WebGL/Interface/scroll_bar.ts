import * as WebGL from "./../globals";
import { InterfaceElement } from "./interface_element";
import * as Theme from "./theme";

type Int32 = number;
type Float = number;

class ScrollBar extends InterfaceElement{
  value: Float;

  bar_colour: WebGL.Colour.ColourRGB;
  hover_bar_colour: WebGL.Colour.ColourRGB;
  grabbed_bar_colour: WebGL.Colour.ColourRGB;
  background_colour: WebGL.Colour.ColourRGB;

  dragging: boolean;
  bar_hovering: boolean;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    super(x, y, width, height);

    this.value = 0;

    this.bar_colour = WebGL.Colour.ColourUtils.grey(0.3);
    this.hover_bar_colour = WebGL.Colour.ColourUtils.grey(0.5);
    this.grabbed_bar_colour = WebGL.Colour.ColourUtils.grey(0.7);
    this.background_colour = WebGL.Colour.ColourUtils.black();

    this.dragging = false;
    this.bar_hovering = false;
  }
  setTheme(theme: Theme.InterfaceTheme){
    this.bar_colour = theme.secondary;
    this.hover_bar_colour = theme.primary;
    this.grabbed_bar_colour = theme.tertiary;
    this.background_colour = theme.secondary_background;
  }

  //to override
  isInsideBar(point: WebGL.Matrix.Point2D){}
}

export class HorizontalScrollBar extends ScrollBar{
  bar_width: Float;
  window_width: Int32;
  content_width: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, window_width: Int32, content_width: Int32){
    super(x, y, width, height);


    this.window_width = window_width;
    this.content_width = content_width;
    this.bar_width = width * (this.window_width/this.content_width);
    
  }
  validScroll(): boolean{
    return this.content_width > this.window_width;
  }
  windowOffsetX(): Float{
    const diff = this.content_width - this.window_width;
    return -diff*this.value;
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
      this.dragging = true;
      this.bar_hovering = true;
      this.setScroll(point.x);
    }
  }
  onMouseUp(){
    this.dragging = false;
  }
  onMouseMove(point: WebGL.Matrix.Point2D){
    this.bar_hovering = this.isInsideBar(point);
    if(this.dragging){
      this.setScroll(point.x);
    }
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram){
    this.drawBackground(vp, colour_shader, this.background_colour);

    //draw bar
    const bc = this.dragging ? this.grabbed_bar_colour : (this.bar_hovering ? this.hover_bar_colour : this.bar_colour);
    WebGL.WebGL.drawColourRect(vp, colour_shader, 
      this.x+this.barOffsetX(), this.y, 
      this.bar_width, this.height,
      bc
    );
  }

}


export class VerticalScrollBar extends ScrollBar{
  bar_height: Int32;
  content_height: Int32;
  window_height: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, window_height: Int32, content_height: Int32){
    super(x, y, width, height);
    this.content_height = content_height;
    this.window_height = window_height;
    this.bar_height = height * (this.window_height/this.content_height);
  }
  validScroll(): boolean{
    return this.content_height > this.window_height;
  }
  windowOffsetY(): Float{
    const diff = this.content_height - this.window_height;
    return -diff*this.value;
  }
  barOffsetY(): Float{
    const diff = this.height-this.bar_height;
    return diff*this.value;
  }
  isInsideBar(point: WebGL.Matrix.Point2D){
    const offset_y = this.barOffsetY();
    const in_x = this.x < point.x && point.x < this.x + this.width;
    const in_y = this.y + offset_y < point.y && point.y < this.y + offset_y + this.bar_height;
    return in_x && in_y;
  }
  setScroll(y: Int32){
    const top_bar = y - (this.bar_height*0.5);
    const ry = top_bar - this.y;
    const new_scroll = ry / (this.height-this.bar_height);
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
      this.dragging = true;
      this.bar_hovering = true;
      this.setScroll(point.y);
    }
  }
  onMouseUp(){
    this.dragging = false;
  }
  onMouseMove(point: WebGL.Matrix.Point2D){
    this.bar_hovering = this.isInsideBar(point);
    if(this.dragging){
      this.setScroll(point.y);
    }
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram){
    this.drawBackground(vp, colour_shader, this.background_colour);

    //draw bar
    const bc = this.dragging ? this.grabbed_bar_colour : (this.bar_hovering ? this.hover_bar_colour : this.bar_colour);
    WebGL.WebGL.drawColourRect(vp, colour_shader, 
      this.x, this.y+this.barOffsetY(), 
      this.width, this.bar_height,
      bc
    );
  }
}
