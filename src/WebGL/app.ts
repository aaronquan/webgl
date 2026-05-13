import WebGL from "../WebGL/globals";
import * as WebGLGlobals from "../WebGL/globals";

type Int32 = number;
type Float = number;

type VoidFunction = () => void;
const EmptyFunction: VoidFunction = () => {};
type TimeTakenFunction = (t:Float) => void
type OnFinishFunction = (onFinish: VoidFunction) => void;

interface IEngine{
  addEvents: () => void;
  loadResources: () => void;
  update: TimeTakenFunction;
  resize: (w: Int32, h:Int32) => void
}

export class BaseEngine implements IEngine{
  constructor(){};

  //to override
  loadResources(){};
  
  //to override
  update(t: Float){};

  addEvents(){
    this.addKeyEvents();
  }
  private addKeyEvents(){
    window.addEventListener("keydown", (ev) => this.handleKeyDown(ev));
    window.addEventListener("keyup", (ev) => this.handleKeyUp(ev));
    window.addEventListener("mousemove", (ev) => this.handleMouseMove(ev));
    window.addEventListener("mousedown", (ev) => this.handleMouseDown(ev));
    window.addEventListener("mouseup", (ev) => this.handleMouseUp(ev));
    document.addEventListener("wheel", (ev) => this.handleScrollWheel(ev));
  }
  resize(w: Int32, h:Int32){

  }

  //to override
  protected handleKeyDown(ev: KeyboardEvent){};
  //to override
  protected handleKeyUp(ev: KeyboardEvent){};
  //to override
  protected handleMouseMove(ev: MouseEvent){};
  //to override
  protected handleMouseDown(ev: MouseEvent){};
  //to override
  protected handleMouseUp(ev: MouseEvent){};
  //to override
  protected handleScrollWheel(ev: WheelEvent){
  }

}

export interface IEngineRenderer<E extends IEngine>{
  render?: (engine: E) => void;
  renderUpdate?: (time: Int32, engine: E) => void;
  loadTextures?: OnFinishFunction;
  resize?: (w: Int32, h: Int32) => void;
  //loadResources: () => void;
}

interface IRenderer{
  render: () => void;
  loadShaders?: () => void; // shaders usually already preloaded (added by raw file and compiled on shader class construction)
  loadTextures?: () => void;
}

export class App<E extends IEngine>{
  private engine: E;
  private renderer: IEngineRenderer<E>;

  constructor(engine: E, renderer: IEngineRenderer<E>){
    this.engine = engine;
    this.renderer = renderer;
  }
  addEvents(){
    this.engine.addEvents();
  }
  getRenderer(): IEngineRenderer<E>{
    return this.renderer;
  }
  resize(w: Int32, h: Int32, canvas: HTMLCanvasElement){
    this.engine.resize(w, h);
    if(this.renderer.resize) this.renderer.resize(w, h);
    WebGL.resetViewport(canvas);
  }

  //to override?
  loadResources(onLoaded:VoidFunction=()=>{}){
    //this.engine.loadTextures();
    if(this.renderer.loadTextures){
      this.renderer.loadTextures(onLoaded);
    }else{
      onLoaded();
    }
  }
  update(t: Float){
    this.engine.update(t);
  }
  draw(){
    //this.renderer.render(this.engine);
  }
  initApp(){
    this.addEvents();
    this.appCycle(0);
  }
  appCycle(t: Float){
    this.update(t);
    if(this.renderer.render) this.renderer.render(this.engine);
    requestAnimationFrame((t) => this.appCycle(t));
  }
}


//includes text
export class SimpleAppRenderer<E extends BaseEngine> implements IEngineRenderer<E>{
  fonts: WebGLGlobals.FontLoader;
  text_drawer: WebGLGlobals.TextDrawer;
  orthographic: WebGLGlobals.Matrix.TransformationMatrix3x3;
  font_names: string[];
  constructor(w: Int32, h: Int32){
    this.fonts = new WebGLGlobals.FontLoader();
    this.text_drawer = new WebGLGlobals.TextDrawer();
    this.orthographic = WebGLGlobals.Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
    this.font_names = [];
  }
  loadTextures(onLoad: VoidFunction=EmptyFunction){
    console.log("loading textures");
    for(const fn of this.font_names){
      this.fonts.addFont(fn);
    }
    this.fonts.loadFonts(() => {
      if(this.font_names.length != 0){
        this.text_drawer.setFont(this.fonts.getFont(this.font_names[0])!);
      }
      //this.text_drawer.loadFont(); //this does nothing
      console.log("finished loading");
      if(onLoad) onLoad();
      
    });
  }
  resize(w: Int32, h: Int32){
    this.orthographic = WebGLGlobals.Matrix.TransformationMatrix3x3.orthographic(0, w, h, 0);
  }
}