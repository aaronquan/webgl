import * as Shader from './../../shader';
import * as WebGL from './../../../globals';

const HexagonFlat = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

uniform vec3 u_colour; //colour

void main(){
	vec2 uv = v_relative*2. - 1.;
	uv = abs(uv);
	float d = dot(uv, vec2(0.5*sqrt(3.), 0.5));
	float dMax = max(d, uv.y);
	float dStep = step(dMax, sqrt(3.)*0.5);

  gl_FragColor = vec4(u_colour*dStep, dStep);
}`;

const HexagonPointy = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

uniform vec3 u_colour; //colour

void main(){
	vec2 uv = v_relative*2. - 1.;
	uv = abs(uv);
	float d = dot(uv, vec2(0.5, 0.5*sqrt(3.)));
	float dMax = max(d, uv.x);
	float dStep = step(dMax, sqrt(3.)*0.5);

  gl_FragColor = vec4(u_colour*dStep, dStep);
}`;

const Hexagon = `precision mediump float;

varying vec2 v_position;
varying vec2 v_relative;

uniform float u_orientation; // 0 for flat 1 for pointy
uniform vec3 u_colour; //colour

void main(){
	vec2 uv = v_relative*2. - 1.;
	uv = abs(uv);

	float sq3 = sqrt(3.);

	float st = step(u_orientation, 0.);
	float sti = 1.-st;

	float vx = st*0.5*sq3 + sti*0.5;
	float vy = st*0.5 + sti*0.5*sq3;
	float m = st*uv.y + sti*uv.x;

	float d = dot(uv, vec2(vx, vy));
	float dMax = max(d, m);
	float dStep = step(dMax, sq3*0.5);

  gl_FragColor = vec4(u_colour*dStep, dStep);
}`;

export class HexagonFragmentShader{
	static shader?: Shader.FragmentShader;
	static load(){
		if(this.shader == undefined){
			this.shader = new Shader.FragmentShader();
			if(!this.shader.addSource(Hexagon)){
				console.log('Hexagon: fragment source not added');
			}
		}
	}
}

export class HexagonFlatFragmentShader{
	static shader?: Shader.FragmentShader;
	static load(){
		if(this.shader == undefined){
			this.shader = new Shader.FragmentShader();
			if(!this.shader.addSource(HexagonFlat)){
				console.log('HexagonFlat: fragment source not added');
			}
		}
	}
}

export class HexagonPointyFragmentShader{
	static shader?: Shader.FragmentShader;
	static load(){
		if(this.shader == undefined){
			this.shader = new Shader.FragmentShader();
			if(!this.shader.addSource(HexagonPointy)){
				console.log('HexagonPointy: fragment source not added');
			}
		}
	}
}

export function HexagonShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
	return class HexagonF extends Base{
		private declare orientation_uniform_location: WebGLUniformLocation | null;
		private declare colour_uniform_location: WebGLUniformLocation | null;
		protected override setupFragment(){
			this.fragment_name = 'HexagonShader';
			if(!HexagonFragmentShader.shader){
				HexagonFragmentShader.load();
			}
			this.program.addFragment(HexagonFragmentShader.shader!);
		}
		protected override addFragmentUniformLocations(): void{
			this.orientation_uniform_location = this.program.getUniformLocation('u_orientation');
			this.colour_uniform_location = this.program.getUniformLocation('u_colour');
		}
		setOrientation(ori: WebGL.Grid.Hexagon.HexOrientation){
			if(ori == WebGL.Grid.Hexagon.HexOrientationEnum.Flat){
				this.setFlat();
			}else{
				this.setPointy();
			}
		}
		setPointy(){
			this.program.setFloat(this.orientation_uniform_location!, 1.0);
		}
		setFlat(){
			this.program.setFloat(this.orientation_uniform_location!, 0.0);
		}
		setColour(a: GLfloat, b: GLfloat, c: GLfloat){
			this.program.setFloat3(this.colour_uniform_location!, a, b, c);
		}
		setColourFromColourRGB(colour: WebGL.Colour.ColourRGB){
			this.program.setFloat3(this.colour_uniform_location!, colour.red, colour.green, colour.blue);
		}
	}
}

export function HexagonFlatShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
	return class HexagonF extends Base{

		private declare colour_uniform_location: WebGLUniformLocation | null;
		protected override setupFragment(){
			this.fragment_name = 'HexagonFlatShader';
			if(!HexagonFlatFragmentShader.shader){
				HexagonFlatFragmentShader.load();
			}
			this.program.addFragment(HexagonFlatFragmentShader.shader!);
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


export function HexagonPointyShaderProgramMix<TBase extends Shader.CustomShaderProgramable>(Base: TBase){
	return class HexagonP extends Base{

		private declare colour_uniform_location: WebGLUniformLocation | null;
		protected override setupFragment(){
			this.fragment_name = 'HexagonPointyShader';
			if(!HexagonPointyFragmentShader.shader){
				HexagonPointyFragmentShader.load();
			}
			this.program.addFragment(HexagonPointyFragmentShader.shader!);
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

