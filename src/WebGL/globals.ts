import { loadVertexShaders } from "./Shaders/Vertex/vertex";
import { loadFragmentShaders } from "./Shaders/Fragment/fragment";
export class WebGL{
  static gl: WebGL2RenderingContext | null;
  //static buffer: WebGLBuffer | null; for testing
  static defaultError(){
    throw new Error("WebGL not initialised or null");
  }
  static initialise(canvas: HTMLCanvasElement){
    this.gl = canvas.getContext("webgl2", {alpha: false});
    if(this.gl){
      loadVertexShaders();
      loadFragmentShaders();
      //this.buffer = this.gl.createBuffer();
    }
  }
}


export default WebGL;