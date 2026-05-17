import * as WebGL from "./../globals";
import {InterfaceElement} from "./interface_element";
import * as Scroll from "./scroll_bar";
import * as Theme from "./theme";

type Int32 = number;
type Float = number;
type VoidFunction = () => void;
const EmptyFunction = () => {};

const HorizontalSideHoverStateEnum = {
  None: 0,
  Left: 1,
  Right: 2
} as const;

type HorizontalSideHoverState = (typeof HorizontalSideHoverStateEnum)[keyof typeof HorizontalSideHoverStateEnum];

const VerticalSideHoverStateEnum = {
  None: 0,
  Up: 1,
  Down: 2
} as const;

type VerticalSideHoverState = (typeof VerticalSideHoverStateEnum)[keyof typeof VerticalSideHoverStateEnum];

export class InternalWindow extends InterfaceElement{
  static minimum_size: Int32 = 20;

  header_height: Int32;
  hover_header: boolean;
  dragged_header: boolean;
  header_offset_x: Int32;
  header_offset_y: Int32;

  can_close: boolean;
  hover_close: boolean;
  visible: boolean;
  
  onClose: VoidFunction;
  onOpen: VoidFunction;

  background_colour: WebGL.Colour.ColourRGB;
  header_colour: WebGL.Colour.ColourRGB;
  close_colour: WebGL.Colour.ColourRGB;
  hover_close_colour: WebGL.Colour.ColourRGB;

  //title: string;
  can_resize: boolean;
  resizing: boolean;
  horizontal_hover_state: HorizontalSideHoverState;
  vertical_hover_state: VerticalSideHoverState;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32){
    super(x, y, width, height);
    this.header_height = 15;
    this.hover_header = false;
    this.dragged_header = false;
    this.header_offset_x = 0;
    this.header_offset_y = 0;
    this.can_close = true;
    this.hover_close = false;
    this.visible = true;
    this.onClose = EmptyFunction;
    this.onOpen = EmptyFunction;

    this.background_colour = WebGL.Colour.ColourUtils.white();
    this.header_colour = WebGL.Colour.ColourUtils.grey();
    this.close_colour = WebGL.Colour.ColourUtils.black();
    this.hover_close_colour = WebGL.Colour.ColourUtils.red();

    this.can_resize = false;
    this.resizing = true;
    this.horizontal_hover_state = HorizontalSideHoverStateEnum.None;
    this.vertical_hover_state = VerticalSideHoverStateEnum.None;
  }
  open(){
    this.visible = true;
    this.onOpen();
  }
  setTheme(theme: Theme.InterfaceTheme){
    this.header_colour = theme.primary;
    this.background_colour = theme.background;
    this.close_colour = theme.close;
    this.hover_close_colour = theme.close_hover;
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
    const inside_x = this.x < pos.x && pos.x < this.x + this.getFullWidth();
    const inside_y = this.y < pos.y && pos.y < this.y + this.header_height;
    return inside_x && inside_y;
  }
  isInsideClose(pos: WebGL.Matrix.Point2D): boolean{
    const inside_x = this.x+this.getFullWidth()-this.header_height < pos.x && pos.x < this.x+this.getFullWidth();
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
    this.hover_close = this.isInsideClose(global_position) && this.can_close;

    if(!this.resizing){
      //update resizing states
      const hover_size = 2;
      const in_x = this.x - hover_size < global_position.x && global_position.x < this.x + this.getFullWidth() + hover_size;
      const in_top = this.y - hover_size < global_position.y && global_position.y < this.y + hover_size;
      const in_bot = this.y + this.getFullHeight() - hover_size < global_position.y && global_position.y < this.y + this.getFullHeight() + hover_size;
      if(in_x){
        if(in_top){
          this.vertical_hover_state = VerticalSideHoverStateEnum.Up;
        }else if(in_bot){
          this.vertical_hover_state = VerticalSideHoverStateEnum.Down
        }else{
          this.vertical_hover_state = VerticalSideHoverStateEnum.None;
        }
      }else{
        this.vertical_hover_state = HorizontalSideHoverStateEnum.None;
      }
    }else{
      //run resize (can't be lover than minimum)
      if(this.horizontal_hover_state == HorizontalSideHoverStateEnum.Left){

      }
    }
  }
  onMouseDown(global_position: WebGL.Matrix.Point2D){
    if(this.hover_close){
      this.visible = false;
      this.onClose();
    }
    if(this.hover_header){
      this.dragged_header = true;
      this.header_offset_x = this.x - global_position.x;
      this.header_offset_y = this.y - global_position.y;
    }
    this.resizing = this.horizontal_hover_state != HorizontalSideHoverStateEnum.None || this.vertical_hover_state != VerticalSideHoverStateEnum.None;
  }
  onMouseUp(){
    this.dragged_header = false;
    this.resizing = false;
  }
  enableScissors(){
    const wx = this.x;
    const wy = this.getInternalY();
    WebGL.WebGL.enableScissor(wx, wy, this.width, this.height);
  }
  disableScissors(){
    WebGL.WebGL.disableScissor();
  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, solid_shader: WebGL.Shader.MVPColourProgram){
    if(this.visible){
      //draw header
      solid_shader.use();
      const header_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.getFullWidth(), this.header_height);
      solid_shader.setColourFromColourRGB(this.header_colour);
      solid_shader.setMvp(vp.multiplyCopy(header_model));
      WebGL.Shapes.Quad.draw();

      //window background
      const back_model = WebGL.WebGL.rectangleModel(this.x, this.getInternalY(), this.width, this.height);
      solid_shader.setColourFromColourRGB(this.background_colour);
      solid_shader.setMvp(vp.multiplyCopy(back_model));
      WebGL.Shapes.Quad.draw();

      //close header
      if(this.can_close){
        const close_colour = this.hover_close ? this.hover_close_colour : this.close_colour;
        const close_model = WebGL.WebGL.rectangleModel(this.x+this.getFullWidth()-this.header_height, this.y, this.header_height, this.header_height);
        solid_shader.setColourFromColourRGB(close_colour);
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
    this.scroll_bar = new Scroll.HorizontalScrollBar(this.x, this.getInternalY()+height, this.width, scroll_height, this.width, content_width);
    this.content_width = content_width;
    this.content_height = content_height;
  }
  setTheme(theme: Theme.InterfaceTheme){
    super.setTheme(theme);
    this.scroll_bar.setTheme(theme);
  }
  getFullHeight(): Int32{
    return this.height + this.header_height + this.scroll_bar.height;
  }
  contentOffsetX(): Int32{
    return this.x + this.scroll_bar.windowOffsetX();
  }
  contentOffsetY(): Int32{
    return this.getInternalY();
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    super.onMouseMove(global_position);
    this.scroll_bar.x = this.x;
    this.scroll_bar.y = this.getInternalY() + this.height;
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
  scroll_width: Int32;
  content_width: Int32;
  content_height: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, 
    content_width: Int32, content_height: Int32, scroll_width: Int32){
    super(x, y, width, height);
    this.horizontal_scroll_bar = new Scroll.HorizontalScrollBar(this.x, this.getInternalY()+height, width, scroll_width, width, content_width);
    this.vertical_scroll_bar = new Scroll.VerticalScrollBar(this.x+width, this.getInternalY(), scroll_width, height, height, content_height);
    this.content_width = content_width;
    this.content_height = content_height;
    this.scroll_width = scroll_width;
  }
  getFullWidth(): Int32{
    return this.width + this.vertical_scroll_bar.width;
  }
  contentOffsetX(): Int32{
    return this.x + this.horizontal_scroll_bar.windowOffsetX();
  }
  contentOffsetY(): Int32{
    return this.getInternalY() + this.vertical_scroll_bar.windowOffsetY();
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    super.onMouseMove(global_position);
    this.horizontal_scroll_bar.x = this.x;
    this.horizontal_scroll_bar.y = this.getInternalY() + this.height;
    this.horizontal_scroll_bar.onMouseMove(global_position);

    this.vertical_scroll_bar.x = this.x+this.width;
    this.vertical_scroll_bar.y = this.getInternalY();
    this.vertical_scroll_bar.onMouseMove(global_position);
  }
  onMouseDown(global_position: WebGL.Matrix.Point2D){
    super.onMouseDown(global_position);
    this.horizontal_scroll_bar.onMouseDown(global_position);
    this.vertical_scroll_bar.onMouseDown(global_position);
  }
  onMouseUp(){
    super.onMouseUp();
    this.horizontal_scroll_bar.onMouseUp();
    this.vertical_scroll_bar.onMouseUp();
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

      //draw extra scroll square in bottom right
      WebGL.WebGL.drawColourRect(vp, solid_shader, this.horizontal_scroll_bar.x+this.horizontal_scroll_bar.width, 
        this.vertical_scroll_bar.y+this.vertical_scroll_bar.height, this.scroll_width, this.scroll_width, WebGL.Colour.ColourUtils.red());
    }
  }
}

