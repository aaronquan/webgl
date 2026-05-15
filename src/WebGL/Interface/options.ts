
import * as WebGL from "./../globals";
import * as ArrayUtils from "./../Util/array";
import * as InterfaceElement from "./interface_element";

type Int32 = number;



export class SingleSelectOptions{
  selected: Int32;
  options: string[];
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;
  text_size: Int32;
  padding: Int32;

  background_colour: WebGL.Colour.ColourRGB;
  text_colour: WebGL.Colour.ColourRGB;
  selected_colour: WebGL.Colour.ColourRGB;

  hover_colour: WebGL.Colour.ColourRGB;

  mouse_over_option: Int32 | undefined;

  onSelected: (id: Int32, opt: string) => void;

  private dividers: Int32[];
  constructor(options: string[], x: Int32, y: Int32, height: Int32){
    this.selected = 0;
    this.x = x;
    this.y = y;
    //this.width = 40;
    this.height = height;
    this.text_size = 10;
    this.padding = 3;

    this.options = options;

    const n_chars = this.options.reduce((pv, cv) => {
      return pv + cv.length;
    }, 0);

    this.width = (this.text_size*n_chars)+(this.padding*(this.options.length+1));
    this.dividers = this.generateDividers(this.options, this.text_size);

    this.background_colour = WebGL.Colour.ColourUtils.white();
    this.text_colour = WebGL.Colour.ColourUtils.black();
    this.selected_colour = WebGL.Colour.ColourUtils.pink();
    this.hover_colour = WebGL.Colour.ColourUtils.grey();

    this.mouse_over_option = undefined;

    this.onSelected = () => {};
  }
  generateDividers(opts: string[], ts: Int32): Int32[]{
    const divs: Int32[] = [];
    let curr = 0;
    for(const s of opts){
      divs.push(curr);
      curr += s.length*ts + this.padding;
    }
    return divs;
  }

  isInside(point: WebGL.Matrix.Point2D): boolean{
    return this.x < point.x && point.x < this.x + this.width && this.y < point.y && point.y < this.y+this.height;
  }

  onMouseDown(){
    if(this.mouse_over_option != undefined){
      this.selected = this.mouse_over_option;
      this.onSelected(this.selected, this.options[this.selected]);
    }
  }
  onMouseUp(){

  }

  onMouseMove(point: WebGL.Matrix.Point2D){
    if(this.isInside(point)){
      const x = point.x - this.x;
      // calculates dividors with padding on left (i.e. furtherest dividing line left)
      this.mouse_over_option = ArrayUtils.binarySearchLowerBound(this.dividers, (t) => x-t);
    }else{
      this.mouse_over_option = undefined;
    }
  }

  draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer){
    if(this.options.length == 0) return;
    const n_chars = this.options.reduce((pv, cv) => {
      return pv + cv.length;
    }, 0);
    const padding = this.padding;
    const width = (this.width);

    //background
    colour_shader.use();
    colour_shader.setColourFromColourRGB(this.background_colour);
    const background_model = WebGL.WebGL.rectangleModel(this.x, this.y, width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(background_model));
    WebGL.Shapes.Quad.draw();

    //mouse over
    if(this.mouse_over_option != undefined){
      colour_shader.setColourFromColourRGB(this.hover_colour);
      const opt_width = text_drawer.getTextWidth(this.options[this.mouse_over_option], this.text_size)+padding;
      const mouse_over_model = WebGL.WebGL.rectangleModel(this.x+this.dividers[this.mouse_over_option], this.y, opt_width, this.height);
      colour_shader.setMvp(vp.multiplyCopy(mouse_over_model));
      WebGL.Shapes.Quad.draw();
    }

    //selected
    colour_shader.setColourFromColourRGB(this.selected_colour);
    const opt_width = text_drawer.getTextWidth(this.options[this.selected], this.text_size)+padding;
    const selected_model = WebGL.WebGL.rectangleModel(this.x+this.dividers[this.selected], this.y, opt_width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(selected_model));
    WebGL.Shapes.Quad.draw();

    let offset = this.x+this.padding;
    const text_y = this.y+(this.height-this.text_size)*0.5;
    const border_thickness = 3;
    for(const str of this.options){
      //draw text
      const text_width = text_drawer.getTextWidth(str, this.text_size);
      text_drawer.drawTextColour(vp, offset, text_y, str, this.text_size, this.text_colour);

      //draw divider lines

      const line_model = WebGL.WebGL.rectangleModel(offset-this.padding, this.y, border_thickness, this.height);
      colour_shader.use();
      colour_shader.setColourFromColourRGB(this.text_colour);
      colour_shader.setMvp(vp.multiplyCopy(line_model));
      WebGL.Shapes.Quad.draw();
      
      offset += this.padding+text_width;
    }
    //last line
    const line_model = WebGL.WebGL.rectangleModel(offset-this.padding, this.y, border_thickness, this.height);
    colour_shader.use();
    colour_shader.setColourFromColourRGB(this.text_colour);
    colour_shader.setMvp(vp.multiplyCopy(line_model));
    WebGL.Shapes.Quad.draw();

    //top and bottom
    const top_model = WebGL.WebGL.rectangleModel(this.x, this.y, this.width, border_thickness);
    colour_shader.setMvp(vp.multiplyCopy(top_model));
    WebGL.Shapes.Quad.draw();

    const bot_model = WebGL.WebGL.rectangleModel(this.x, this.y+this.height, this.width, border_thickness);
    colour_shader.setMvp(vp.multiplyCopy(bot_model));
    WebGL.Shapes.Quad.draw();
  }
}

const DropdownStateEnum = {
  Closed: 0,
  ClosedHover: 1,
  Open: 2,
  OpenHover: 3
} as const;

type DropdownState = (typeof DropdownStateEnum)[keyof typeof DropdownStateEnum];

export class DropdownOptions extends InterfaceElement.InterfaceElement{
  static no_option_text = "-No Options-";
  options: string[];
  selected: Int32;
  position_hovered: Int32; // the index of mouse over the interface from top, e.g. 0 is always selected
  state: DropdownState;

  background_colour: WebGL.Colour.ColourRGB;
  hovered_background_colour: WebGL.Colour.ColourRGB;
  text_colour: WebGL.Colour.ColourRGB;
  border_colour: WebGL.Colour.ColourRGB;
  text_size: Int32;

  border_width: Int32;

