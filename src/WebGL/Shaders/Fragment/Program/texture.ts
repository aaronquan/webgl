import * as Shader from './../../shader';
import * as WebGL from './../../../globals';

const Texture = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;


uniform sampler2D u_texture_id;

void main(){
    gl_FragColor = texture2D(u_texture_id, v_relative);
}`;

export class TextureFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(Texture)){
        console.log('Texture: fragment source not added');
      }
    }
  }
}

export function TextureShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class Texture extends Base{
    private declare texture_id_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = 'TextureShader';
      if(!TextureFragmentShader.shader){
        TextureFragmentShader.load();
      }
      this.program.addFragment(TextureFragmentShader.shader!);
    }
    protected override addFragmentUniformLocations(): void{
      this.texture_id_uniform_location = this.program.getUniformLocation('u_texture_id');
    }
    setTextureId(i: GLint){
      this.program.setInt(this.texture_id_uniform_location!, i);
    }
  }
}

const ColourTexture = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;


uniform sampler2D u_texture_id;
uniform vec3 u_colour;

void main(){
    gl_FragColor = texture2D(u_texture_id, v_relative)*vec4(u_colour, 1.0);
}
`;

export class TextureColourFragmentShader{
  static shader?: Shader.FragmentShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.FragmentShader();
      if(!this.shader.addSource(ColourTexture)){
        console.log('Texture: fragment source not added');
      }
    }
  }
}

export function TextureColourShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class Texture extends Base{
    private declare texture_id_uniform_location: WebGLUniformLocation | null;
    private declare colour_uniform_location: WebGLUniformLocation | null;
    protected override setupFragment(){
      this.fragment_name = 'TextureColourShader';
      if(!TextureColourFragmentShader.shader){
        TextureColourFragmentShader.load();
      }
      this.program.addFragment(TextureColourFragmentShader.shader!);
    }
    protected override addFragmentUniformLocations(): void{
      this.texture_id_uniform_location = this.program.getUniformLocation('u_texture_id');
      this.colour_uniform_location = this.program.getUniformLocation("u_colour");
    }
    setTextureId(i: GLint){
      this.program.setInt(this.texture_id_uniform_location!, i);
    }
    setColour(a: GLfloat, b: GLfloat, c: GLfloat){
      this.program.setFloat3(this.colour_uniform_location!, a, b, c);
    }
    setColourFromColourRGB(colour: WebGL.Colour.ColourRGB){
      this.program.setFloat3(this.colour_uniform_location!, colour.red, colour.green, colour.blue);
    }
  }
}