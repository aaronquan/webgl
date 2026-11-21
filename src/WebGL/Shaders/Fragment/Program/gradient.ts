import * as Shader from './../../shader';
import * as WebGL from './../../../globals';

const HorizontalGradient = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

uniform vec3 u_colour_left; //colour
uniform vec3 u_colour_right; //colour

void main(){
  vec3 col = mix(u_colour_left, u_colour_right, v_relative.x);
  gl_FragColor = vec4(col, 1.0);
}
`;

const VerticalGradient = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

void main(){
  vec3 col = mix(u_colour_left, u_colour_right, v_relative.y);
  gl_FragColor = vec4(col, 1.0);
}
`;


export class HorizontalGradientFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(HorizontalGradient)){
        console.log('HorizontalGradient: fragment source not added');
      }
    }
  }
}

export class VerticalGradientFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(VerticalGradient)){
        console.log('VerticalGradient: fragment source not added');
      }
    }
  }
}

export function HorizontalGradientShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class HorizontalGradient extends Base{

    private declare colour_left_uniform_location: WebGLUniformLocation | null;
    private declare colour_right_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = 'HorizontalGradientShader';
      if(!HorizontalGradientFragmentShader.shader){
        HorizontalGradientFragmentShader.load();
      }
      this.program.addFragment(HorizontalGradientFragmentShader.shader!);
    }
    protected override addFragmentUniformLocations(): void{
      this.colour_left_uniform_location = this.program.getUniformLocation('u_colour_left');
      this.colour_right_uniform_location = this.program.getUniformLocation('u_colour_right');
    }
    setColourLeft(a: GLfloat, b: GLfloat, c: GLfloat){
      this.program.setFloat3(this.colour_left_uniform_location!, a, b, c);
    }
    setColourLeftFromColourRGB(colour: WebGL.Colour.ColourRGB){
      this.program.setFloat3(this.colour_left_uniform_location!, colour.red, colour.green, colour.blue);
    }
    setColourRight(a: GLfloat, b: GLfloat, c: GLfloat){
      this.program.setFloat3(this.colour_right_uniform_location!, a, b, c);
    }
    setColourRightFromColourRGB(colour: WebGL.Colour.ColourRGB){
      this.program.setFloat3(this.colour_right_uniform_location!, colour.red, colour.green, colour.blue);
    }
  }
}

export function VerticalGradientShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class VerticalGradient extends Base{

    private declare colour_left_uniform_location: WebGLUniformLocation | null;
    private declare colour_right_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = 'VerticalGradientShader';
      if(!VerticalGradientFragmentShader.shader){
        VerticalGradientFragmentShader.load();
      }
      this.program.addFragment(VerticalGradientFragmentShader.shader!);
    }
    protected override addFragmentUniformLocations(): void{
      this.colour_left_uniform_location = this.program.getUniformLocation('u_colour_left');
      this.colour_right_uniform_location = this.program.getUniformLocation('u_colour_right');
    }
    setColourLeft(a: GLfloat, b: GLfloat, c: GLfloat){
      this.program.setFloat3(this.colour_left_uniform_location!, a, b, c);
    }
    setColourLeftFromColourRGB(colour: WebGL.Colour.ColourRGB){
      this.program.setFloat3(this.colour_left_uniform_location!, colour.red, colour.green, colour.blue);
    }
    setColourRight(a: GLfloat, b: GLfloat, c: GLfloat){
      this.program.setFloat3(this.colour_right_uniform_location!, a, b, c);
    }
    setColourRightFromColourRGB(colour: WebGL.Colour.ColourRGB){
      this.program.setFloat3(this.colour_right_uniform_location!, colour.red, colour.green, colour.blue);
    }
  }
}
