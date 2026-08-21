import * as WebGL from "./../../WebGL/globals";

import Button = WebGL.Interface.Button;
import Point2D = WebGL.Geometry.Base.Point2D;
import Window = WebGL.Interface.InternalWindow;
import { WindowCollection } from "../../WebGL/Interface/internal_window";

type Int32 = number;
type Float = number;

const theme: WebGL.Interface.Theme.InterfaceTheme = {
  primary: WebGL.Colour.ColourUtils.fromHex("40EB9E"),
  secondary: WebGL.Colour.ColourUtils.fromHex("4fb286"),
  tertiary: WebGL.Colour.ColourUtils.fromHex("77FFC2"),
  background: WebGL.Colour.ColourUtils.fromHex("3c896d"),
  secondary_background: WebGL.Colour.ColourUtils.fromHex("266C52"),
  close: WebGL.Colour.ColourUtils.fromHex("546d64"),
  close_hover: WebGL.Colour.ColourUtils.fromHex("CC1212"),
}


export class InteractableTriangle{
  point_size: Float;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
  triangle: WebGL.Geometry.Triangle.Triangle;
  hovered: Int32 | undefined;
  dragged: boolean;
  constructor(p1: Point2D, p2: Point2D, p3: Point2D){
    this.point_size = 10;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.triangle = new WebGL.Geometry.Triangle.Triangle(this.p1, this.p2, this.p3);
    this.dragged = false;
  }
  onMouseMove(mouse: Point2D){
    if(this.dragged && this.hovered != undefined){
      //move point
      switch(this.hovered){
        case 1:
          this.p1 = mouse.copy();
          this.triangle.p1 = this.p1;
          break;
        case 2: 
          this.p2 = mouse.copy();
          this.triangle.p2 = this.p2;
          break;
        case 3:
          this.p3 = mouse.copy();
          this.triangle.p3 = this.p3;
          break;
      }
    }
    this.hovered = undefined;
    if(this.p1.distance(mouse) < this.point_size){
      this.hovered = 1;
    }else if(this.p2.distance(mouse) < this.point_size){
      this.hovered = 2;
    }else if(this.p3.distance(mouse) < this.point_size){
      this.hovered = 3;
    }
  }
  onMouseDown(mouse: Point2D){
    if(this.hovered != undefined){
      this.dragged = true;
    }
  }
  onMouseUp(){
    this.dragged = false;
  }
  getDrawPoints(){
    return this.triangle.toDrawPointArray();
  }
  drawPoints(vp: WebGL.Matrix.TransformationMatrix3x3, shader: WebGL.Shader.MVPCircleOnlyProgram){
    shader.use();
    shader.setCentre(0.5, 0.5);
    shader.setRadius(0.5);
    shader.setCircleColourFromColourRGB(WebGL.Colour.ColourUtils.blue());
    WebGL.WebGL.enableBlend();
    const p1_model = WebGL.WebGL.rectangleModel(this.p1.x, this.p1.y, this.point_size, this.point_size);
    shader.setMvp(vp.multiplyCopy(p1_model));
    WebGL.Shapes.CenterQuad.draw();

    const p2_model = WebGL.WebGL.rectangleModel(this.p2.x, this.p2.y, this.point_size, this.point_size);
    shader.setMvp(vp.multiplyCopy(p2_model));
    WebGL.Shapes.CenterQuad.draw();

    const p3_model = WebGL.WebGL.rectangleModel(this.p3.x, this.p3.y, this.point_size, this.point_size);
    shader.setMvp(vp.multiplyCopy(p3_model));
    WebGL.Shapes.CenterQuad.draw();

    WebGL.WebGL.disableBlend();
  }
}

export class ITEngine extends WebGL.App.BaseEngine{
  global_mouse: Point2D;
  button: Button.BasicButton;
  toggle_button: Button.ToggleButton;

  vwindow: ExampleVerticalScrollWindow;
  hwindow: Window.HorizontalScrollInternalWindow;
  windows: Window.WindowCollection;

  triangle: InteractableTriangle;

  constructor(){
    super();
    this.global_mouse = new Point2D(0, 0);
    this.button = new Button.BasicButton(10, 10, 50, 15, 10);
    this.button.text = "But";
    this.button.setTheme(theme);

    this.toggle_button = new Button.ToggleButton(70, 10, 70, 15, 10);
    this.toggle_button.on_text = "I'm On";
    this.toggle_button.off_text = "I'm Off";
    this.toggle_button.setTheme(theme);

    this.vwindow = new ExampleVerticalScrollWindow(100, 100, 150, 150, 200, 200, 10);
    this.vwindow.setTheme(theme);
    this.vwindow.can_resize = true;

    this.hwindow = new Window.HorizontalScrollInternalWindow(300, 300, 80, 80, 200, 200, 10);
    this.hwindow.setTheme(theme);

    this.windows = new Window.WindowCollection();
    this.windows.addWindow(this.vwindow);
    this.windows.addWindow(this.hwindow);

    this.triangle = new InteractableTriangle(new Point2D(10, 10), new Point2D(10, 100), new Point2D(100, 100));
    //console.log(this.windows);
  }
  protected handleMouseMove(ev: MouseEvent): void {
    this.global_mouse = new Point2D(ev.clientX, ev.clientY);

    this.button.onMouseMove(this.global_mouse);
    this.toggle_button.updateMouse(this.global_mouse);
    //this.vwindow.onMouseMove(this.global_mouse);
    //this.hwindow.onMouseMove(this.global_mouse);

    this.windows.onMouseMove(this.global_mouse);

    let cursor = "default";
    const vstate = this.vwindow.getCursorState();
    if(vstate != "default"){
      cursor = vstate;
    }
    const hstate = this.hwindow.getCursorState();
    if(hstate != "default"){
      cursor = hstate;
    }
    WebGL.WebGL.setCursor(cursor);
    this.triangle.onMouseMove(this.global_mouse);
  }
  protected handleMouseDown(ev: MouseEvent): void {
    this.button.onMouseDown();
    this.toggle_button.mouseDown();
    //this.vwindow.onMouseDown(this.global_mouse);
    //this.hwindow.onMouseDown(this.global_mouse);
    this.windows.onMouseDown(this.global_mouse);
    this.triangle.onMouseDown(this.global_mouse);
  }
  protected handleMouseUp(ev: MouseEvent): void {
    this.button.onMouseUp();
    this.toggle_button.mouseUp();
    //this.vwindow.onMouseUp();
    //this.hwindow.onMouseUp();
    this.windows.onMouseUp();
    this.triangle.onMouseUp();
  }
  protected handleScrollWheel(ev: WheelEvent): void {
    //this.vwindow.onScrollWheel(ev);
    this.windows.onScrollWheel(ev);
  }
}

class ExampleVerticalScrollWindow extends Window.VerticalStrollInternalWindow{
  drawContent(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram){
    if(this.visible){
      const x = this.contentOffsetX();
      const y = this.contentOffsetY();
      this.enableScissors();
      WebGL.WebGL.drawColourRect(vp, colour_shader, x+10, y+10, 10, 10, WebGL.Colour.ColourUtils.red());
      this.disableScissors();
    }
  }
}