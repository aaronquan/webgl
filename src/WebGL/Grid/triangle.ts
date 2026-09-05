import * as WebGL from "./../globals";
import * as Base from "./../Geometry/base";

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

	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, lt: Int32){
		if(this.layout == undefined){
			return;
		}
		colour_shader.use();
		colour_shader.setColourFromColourRGB(colour);
		//draw horizontal / vertical lines
		const width_line_length = this.layout.side * this.width;
		if(this.orientation == TriangleGridOrientationEnum.HorizontalFlats || this.orientation == TriangleGridOrientationEnum.HorizontalPoints){
			let y = this.layout.y;
			for(let i = 0; i < this.height; i++){
				const x = (i % 2 == 0) ? this.layout.x : this.layout.x - 0.5*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, y, x+width_line_length, y, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();

				y += this.layout.side*0.5*Math.sqrt(3);
			}

			//top left to right lines
			//y = this.layout.y;
			let x = this.layout.x;
			for(let i = 0; i < this.width; i++){
				const steps = Math.min(this.height, this.width-i);
				const xs = steps*0.5*this.layout.side;
				const ys = steps*0.5*Math.sqrt(3)*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, this.layout.y, x+xs, this.layout.y+ys, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				x += this.layout.side;
			}
		}
	}
}