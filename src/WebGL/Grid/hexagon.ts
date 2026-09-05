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

	static drawSolid(cx: Int32, cy: Int32, orientation: HexOrientation){
		//todo
	}
	
}

type HexGridDrawLayout = {
	x: Int32;
	y: Int32;
	side: Float; //hex side length
}

const HexTriangleSide = {

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

	//hex centre
	getHexagonCentreGlobal(x: Int32, y: Int32, override_layout: HexGridDrawLayout | undefined=undefined){

	}

	pointToHexCoord(point: WebGL.Geometry.Base.Point2D): Grid.Coordinate | undefined{
		if(this.draw_layout == undefined){
			return undefined;
		}
		const sq3 = Math.sqrt(3);
		if(this.orientation == HexOrientationEnum.Flat){
				//get q, r, s by comparing distance to lines
				const vr = new WebGL.Geometry.Base.Vector(1, sq3);
				const dr = vr.dot(new WebGL.Geometry.Base.Vector(point.y-100, point.x-100));
				const raw_r = dr / this.draw_layout.side / Math.sqrt(3);
				const r = Math.floor(raw_r);

				const vs = new WebGL.Geometry.Base.Vector(-1, sq3);
				const ds = vs.dot(new WebGL.Geometry.Base.Vector(point.y-100, point.x-100));
				const raw_s = ds / this.draw_layout.side / Math.sqrt(3);
				const s = Math.floor(raw_s);

				//const vs = new 

				const vert = 2 * (point.y-100) / Math.sqrt(3) / this.draw_layout.side;
				const q = Math.floor(vert);

				//console.log(r % 3); // 
				console.log(s % 3);
				// r 

				if(q % 2 == 0){
					//low sides are on +ve side 
					// even is low on x evens and high on x odds
					//if()
				}

				const x = Math.floor((r+1)/2)-vert;
				const y = x % 2 == 0 ? Math.floor(vert+1)/2 : Math.floor(vert)/2;
				//const x = Math.floor((r+1)/2);

				//console.log(`${q} ${r} ${s}`);

				//console.log(`${vert} ${r}`);
		}else{

		}
	}

	//
	static getHexSide(a: Int32, b: Int32, c: Int32){
		//a - vertical 
		if(a % 2 == 0){
			//if(b % )
		}
	}

	drawOutlineWithLayout(vp: WebGL.Matrix.TransformationMatrix3x3,
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
				used_layout.side, used_layout.x, used_layout.y, colour, lt
			);
		}
	}

	// x, y is the center of hex 0,0
	drawOutline(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram, 
		hex_size: Int32, x: Int32, y: Int32, colour: WebGL.Colour.ColourRGB, lt: Float){
    
		//colour_shader.use();
		//colour_shader.setColourFromColourRGB(colour);
		for(const hex of this.hexes){
			//console.log(hex_size);
			const pts = hex.toDrawPoints(this.orientation, hex_size, x, y);

			WebGL.WebGL.drawLinesFromPoints(vp, colour_shader, pts, lt, colour);
			//console.log(pts);
		}
	}

	drawSolid(vp: WebGL.Matrix.TransformationMatrix3x3, 
		hexagon_shader: WebGL.Shader.MVPHexagonProgram, 
		hex_size: Int32, x: Int32, y: Int32, colour: WebGL.Colour.ColourRGB){

		hexagon_shader.use();
		hexagon_shader.setColourFromColourRGB(colour);
		hexagon_shader.setOrientation(this.orientation);
		WebGL.WebGL.enableBlend();
		for(const hex of this.hexes){
			const center = hex.toCoordinates(this.orientation);
			center.scale(hex_size);
			center.shift(x, y);
			const ds = hex_size*2;
			const model = WebGL.WebGL.rectangleModel(center.x, center.y, ds, ds);
			hexagon_shader.setMvp(vp.multiplyCopy(model));
			WebGL.Shapes.CenterQuad.drawRelative();
		}
		WebGL.WebGL.disableBlend();
	}
	drawSolidWithLayout(vp: WebGL.Matrix.TransformationMatrix3x3,
		hexagon_shader: WebGL.Shader.MVPHexagonProgram, 
		colour: WebGL.Colour.ColourRGB,
		override_layout: HexGridDrawLayout | undefined=undefined){
		let used_layout = this.draw_layout;
		if(override_layout != undefined){
			used_layout = override_layout;
		}
		if(used_layout != undefined){
			this.drawSolid(vp, hexagon_shader, 
				used_layout.side, 
				used_layout.x, used_layout.y, 
				colour
			);
		}
		
	}
}