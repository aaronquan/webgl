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
	constructor(w: Int32, h: Int32, ori?: TriangleGridOrientation){
		this.width = w;
		this.height = h;
		this.orientation = ori != undefined ? ori : TriangleGridOrientationEnum.HorizontalFlats;
	}

	setLayout(layout: TriangleGridLayout){
		this.layout = layout;
	}

	static trianglePoints(x: Int32, y: Int32, ori: TriangleGridOrientation, layout: TriangleGridLayout){

	}

	getTrianglePoints(x: Int32, y: Int32): WebGL.Geometry.Base.Point2D[]{
		const pts = [];
		if(this.layout == undefined) return [];
		const hs = this.layout.side*0.5;
		const sq3s = hs*Math.sqrt(3);
		if(this.orientation == TriangleGridOrientationEnum.HorizontalFlats || this.orientation == TriangleGridOrientationEnum.HorizontalPoints){
			const yt = this.layout.y + sq3s*y;
			const is_flat = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;
			const is_odd = y % 2 != 0;
			const x_off = is_flat ? (is_odd ? 1 : 0) : (is_odd ? -1 : 0);
			const flat_row = (is_flat && !is_odd) || (!is_flat && is_odd);
			const flat_tri = flat_row ? x % 2 == 0 : x % 2 == 1;
			const xt = this.layout.x + hs*x_off + (flat_row ? Math.ceil(x*0.5) : Math.floor(x*0.5))*this.layout.side;

			pts.push(new WebGL.Geometry.Base.Point2D(xt, yt));
			if(flat_tri){
				pts.push(new WebGL.Geometry.Base.Point2D(xt+this.layout.side, yt));
				pts.push(new WebGL.Geometry.Base.Point2D(xt+hs, yt+sq3s))
			}else{
				pts.push(new WebGL.Geometry.Base.Point2D(xt-hs, yt+sq3s));
				pts.push(new WebGL.Geometry.Base.Point2D(xt+hs, yt+sq3s));
			}

		}

		return pts;
	}

	pointToTriCoord(pt: Base.Point2D): Grid.Coordinate | undefined{
		if(this.layout == undefined) return;
		if(this.orientation == TriangleGridOrientationEnum.HorizontalFlats || this.orientation == TriangleGridOrientationEnum.HorizontalPoints){
			const y = (pt.y - this.layout.y)/(this.layout.side*0.5*Math.sqrt(3));
			//if(y < 0 || y >= this.height) return undefined;
			//console.log(y);
			const yc = Math.floor(y);
			const is_flat = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;
			const flat_first = (is_flat ? (yc % 2 == 0 ? true : false) : (yc % 2 == 0 ? false : true));
			//console.log(flat_first);
			const yd = y - yc;
			const x = 2*(pt.x - this.layout.y)/this.layout.side;
			//console.log(`${x.toFixed(2)} ${yd.toFixed(2)}`);
			let fl_x = Math.floor(x);
			const xd = x - fl_x;

			//console.log(fl_x + (!flat_first ? 1 : 0));
			//console.log(`${xd.toFixed(2)} ${yd.toFixed(2)}`);
			const is_left = ((fl_x + (!flat_first ? 1 : 0)) % 2 == 0 ? yd > xd : 1-yd > xd);
			const xc = fl_x - (is_left ? 1 : 0);
			//if(xc < 0 || xc >= this.width) return undefined;
			const gc = {x: xc, y: yc};
			//console.log(gc);
			/*
			if((fl_x + (!flat_first ? 1 : 0)) % 2 == 0 ){
				if(yd > xd){
					console.log("left");
				}else{
					console.log("right");
				}
			}else{
				if(1-yd > xd){
					console.log("left");
				}else{
					console.log("right");
				}
			}*/

			return gc;
		}

		return undefined;
	}

	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, lt: Int32){
		if(this.layout == undefined){
			return;
		}
		colour_shader.use();
		colour_shader.setColourFromColourRGB(colour);
		const odd_width = this.width % 2 == 1;
		const low_width = (odd_width ? this.width-1 : this.width)*0.5;
		const hi_width = (odd_width ? this.width+1 : this.width)*0.5; // 

		const hs = 0.5*this.layout.side;
		const sq3 = Math.sqrt(3);
		const sq3s = hs*sq3;
		if(this.orientation == TriangleGridOrientationEnum.HorizontalFlats || this.orientation == TriangleGridOrientationEnum.HorizontalPoints){
			const is_flat = this.orientation == TriangleGridOrientationEnum.HorizontalFlats;
			
			let y = this.layout.y;
			let hi_wid = is_flat;
			//horizontal lines
			for(let i = 0; i <= this.height; i++){
				const x = (i % 2 == 0) ? this.layout.x : this.layout.x + (is_flat ? 1 : -1)*hs;
				const width = (hi_wid ? hi_width : low_width)*this.layout.side;
				const line_model = WebGL.WebGL.lineModel(x, y, x+width, y, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				hi_wid = !hi_wid;
				y += sq3s;
			}

			//top left to right lines
			let x = this.layout.x;
			const wlr = is_flat ? hi_width+(odd_width ? 0 : 0.5) : low_width+(odd_width ? 0.5 : 0);
			for(let i = 0; i < wlr; i++){
				const steps = Math.min(this.height, (wlr-i)*2);
				const xs = steps*hs;
				const ys = steps*sq3s;
				const line_model = WebGL.WebGL.lineModel(x, this.layout.y, x+xs, this.layout.y+ys, lt);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				x += this.layout.side;
			}
			x = is_flat ? this.layout.x : this.layout.x - hs;
			const side_width_length = hi_width*2 + (odd_width ? 0 : 1);
			//left side lines
			let i = is_flat ? 2 : 1;
			for(; i < this.height; i+=2){
				const steps = Math.min(this.height-i, side_width_length);
				const xs = steps*hs;
				const ys = steps*sq3s;
				const y = this.layout.y + i*sq3s;
				const line_model = WebGL.WebGL.lineModel(x, 
					y,
					x + xs, y + ys, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				
			}


			x = this.layout.x;
			const wrl = is_flat ? hi_width + (odd_width ? 0.5 : 0) : low_width;
			//top right to left lines
			for(let i = 0; i <= wrl; i++){
				const steps = Math.min(this.height, (i+0.5)*2-(is_flat ? 1 : 0));
				const xs = -steps*hs;
				const ys = steps*sq3s;
				const line_model = WebGL.WebGL.lineModel(x, this.layout.y,
					x + xs, this.layout.y + ys, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();
				x += this.layout.side;
			}

			const width = (is_flat ? hi_width + (odd_width ? 0 : 0.5) : low_width + (odd_width ? 0.5 : 0))*this.layout.side;
			x = this.layout.x + width;
			//right side lines
			i = is_flat ? (odd_width ? 2 : 1) : (odd_width ? 1 : 2);
			for(; i < this.height; i+=2){
				const steps = Math.min(this.height-i, side_width_length);
				const xs = -steps*hs;
				const ys = steps*sq3s;
				const y = this.layout.y + sq3s*i;
				const line_model = WebGL.WebGL.lineModel(
					x, y, xs+x, ys+y, lt
				);
				colour_shader.setMvp(vp.multiplyCopy(line_model));
				WebGL.Shapes.Quad.draw();

			}
		}else{
			//todo do other orientations with vertical lines
			const is_flat = this.orientation == TriangleGridOrientationEnum.VerticalFlats;
		}
	}
}