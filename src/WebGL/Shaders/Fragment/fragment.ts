import * as Shader from '../shader';
import * as FragmentSource from './Source/fragment_source';

export function loadFragmentShaders(){
  SimpleFragmentShader.load();
  ColourFragmentShader.load();
  CircleFragmentShader.load();
  OutlineCircleFragmentShader.load();
  OutlineRectFragmentShader.load();
}

export class SimpleFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(FragmentSource.simple)){
        console.log("Simple: fragment source not added");
      }
    }
  }
}

export class ColourFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(!this.shader){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(FragmentSource.colour)){
        console.log("Colour: fragment source not added");
      }
    }
  }
}

export class CircleFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(!this.shader){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(FragmentSource.circle)){
        console.log("Circle: fragment source not added");
      }
    }
  }
}

export class OutlineCircleFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(!this.shader){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(FragmentSource.circle_outline)){
        console.log("Circle outline: source not added");
      }
    }
  }
}

export class OutlineRectFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(!this.shader){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(FragmentSource.rect_outline)){
        console.log("Rect outline: source not added");
      }
    }
  }
}

export function ColourShaderProgramMixin<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class Colour extends Base{
    private declare colour_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = "ColourShader";
      if(ColourFragmentShader.shader){
        this.program.addFragment(ColourFragmentShader.shader);
      }else{
        throw new Error(`${this.fragment_name} not loaded`);
      }
    }
    protected override add_fragment_uniform_locations(): void {
      this.colour_uniform_location = this.program.getUniformLocation("colour");
    }
    setColour(r: GLfloat, g: GLfloat, b: GLfloat){
      this.program.setFloat3(this.colour_uniform_location!, r, g, b);
    }
  }
}

export function CircleShaderProgramMixin<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class Circle extends Base{
    private declare radius_uniform_location: WebGLUniformLocation | null;
    private declare centre_uniform_location: WebGLUniformLocation | null;
    private declare circle_colour_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = "CircleShader";
      if(CircleFragmentShader.shader){
        this.program.addFragment(CircleFragmentShader.shader);
      }else{
        throw new Error(`${this.fragment_name} not loaded`);
      }
    }
    protected override add_fragment_uniform_locations(): void{
      this.radius_uniform_location = this.program.getUniformLocation("u_radius");
      this.centre_uniform_location = this.program.getUniformLocation("u_centre");
      this.circle_colour_uniform_location = this.program.getUniformLocation("u_circle_colour");
    }
    setRadius(r: GLfloat){
      this.program.setFloat(this.radius_uniform_location!, r);
    }
    setCentre(x: GLfloat, y: GLfloat){
      this.program.setFloat2(this.centre_uniform_location!, x, y);
    }
    setCircleColour(r: GLfloat, g: GLfloat, b: GLfloat){
      this.program.setFloat3(this.circle_colour_uniform_location!, r, g, b);
    }
  }
}

export function CircleOutlineShaderProgramMixin<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class CircleOutline extends Base{
    private declare radius_uniform_location: WebGLUniformLocation | null;
    private declare centre_uniform_location: WebGLUniformLocation | null;
    private declare outline_radius_uniform_location: WebGLUniformLocation | null;
    private declare outline_colour_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = "CircleOutlineShader";
      if(OutlineCircleFragmentShader.shader){
        this.program.addFragment(OutlineCircleFragmentShader.shader);
      }else{
        throw new Error(`${this.fragment_name} not loaded`);
      }
    }
    protected override add_fragment_uniform_locations(): void{
      this.radius_uniform_location = this.program.getUniformLocation("u_radius");
      this.centre_uniform_location = this.program.getUniformLocation("u_centre");
      this.outline_radius_uniform_location = this.program.getUniformLocation("u_outline_radius");
      this.outline_colour_uniform_location = this.program.getUniformLocation("u_outline_colour");
    }
    setRadius(r: GLfloat){
      this.program.setFloat(this.radius_uniform_location!, r);
    }
    setCentre(x: GLfloat, y: GLfloat){
      this.program.setFloat2(this.centre_uniform_location!, x, y);
    }
    setOutlineRadius(r: GLfloat){
      this.program.setFloat(this.outline_radius_uniform_location!, r);
    }
    setOutlineColour(r: GLfloat, g: GLfloat, b: GLfloat, a: GLfloat=1.0){
      this.program.setFloat4(this.outline_colour_uniform_location!, r, g, b, a);
    }
  }
}

export function RectOutlineShaderProgramMixin<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class RectOutline extends Base{
    private declare outline_colour_uniform_location: WebGLUniformLocation | null;
    private declare outline_ratio_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = "RectOutlineShader";
      if(OutlineRectFragmentShader.shader){
        this.program.addFragment(OutlineRectFragmentShader.shader);
      }else{
        throw new Error(`${this.fragment_name} not loaded`);
      }
    }
    protected override add_fragment_uniform_locations(): void{
      this.outline_colour_uniform_location = this.program.getUniformLocation("u_outline_colour");
      this.outline_ratio_uniform_location = this.program.getUniformLocation("u_outline_ratio");
    }
    setOutlineRatio(r: GLfloat){
      this.program.setFloat(this.outline_ratio_uniform_location!, r);
    }
    setOutlineColour(r: GLfloat, g: GLfloat, b: GLfloat, a: GLfloat=1.0){
      this.program.setFloat4(this.outline_colour_uniform_location!, r, g, b, a);
    }
  }
}