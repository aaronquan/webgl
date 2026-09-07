import * as WebGL from "./../globals";
import * as Base from "./../Geometry/base";
import * as Grid from "./generic";

type Int32 = number;
type Float = number;

export const TriangleGridOrientationEnum = {
	HorizontalFlats: 0, // starts with flats up top
	HorizontalPoints: 1, // starts with points up top
	VerticalFlats: 2,
	VerticalPoints: 3
} as const;

export type TriangleGridOrientation = (typeof TriangleGridOrientationEnum)[keyof typeof TriangleGridOrientationEnum]

type TriangleGridLayout = {
	side: Int32; // triangle side length
	x: Int32; // x, y: top left corner of grid
	y: Int32;
}

export class TriangleGrid{
	width: Int32;
	height: Int32;
	layout: TriangleGridLayout | undefined;
	orientation: TriangleGridOrientation;
	constructor(w: Int32, h: Int32, ori: TriangleGridOrientation | undefined ){
		this.width = w;
		this.height = h;
		this.orientation = ori != undefined ? ori : TriangleGridOrientationEnum.HorizontalFlats;
	}

	setLayout(layout: TriangleGridLayout){
		this.layout = layout;
	}

	static trianglePoints(x: Int32, y: Int32, ori: TriangleGridOrientation, layout: TriangleGridLayout){

	}

	pointToTriCoord(pt: Base.Point2D): Grid.Coordinate | undefined{
		//todo

		return undefined;
	}

	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, lt: Int32){
		if(this.layout == undefined){
			return;
		}
		colour_shader.use();
		colour_shader.setColourFromColourRGB(colour);
		const width_line_length = this.layout.side * this.width;
		const odd_width = this.width % 2 == 1;
		//const starting_width = (odd_width ? this.width-1 : this.width)*0.5;
		const low_width = (odd_width ? this.width-1 : this.width)*0.5;
		const hi_width = (odd_width ? this.width+1 : this.width)*0.5; // 

		const hs = 0.5*this.layout.side;
		const sq3 = Math.sqrt(3);
		if(this.orientation == TriangleGridOrientationEnum.HorizontalFlats || this.orientation == TriangleGridOrientationEnum.HorizontalPoints){
			const is_flat = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;
			
			let y = this.layout.y;
			let hi_wid = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;
			//horizontal lines
			for(let i = 0; i <= this.height; i++){
				const x = (i % 2 == 0) ? this.layout.x : this.layout.x + (is_flat ? 1 : -1)*0.5*this.layout.side;
				const width = (hi_wid ? hi_width : low_width)*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, y, x+width, y, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				hi_wid = !hi_wid;
				y += this.layout.side*0.5*Math.sqrt(3);
			}

			hi_wid = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;

			//top left to right lines
			//y = this.layout.y;
			let x = this.layout.x;
			const wlr = hi_wid ? hi_width : low_width+(odd_width ? 0.5 : 0);
			for(let i = 0; i < wlr; i++){
				const steps = Math.min(this.height, (wlr-i)*2);
				const xs = steps*0.5*this.layout.side;
				const ys = steps*0.5*Math.sqrt(3)*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, this.layout.y, x+xs, this.layout.y+ys, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				x += this.layout.side;
			}
			x = hi_wid ? this.layout.x : this.layout.x - this.layout.side*0.5;
			const side_width_length = hi_width*2 + (odd_width ? 0 : 1);
			//left side lines
			let i = is_flat ? 2 : 1;
			for(; i < this.height; i+=2){
				const steps = Math.min(this.height-i, side_width_length);
				const xs = steps*0.5*this.layout.side;
				const ys = steps*0.5*Math.sqrt(3)*this.layout.side;
				const y = this.layout.y + i*this.layout.side*0.5*Math.sqrt(3);
				const line_model = WebGL.WebGL.lineModel(x, 
					y,
					x + xs, y + ys, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				
			}


			x = this.layout.x;
			const wrl = hi_wid ? hi_width : low_width;
			//top right to left lines
			for(let i = 0; i <= wrl; i++){
				const steps = Math.min(this.height, (i+1)*2-1);
				const xs = -steps*0.5*this.layout.side;
				const ys = steps*0.5*Math.sqrt(3)*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, this.layout.y,
					x + xs, this.layout.y + ys, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				x += this.layout.side;
			}
			const width = (hi_wid ? hi_width : low_width)*this.layout.side;
			x = hi_wid ? this.layout.x + width : this.layout.x + width;
			//right side lines
			i = is_flat ? 1 : 2;
			for(; i < this.height; i+=2){
				const steps = Math.min(this.height-i, side_width_length);
				const xs = -steps*hs;
				const ys = steps*hs*sq3;
				const y = this.layout.y + hs*sq3*i;
				const line_model = WebGL.WebGL.lineModel(
					x, y, xs+x, ys+y, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();

			}
		}
	}
}