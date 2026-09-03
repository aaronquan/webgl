import * as WebGL from "./../globals";
import * as Base from "./../Geometry/base";
import * as Grid from "./generic";

type Int32 = number;
type Float = number;

export const HexOrientationEnum = {
	Flat: 0,
	Pointy: 1
} as const;

export type HexOrientation = (typeof HexOrientationEnum)[keyof typeof HexOrientationEnum];

//tan 60 = 0.5/x or x/0.5

// x = 0.5/tan(60)


export class Hexagon{
  q: Int32;
	r: Int32;
	s: Int32;
	constructor(q: Int32, r: Int32, s: Int32){
		this.q = q;
		this.r = r;
		this.s = s;
	}
	static fromAxial(q: Int32, r: Int32): Hexagon{
		return new Hexagon(q, r, -q-r);
	}

	//horizontal distance is sqrt(3)
	//
	toCoordinates(orientation: HexOrientation): Base.Point2D{
		//todo - test
		const sq3 = Math.sqrt(3);
		const c1 = -this.s*sq3-this.r*sq3*0.5; // negatived value based on visual placement
		const c2 = this.r*1.5;
		if(orientation == HexOrientationEnum.Pointy){
			return new Base.Point2D(c1, c2);
		}

		//orientation is flat
		return new Base.Point2D(c2, c1);
	}
	toPoints(orientation: HexOrientation, scale: Float=1){
		const base_points = Hexagon.getBasePoints(orientation);
		const coords = this.toCoordinates(orientation);
		const shifted_points = base_points.map((p) => {
			p.x += coords.x;
			p.y += coords.y;
			p.x *= scale;
			p.y *= scale;
			return p;
		});

		return shifted_points;
	}
	toDrawPoints(orientation: HexOrientation, scale: Float=1, x: Int32, y: Int32){
		const points = this.toPoints(orientation, scale);
		points.push(points[0].copy());
		points.map((p) => {
			p.x += x;
			p.y += y;
		});
		return points;
	}

	asTriangles(){

	}

	static getBasePoints(orientation: HexOrientation): Base.Point2D[]{
		const sq3 = Math.sqrt(3);
		const hsq3 = sq3*0.5;
		if(orientation == HexOrientationEnum.Pointy){
			return [
				new Base.Point2D(0, 1), new Base.Point2D(hsq3, 0.5), new Base.Point2D(hsq3, -0.5),
				new Base.Point2D(0, -1), new Base.Point2D(-hsq3, -0.5), new Base.Point2D(-hsq3, 0.5)
			];
		}

		return [
			new Base.Point2D(-0.5, hsq3), new Base.Point2D(0.5, hsq3), new Base.Point2D(1, 0),
			new Base.Point2D(0.5, -hsq3), new Base.Point2D(-0.5, -hsq3), new Base.Point2D(-1, 0)
		];
	}
	
}

type HexGridDrawLayout = {
	x: Int32;
	y: Int32;
	side: Float; //hex side length
}

//creates a x*y hex grid

//https://www.redblobgames.com/grids/hexagons/
//todo
export class HexagonGrid{
	private width: Int32;
	private height: Int32;
	private hexes: Hexagon[];
	private orientation: HexOrientation;

	private draw_layout: HexGridDrawLayout | undefined;
	//for now assume odd layout

	constructor(w: Int32, h: Int32, ori: HexOrientation=HexOrientationEnum.Pointy){
		this.width = w;
		this.height = h;
		this.hexes = this.generateHexes(); // to create
		this.orientation = ori;

		this.draw_layout = undefined;
	}

	setLayout(layout: HexGridDrawLayout){
		this.draw_layout = layout;
	}

	private generateHexes(): Hexagon[] {
		const hexes = [];
		for(let y = 0; y < this.height; y++){
			for(let x = 0; x < this.width; x++){
				hexes.push(Hexagon.fromAxial(x-Math.floor(y*0.5), y));
			}
		}
		console.log(hexes);
		return hexes;
	}

	//returns axial coordinates
	gridToHexagonCoords(coord: Grid.Coordinate): Grid.Coordinate {
		if(this.orientation == HexOrientationEnum.Pointy){
			return {x: coord.x-Math.floor(coord.y*0.5), y: coord.y};
		}else if(this.orientation == HexOrientationEnum.Flat){
			return {x: coord.x, y: coord.y-Math.floor(coord.x*0.5)};
		}
		return {x: 0, y: 0};
	}

	hexToGridCoords(){
		if(this.orientation == HexOrientationEnum.Pointy){
			
		}else if(this.orientation == HexOrientationEnum.Flat){

		}
	}

	getHex(){

	}
	drawWithLayout(vp: WebGL.Matrix.TransformationMatrix3x3,
		colour_shader: WebGL.Shader.MVPColourProgram,
		colour: WebGL.Colour.ColourRGB,
		lt: Int32,
		override_layout: HexGridDrawLayout | undefined=undefined
	){
		let used_layout = this.draw_layout;
		if(override_layout != undefined){
			used_layout = override_layout;
		}
		if(used_layout != undefined){
			this.drawOutline(vp, colour_shader, 
				used_layout.x, used_layout.y, used_layout.side, colour, lt
			)
		}
	}

	// x, y is the center of hex 0,0
	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram, 
		hex_size: Int32, x: Int32, y: Int32, colour: WebGL.Colour.ColourRGB, lt: Float){
    
		colour_shader.use();
		colour_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.green());
		for(const hex of this.hexes){
			const pts = hex.toDrawPoints(this.orientation, hex_size, x, y);

			WebGL.WebGL.drawLinesFromPoints(vp, colour_shader, pts, lt, colour);
			//console.log(pts);
		}
	}
}