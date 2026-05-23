import * as WebGL from "./../../WebGL/globals";

import Button = WebGL.Interface.Button;
import Point2D = WebGL.Matrix.Point2D;
import Window = WebGL.Interface.InternalWindow;
import { WindowCollection } from "../../WebGL/Interface/internal_window";

type Int32 = number;

const theme: WebGL.Interface.Theme.InterfaceTheme = {
  primary: WebGL.Colour.ColourUtils.fromHex("40EB9E"),
  secondary: WebGL.Colour.ColourUtils.fromHex("4fb286"),
  tertiary: WebGL.Colour.ColourUtils.fromHex("77FFC2"),
  background: WebGL.Colour.ColourUtils.fromHex("3c896d"),
  secondary_background: WebGL.Colour.ColourUtils.fromHex("266C52"),
  close: WebGL.Colour.ColourUtils.fromHex("546d64"),
  close_hover: WebGL.Colour.ColourUtils.fromHex("CC1212"),
}

export class ITEngine extends WebGL.App.BaseEngine{
  global_mouse: Point2D;
  button: Button.BasicButton;
  toggle_button: Button.ToggleButton;

  vwindow: ExampleVerticalScrollWindow;
  hwindow: Window.HorizontalScrollInternalWindow;
  windows: Window.WindowCollection;
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
    //console.log(this.windows);
  }
  protected handleMouseMove(ev: MouseEvent): void {
    this.global_mouse = new Point2D(ev.clientX, ev.clientY);

    this.button.updateMouse(this.global_mouse);
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
  }
  protected handleMouseDown(ev: MouseEvent): void {
    this.button.mouseDown();
    this.toggle_button.mouseDown();
    //this.vwindow.onMouseDown(this.global_mouse);
    //this.hwindow.onMouseDown(this.global_mouse);
    this.windows.onMouseDown(this.global_mouse);
  }
  protected handleMouseUp(ev: MouseEvent): void {
    this.button.mouseUp();
    this.toggle_button.mouseUp();
    //this.vwindow.onMouseUp();
    //this.hwindow.onMouseUp();
    this.windows.onMouseUp();
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