  onSelect: (id: Int32) => void;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32, options: string[]=[]){
    super(x, y, width, height);
    this.selected = 0;
    this.position_hovered = -1;
    this.options = options;
    this.state = DropdownStateEnum.Closed;
    this.background_colour = WebGL.Colour.ColourUtils.white();
    this.hovered_background_colour = WebGL.Colour.ColourUtils.grey();
    this.text_colour = WebGL.Colour.ColourUtils.black();
    this.border_colour = WebGL.Colour.ColourUtils.blue();
    this.text_size = this.height-4;

    this.border_width = 2;
    this.onSelect = () => {};
  }
  hasOptions(): boolean{
    return this.options.length > 0;
  }
  openHeight(): Int32{
    return this.height*this.options.length;
  }
  isInside(point: WebGL.Matrix.Point2D){
    if(this.isOpen()){
      return this.isInsideOpened(point);
    }
    return super.isInside(point);
  }
  isInsideOpened(point: WebGL.Matrix.Point2D): boolean{
    const in_x = this.x < point.x && point.x < this.x+this.width;
    const in_y = this.y < point.y && point.y < this.y+this.openHeight();
    return in_x && in_y;
  }
  getPositionIndexFromY(y: Int32): Int32{
    return Math.floor((y-this.y) / this.height);
  }
  // 0 is selected, otherwise a position in order from selected
  getOptionIndexFromY(y: Int32): Int32{
    return this.optionIndexFromSelectedIndex(this.getPositionIndexFromY(y));
  }
  optionIndexFromSelectedIndex(position: Int32): Int32{
    return position == 0 ? this.selected : (position <= this.selected ? position-1 : position);
  }
  onMouseDown(point: WebGL.Matrix.Point2D){
    if(this.isOpen()){
      if(this.isHovered()){
        this.selected = this.getOptionIndexFromY(point.y);
        this.onSelect(this.selected);
        this.state = DropdownStateEnum.ClosedHover;
      }else{
        this.state = DropdownStateEnum.Closed;
      }
      this.setStateFromMousePoint(point);
    }else{
      if(this.isHovered()){
        this.state = DropdownStateEnum.OpenHover;
      }
    }
  }
  isHovered(){
    return this.state == DropdownStateEnum.OpenHover || this.state == DropdownStateEnum.ClosedHover;
  }
  isOpen(){
    return this.state == DropdownStateEnum.Open || this.state == DropdownStateEnum.OpenHover;
  }
  isClosed(){
    return this.state == DropdownStateEnum.Closed || this.state == DropdownStateEnum.ClosedHover;
  }
  private setStateFromMousePoint(point: WebGL.Matrix.Point2D){
    if(this.isInside(point)){
      if(this.isOpen()){
        this.state = DropdownStateEnum.OpenHover;
      }else if(this.isClosed()){
        this.state = DropdownStateEnum.ClosedHover;
      }
    }else{
      if(this.isOpen()){
        this.state = DropdownStateEnum.Open;
      }else if(this.isClosed()){
        this.state = DropdownStateEnum.Closed;
      }
    }
    if(this.isInside(point)){
      this.position_hovered = this.getPositionIndexFromY(point.y);
    }else{
      this.position_hovered = -1;
    }
  }
  onMouseOver(point: WebGL.Matrix.Point2D){
    this.setStateFromMousePoint(point);

  }
  draw(vp: WebGL.Matrix.TransformationMatrix3x3, 
    colour_shader: WebGL.Shader.MVPColourProgram,
    text_drawer: WebGL.TextDrawer
  ){


    //const bg_colour = this.isHovered() ? this.hovered_background_colour : this.background_colour;

    //drawing background and border
    if(!this.isOpen()){
      this.drawBackground(vp, colour_shader, this.background_colour); //bg
      //border
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.width, this.border_width, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y+this.height-this.border_width, this.width, this.border_width, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.border_width, this.height, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x+this.width-this.border_width, this.y, this.border_width, this.height, this.border_colour);
    }else{
      const open_height = this.openHeight();
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.width, open_height, this.background_colour); //bg
      //border
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.width, this.border_width, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y+open_height-this.border_width, this.width, this.border_width, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, this.y, this.border_width, open_height, this.border_colour);
      WebGL.WebGL.drawColourRect(vp, colour_shader, this.x+this.width-this.border_width, this.y, this.border_width, open_height, this.border_colour);
    }

    //draw hovered background
    if(this.position_hovered != -1){
      WebGL.WebGL.drawColourRect(vp, colour_shader, 
        this.x, this.y+(this.position_hovered*this.height), 
        this.width, this.height, this.hovered_background_colour
      );
    }

    //draw selected text;
    const text = this.hasOptions() ? this.options[this.selected] : DropdownOptions.no_option_text;
    text_drawer.drawTextColour(vp, this.x+this.border_width, this.y+this.border_width, text, this.text_size, this.text_colour);

    if(this.isOpen()){
      //draw other options
      let y = this.y+this.height+this.border_width;
      for(let i = 0; i < this.options.length; i++){

        if(i == this.selected) continue;
        const opt = this.options[i];

        //dividing line (todo - set colour)
        WebGL.WebGL.drawColourRect(vp, colour_shader, this.x, y-(this.border_width*1.5), this.width, this.border_width, this.border_colour);

        //select text
        text_drawer.drawTextColour(vp, this.x+this.border_width, y, opt, this.text_size, this.text_colour);
        y += this.height;
      }
    }

  }
}