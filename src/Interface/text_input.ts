import { colour } from "../WebGL/Shaders/Fragment/Source/fragment_source";
import * as WebGL from "./../WebGL/globals";

type Int32 = number;
type Float = number;
type VoidFunction = () => void;
const EmptyFunction = () => {};

export class TextGlobals{
  static selected_text = undefined;
  static cursor_on: boolean = false;
  static cursor_milliseconds_interval: Float = 500;
  static current_cursor_milliseconds: Float = 0;

  static update(time_elapsed: Float){
    this.current_cursor_milliseconds += time_elapsed;
    if(this.current_cursor_milliseconds > this.cursor_milliseconds_interval){
      this.current_cursor_milliseconds -= this.cursor_milliseconds_interval;
      this.cursor_on = !this.cursor_on;
    }
  }
}

const TextStatusEnum = {
  Deselected: 0,
  Selected: 1,
  Highlighting: 2,
} as const;

type TextStatus = (typeof TextStatusEnum)[keyof typeof TextStatusEnum];

export class TextInput{
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;

  background_colour: WebGL.Colour.ColourRGB;
  text_colour: WebGL.Colour.ColourRGB;
  cursor_colour: WebGL.Colour.ColourRGB;
  highlight_colour: WebGL.Colour.ColourRGB;

  select_border_colour: WebGL.Colour.ColourRGB;

  text: string;

  text_offset: Int32;

  text_size: Int32;

  state: TextStatus;

  cursor_thickness: Int32;
  cursor_index: Int32;

  onChange: (text: string) => void;