//to test
export class VerticalStrollInternalWindow extends InternalWindow{
  scroll_bar: Scroll.VerticalScrollBar;
  scroll_width: Int32;
  content_width: Int32;
  content_height: Int32;
  constructor(x: Int32, y: Int32, width: Int32, height: Int32, 
    content_width: Int32, content_height: Int32, scroll_width: Int32){
    super(x, y, width, height);
    this.scroll_bar = new Scroll.VerticalScrollBar(this.scrollBarX(), this.getInternalY(), scroll_width, height, height, content_height);
    this.content_width = content_width  
    this.content_height = content_height;
    this.scroll_width = scroll_width;
  }
  scrollBarX(): Int32{
    return this.x + this.width;
  }
  setTheme(theme: Theme.InterfaceTheme){
    super.setTheme(theme);
    this.scroll_bar.setTheme(theme);
  }
  getFullWidth(): Int32 {
    return this.width + this.scroll_width;
  }
  contentOffsetY(): Int32{
    return this.getInternalY() + this.scroll_bar.windowOffsetY();
  }
  contentOffsetX(): Int32{
    return this.x;
  }
  onMouseMove(global_position: WebGL.Matrix.Point2D){
    super.onMouseMove(global_position);
    this.scroll_bar.x = this.scrollBarX();
    this.scroll_bar.y = this.getInternalY();
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
      if(this.content_height > this.height){
        this.scroll_bar.draw(vp, solid_shader);
      }
    }
  }
}


//unused classes for now
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