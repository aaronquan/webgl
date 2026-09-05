import * as Shader from './../../shader';
import * as WebGL from './../../../globals';

const Diamond = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

uniform vec3 u_colour; //colour

void main(){
	vec2 uv = v_relative*2. - 1.;
	uv = abs(uv);
	float d = dot(uv, vec2(0.5*sqrt(3.), 0.5));
	//d = dot(uv, vec2(1., 1.));
	float dStep = 1.-step(0.5, d);

	//gl_FragColor = vec4(u_colour, 1.0);

  gl_FragColor = vec4(u_colour*dStep, dStep);
}`;

export class DiamondFragmentShader{
	static shader?: Shader.FragmentShader;
	static load(){
		if(this.shader == undefined){
			this.shader = new Shader.FragmentShader();
			if(!this.shader.addSource(Diamond)){
				console.log('Diamond: fragment source not added');
			}
		}
	}
}


export function DiamondShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
	return class Diamond extends Base{

		private declare colour_uniform_location: WebGLUniformLocation | null;
		protected override setupFragment(){
			this.fragment_name = 'DiamondShader';
			if(!DiamondFragmentShader.shader){
				DiamondFragmentShader.load();
			}
			this.program.addFragment(DiamondFragmentShader.shader!);
		}
		protected override addFragmentUniformLocations(): void{
			this.colour_uniform_location = this.program.getUniformLocation('u_colour');
		}
		setColour(a: GLfloat, b: GLfloat, c: GLfloat){
			this.program.setFloat3(this.colour_uniform_location!, a, b, c);
		}
		setColourFromColourRGB(colour: WebGL.Colour.ColourRGB){
			this.program.setFloat3(this.colour_uniform_location!, colour.red, colour.green, colour.blue);
		}
	}
}