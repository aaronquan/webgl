import * as WebGL from "./../globals";
import * as Base from "./../Geometry/base";
import * as Grid from "./generic";

type Int32 = number;
type Float = number;

const HexOrientationEnum = {
	Flat: 0,
	Pointy: 1
} as const;

type HexOrientation = (typeof HexOrientationEnum)[keyof typeof HexOrientationEnum];

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
		//todo;
		const sq3 = Math.sqrt(3);
		if(orientation == HexOrientationEnum.Pointy){
			return new Base.Point2D(this.s*sq3+this.r*sq3*0.5, this.r*1.5);
		}

		//orientation is flat
		return new Base.Point2D(this.r*1.5, this.s*sq3+this.r*sq3*0.5);
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

//creates a x*y hex grid

//https://www.redblobgames.com/grids/hexagons/
//todo
export class HexagonGrid{
	private width: Int32;
	private height: Int32;
	private hexes: Hexagon[];
	private orientation: HexOrientation;
	//for now assume odd layout
	constructor(w: Int32, h: Int32, ori: HexOrientation=HexOrientationEnum.Pointy){
		this.width = w;
		this.height = h;
		this.hexes = []; // to create
		this.orientation = ori;
	}

	private generateHexes(): Hexagon[] {
		const hexes = [];
		for(let y = 0; y < this.width; y++){
			for(let x = 0; x < this.height; x++){
				hexes.push(Hexagon.fromAxial(x-Math.floor(y*0.5), y));
			}
		}
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
	// x, y is the center of hex 0,0
	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram, 
		hex_size: Int32, x: Int32, y: Int32){
    
		colour_shader.use();
		for(let y = 0; y < this.height; y++){
			//todo
		}	
	}
}