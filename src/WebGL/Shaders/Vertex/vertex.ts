import * as Shader from './../shader';
import * as Mvp2d from './Program/mvp2d';
import * as Transform2d from './Program/transform2d';
import * as Simple from "./Program/simple";

export function loadVertexShaders(){
  //no need to load with function, loaded when class is called
  //Mvp2d.Mvp2dVertexShader.load();
  //Transform2d.Transform2dVertexShader.load();
  //Simple.SimpleVertexShader.load();
}
export const Mvp2dMixin = Mvp2d.Mvp2dShaderProgramMix(Shader.ShaderProgramMixin);
export const Transform2dMixin = Transform2d.Transform2dShaderProgramMix(Shader.ShaderProgramMixin);
export const SimpleMixin = Simple.SimpleShaderProgramMix(Shader.ShaderProgramMixin);
