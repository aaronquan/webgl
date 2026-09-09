import * as Matrix from './../../../Matrix/matrix';
import * as Shader from './../../shader';

const Simple = `attribute vec2 position;

varying vec2 v_position;

void main(){
  gl_Position = vec4(position.x, position.y, 1., 1.);

  v_position = position;
}
`;

export class SimpleVertexShader{
  static shader?: Shader.VertexShader;
  static load(){
    if(this.shader == undefined){
      this.shader = new Shader.VertexShader();
      if(!this.shader.addSource(Simple)){
        console.log('Simple: vertex source not added');
      }
    }
  }
}

export function SimpleShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
  return class Mvp2d extends Base{
    private declare position_attribute_location: GLint | null;
    //private declare relative_attribute_location: GLint | null;
    protected override setupVertex(){
      this.vertex_name = 'SimpleVertex';
      if(!SimpleVertexShader.shader){
        SimpleVertexShader.load();
      }
      this.program.addVertex(SimpleVertexShader.shader!);
    }
    protected override addVertexAttributeLocations(): void{
      this.position_attribute_location = this.program.getAttributeLocation('a_position');
      //this.relative_attribute_location = this.program.getAttributeLocation('a_relative');
    }
    protected override addVertexUniformLocations(): void{
    }
  }
}