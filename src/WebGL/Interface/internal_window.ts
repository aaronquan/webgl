import * as WebGL from "./../globals";
import {InterfaceElement} from "./interface_element";
import * as Scroll from "./scroll_bar";

type Int32 = number;
type Float = number;
type VoidFunction = () => void;
const EmptyFunction = () => {};

export class InternalWindow extends InterfaceElement{
  header_height: Int32;
  hover_header: boolean;
  dragged_header: boolean;
  header_offset_x: Int32;
  header_offset_y: Int32;

  can_close: boolean;
  visible: boolean;
  
  onClose: VoidFunction;

  //title: string;

  
  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    super(x, y, width, height);
    this.header_height = 15;
    this.hover_header = false;
    this.dragged_header = false;
    this.header_offset_x = 0;
    this.header_offset_y = 0;
    this.can_close = true;
    this.visible = true;
    this.onClose = EmptyFunction;
  }
  getInternalY(): Int32{ // where the internal window starts
    return this.y+this.header_height;
  }
  getFullHeight(): Int32{
    return this.height+this.header_height;
  }
  getFullWidth(): Int32{
    return this.width;
  }
  isInsideHeader(pos: WebGL.Matrix.Point2D): boolean{
    const inside_x = this.x < pos.x && pos.x < this.x + this.width;
    const inside_y = this.y < pos.y && pos.y < this.y + this.header_height;
    return inside_x && inside_y;
  }
  isInsideClose(pos: WebGL.Matrix.Point2D): boolean{
    const inside_x = this.x+this.width-this.header_height < pos.x && pos.x < this.x+this.width;
    const inside_y = this.y < pos.y && pos.y < this.y + this.header_height;
    return inside_x && inside_y;
  }
  getWindowPosition(): WebGL.Matrix.Point2D{
    return new WebGL.Matrix.Point2D(this.x, this.y+this.header_height);
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    if(!this.visible) return;
    this.hover_header = this.isInsideHeader(global_position);
    if(this.dragged_header){
      this.x = global_position.x + this.header_offset_x;
      this.y = global_position.y + this.header_offset_y;
    }
  }
  onMouseDown(global_position: WebGL.Matrix.Point2D){
    if(this.isInsideClose(global_position)){
      this.visible = false;
      this.onClose();
    }
    if(this.hover_header){
      this.dragged_header = true;
      this.header_offset_x = this.x - global_position.x;
      this.header_offset_y = this.y - global_position.y;
    }
  }
  onMouseUp(){
    this.dragged_header = false;
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, solid_shader: WebGL.Shader.MVPColourProgram){
    if(this.visible){
      //draw header
      solid_shader.use();
      const header_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.width, this.header_height);
      solid_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.grey());
      solid_shader.setMvp(vp.multiplyCopy(header_model));
      WebGL.Shapes.Quad.draw();

      //window background
      const back_model = WebGL.WebGL.rectangleModel(this.x, this.y+this.header_height, this.width, this.height);
      solid_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.white());
      solid_shader.setMvp(vp.multiplyCopy(back_model));
      WebGL.Shapes.Quad.draw();

      //close header
      if(this.can_close){
        const close_model = WebGL.WebGL.rectangleModel(this.x+this.width-this.header_height, this.y, this.header_height, this.header_height);
        solid_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.grey(0.75));
        solid_shader.setMvp(vp.multiplyCopy(close_model));
        WebGL.Shapes.Quad.draw();
      }
    }
  } 
}

export class HorizontalScrollInternalWindow extends InternalWindow{
  scroll_bar: Scroll.HorizontalScrollBar;
  content_width: Int32;
  content_height: Int32

  constructor(x: Int32, y: Int32, width: Int32, height: Int32, 
    content_width: Int32, content_height: Int32, 
    scroll_height: Int32){
    super(x, y, width, height);
    this.scroll_bar = new Scroll.HorizontalScrollBar(this.x, this.y+height, this.width, scroll_height, this.width, content_width);
    this.content_width = content_width;
    this.content_height = content_height;
  }
  getFullHeight(): Int32{
    return this.height + this.header_height + this.scroll_bar.height;
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    super.onMouseMove(global_position);
    this.scroll_bar.x = this.x;
    this.scroll_bar.y = this.y + this.height + this.scroll_bar.height;
    this.scroll_bar.onMouseMove(global_position);
  }
  onMouseDown(global_position: WebGL.Matrix.Point2D){
    super.onMouseDown(global_position);
    this.scroll_bar.onMouseDown(global_position);
  }
  onMouseUp(){
    super.onMouseUp();
    this.scroll_bar.onMouseUp();
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, solid_shader: WebGL.Shader.MVPColourProgram){
    super.draw(vp, solid_shader);
    if(this.visible){
      if(this.content_width > this.width){
        this.scroll_bar.draw(vp, solid_shader);
      }
    }
  }
}

export class FullScrollInternalWindow extends InternalWindow{
  horizontal_scroll_bar: Scroll.HorizontalScrollBar;
  vertical_scroll_bar: Scroll.VerticalScrollBar;
  content_width: Int32;
  content_height: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, 
    content_width: Int32, content_height: Int32, scroll_width: Int32){
    super(x, y, width, height);
    this.horizontal_scroll_bar = new Scroll.HorizontalScrollBar(this.x, this.y+height, this.width, scroll_width, this.width, content_width);
    this.vertical_scroll_bar = new Scroll.VerticalScrollBar(this.x+width, this.y, scroll_width, this.height, this.height, content_height);
    this.content_width = content_width;
    this.content_height = content_height;
  }
  getFullWidth(): Int32{
    return this.width + this.horizontal_scroll_bar.bar_width;
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    super.onMouseMove(global_position);
    this.horizontal_scroll_bar.x = this.x;
    this.horizontal_scroll_bar.y = this.y + this.height + this.horizontal_scroll_bar.height;
    this.horizontal_scroll_bar.onMouseMove(global_position);
  }
  onMouseDown(global_position: WebGL.Matrix.Point2D){
    super.onMouseDown(global_position);
    this.horizontal_scroll_bar.onMouseDown(global_position);
  }
  onMouseUp(){
    super.onMouseUp();
    this.horizontal_scroll_bar.onMouseUp();
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, solid_shader: WebGL.Shader.MVPColourProgram){
    super.draw(vp, solid_shader);
    if(this.visible){
      if(this.content_width > this.width){
        this.horizontal_scroll_bar.draw(vp, solid_shader);
      }
      if(this.content_height > this.height){
        this.vertical_scroll_bar.draw(vp, solid_shader);
      }
    }
  }
}

export class InternalContentWindow extends InternalWindow{
  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    super(x, y, width, height);
  } 
}

export class InternalContent extends InterfaceElement{
  window: InternalWindow;
  constructor(win: InternalWindow, width: Int32, height: Int32){
    super(win.x, win.y, width, height);
    this.window = win;
  }
}