  highlight_pivot: Int32;
  highlight_start: Int32;
  highlight_end: Int32;
  highlighting: boolean;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32, ts: Int32=height-4){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.text_offset = 3;

    this.text_size = ts;

    this.background_colour = WebGL.Colour.ColourUtils.white();
    this.text_colour = WebGL.Colour.ColourUtils.black();
    this.cursor_colour = WebGL.Colour.ColourUtils.blue();
    this.highlight_colour = WebGL.Colour.ColourUtils.cyan();
    this.select_border_colour = WebGL.Colour.ColourUtils.fromRGB(0.3, 0.5, 0.9);
    
    this.text = "";

    this.state = TextStatusEnum.Deselected;

    this.cursor_thickness = 1;
    this.cursor_index = 0;
    this.onChange = (_) => {};
    
    this.highlight_pivot = -1;
    this.highlight_start = 0;
    this.highlight_end = 0;
    this.highlighting = false;
  }
  maxTextSize(): Int32{
    return Math.floor((this.width-(this.text_offset*2)) / this.text_size);
  }
  isInside(point: WebGL.Matrix.Point2D): boolean{
    const in_x = this.x < point.x && point.x < this.x+this.width;
    const in_y = this.y < point.y && point.y < this.y+this.height;
    return in_x && in_y;
  }
  onKeyDown(ev: KeyboardEvent){
    if(this.state == TextStatusEnum.Selected){
      if(ev.key.length == 1){
        if(ev.key == 'c' && ev.ctrlKey){
          //copy
          navigator.clipboard.writeText(this.getHighlighted()).then(() => {});
        }else{
          this.deleteHighlighted();
          if(ev.key == 'v' && ev.ctrlKey){
            //paste
            navigator.clipboard.readText().then((text) => {
              this.text = this.text.slice(0, this.cursor_index) + text + this.text.slice(this.cursor_index);
              this.text = this.text.slice(0, this.maxTextSize());
            });
          }else if(this.text.length < this.maxTextSize()){
            this.text = this.text.slice(0, this.cursor_index) + ev.key + this.text.slice(this.cursor_index);
            this.cursor_index++;
            this.onChange(this.text);
          }
        }
      }else if(ev.key === "Backspace"){
        if(!this.deleteHighlighted()){
          if(this.cursor_index > 0){
            this.text = this.text.slice(0, this.cursor_index-1) + this.text.slice(this.cursor_index);
            this.cursor_index--;
            this.onChange(this.text);
          }
        }
      }else if(ev.key === "ArrowRight"){
        if(ev.shiftKey && this.cursor_index < this.text.length){
          if(!this.hasHighlight()){
            this.highlight_start = this.cursor_index;
            this.highlight_end = this.cursor_index+1;
          }else if(this.cursor_index == this.highlight_end){
            this.highlight_end++;
          }else if(this.cursor_index == this.highlight_start){
            this.highlight_start++;
          }
          this.cursor_index++;
        }else{
          if(this.hasHighlight()){
            this.cursor_index = this.highlight_end;
            this.highlight_start = this.highlight_end;
          }else{
            if(this.cursor_index < this.text.length){
              this.cursor_index++;
            }
          }
        }
      }else if(ev.key === "ArrowLeft"){
        if(ev.shiftKey && this.cursor_index > 0){
          if(!this.hasHighlight()){
            this.highlight_start = this.cursor_index-1;
            this.highlight_end = this.cursor_index;
          }else if(this.cursor_index == this.highlight_start){
            this.highlight_start--;
          }else if(this.cursor_index == this.highlight_end){
            this.highlight_end--;
          }
          this.cursor_index--;
        }else{
          if(this.hasHighlight()){
          this.cursor_index = this.highlight_start;
          this.highlight_start = this.highlight_end;
          }else{
            if(this.cursor_index > 0){
              this.cursor_index--;
            }
          }
        }
      }
    }
  }
  getHighlighted(): string{
    if(this.hasHighlight()){
      return this.text.slice(this.highlight_start, this.highlight_end);
    }
    return "";
  }
  deleteHighlighted(): boolean{
    if(this.hasHighlight()){
      this.text = this.text.slice(0, this.highlight_start) + this.text.slice(this.highlight_end);
      if(this.cursor_index == this.highlight_end){
        this.cursor_index = this.highlight_start;
      }
      this.highlight_start = this.highlight_end;
      return true;
    }
    return false;
  }
  hasHighlight(){
    return this.highlight_start != this.highlight_end;
  }
  cursorIndexFromX(x: Float): Int32{
    const fl = (x-(this.x+this.text_offset))/this.text_size;
    const i = Math.round(fl);
    if(i < 0) return 0;
    return i > this.text.length ? this.text.length : i;
  }
  onMouseMove(point: WebGL.Matrix.Point2D){
    if(this.highlighting){
      const index = this.cursorIndexFromX(point.x);
      this.highlight_start = Math.min(index, this.highlight_pivot);
      this.highlight_end = Math.max(index, this.highlight_pivot);
      this.cursor_index = index;
    }
  }
  onMouseDown(point: WebGL.Matrix.Point2D){
    if(this.isInside(point)){
      this.state = TextStatusEnum.Selected;
      const index = this.cursorIndexFromX(point.x);
      this.cursor_index = index;
      this.highlight_start = this.highlight_end;
      this.highlight_pivot = this.cursor_index;
      this.highlighting = true;
    }else{
      this.state = TextStatusEnum.Deselected;
    }
  }
  onMouseUp(){
    this.highlighting = false;
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, 
    colour_shader: WebGL.Shader.MVPColourProgram, 
    text_drawer: WebGL.TextDrawer){
      //draw background
      colour_shader.use();
      colour_shader.setColourFromColourRGB(this.background_colour);
      const background_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.width, this.height);
      colour_shader.setMvp(vp.multiplyCopy(background_model));
      WebGL.Shapes.Quad.draw();

      const text_height_diff = this.height - this.text_size;
      const y = this.y + (text_height_diff*0.5);

      if(this.highlight_start != this.highlight_end){
        WebGL.WebGL.drawColourRect(vp, colour_shader, this.x+this.text_offset+(this.highlight_start*this.text_size), 
        y, (this.highlight_end-this.highlight_start)*this.text_size,
        this.text_size, this.highlight_colour);
      }

      //text cursor
      if(TextGlobals.cursor_on && this.state == TextStatusEnum.Selected){
        colour_shader.setColourFromColourRGB(this.cursor_colour);
        const cursor_model = WebGL.WebGL.rectangleModel(
          this.x+this.text_offset-this.cursor_thickness+(this.text_size*this.cursor_index),
          y, this.cursor_thickness, this.text_size
        );
        colour_shader.setMvp(vp.multiplyCopy(cursor_model));
        WebGL.Shapes.Quad.draw();
      }
      

      //draw text
      text_drawer.drawTextColour(vp, this.x+this.text_offset, y, this.text, this.text_size, this.text_colour);
  
      //draw border
      if(this.state == TextStatusEnum.Selected){
        const border_size = 2;
        colour_shader.use();
        colour_shader.setColourFromColourRGB(this.select_border_colour);
        const left_model = WebGL.WebGL.rectangleModel(this.x, this.y, border_size, this.height);
        colour_shader.setMvp(vp.multiplyCopy(left_model));
        WebGL.Shapes.Quad.draw();

        const right_model = WebGL.WebGL.rectangleModel(this.x+this.width-border_size, this.y, border_size, this.height);
        colour_shader.setMvp(vp.multiplyCopy(right_model));
        WebGL.Shapes.Quad.draw();

        const top_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.width, border_size);
        colour_shader.setMvp(vp.multiplyCopy(top_model));
        WebGL.Shapes.Quad.draw();

        const bot_model = WebGL.WebGL.rectangleModel(this.x, this.y+this.height-border_size, this.width, border_size);
        colour_shader.setMvp(vp.multiplyCopy(bot_model));
        WebGL.Shapes.Quad.draw();
      }
    }
}