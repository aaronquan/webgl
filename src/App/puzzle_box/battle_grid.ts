import * as WebGL from "./../../WebGL/globals";
import * as BattleObject from "./battle_object";
import * as Engine from "./engine"; // possible change this import to shape
import * as Shape from "./shape";

type Float = number;
type Int32 = number;

export class BattleGrid{
	shape_grid: Shape.ShapeIdGrid;
	interface: Shape.ShapeGridInterface;

	constructor(x: Int32, y: Int32, w: Int32, h: Int32){
		this.shape_grid = new Shape.ShapeIdGrid(w, h);
		this.interface = new Shape.ShapeGridInterface(x, y, 30, this.shape_grid);
		//this.objects = [];
	}

	isValidCoordinate(coord: WebGL.Grid.Generic.Coordinate): boolean{
		return this.shape_grid.isValidCoordinate(coord);
	}

	drawInterfaceGridOutline(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, lt: Int32){
		const hlt = lt*0.5;
		//vertical lines
		colour_shader.use();
		colour_shader.setColourFromColourRGB(WebGL.Colour.ColourUtils.blue());
		let y_shift = 0;
		for(let y = 0; y <= this.shape_grid.height; y++){
			const model = WebGL.WebGL.rectangleModel(this.interface.x-hlt, this.interface.y+y_shift-hlt, this.interface.interfaceWidth()+lt, lt);
			colour_shader.setMvp(vp.multiplyCopy(model));
			WebGL.Shapes.Quad.draw();
			y_shift += this.interface.cell_size;
		}
		let x_shift = 0;
		for(let x = 0; x <= this.shape_grid.width; x++){
			const model = WebGL.WebGL.rectangleModel(this.interface.x+x_shift-hlt, this.interface.y, lt, this.interface.interfaceHeight()+hlt);
			colour_shader.setMvp(vp.multiplyCopy(model));
			WebGL.Shapes.Quad.draw();	
			x_shift += this.interface.cell_size;
		}
	}

	addObjectToGrid(x: Int32, y: Int32, object: BattleObject.BattleObjectInstance): boolean{
		const id = object.getId();
		const can_fit = this.shape_grid.canFitShape(object, x, y);
		if(can_fit){
				this.shape_grid.addShapeWithId(object, x, y, id);
			object.setPlacement(x, y);
		}
		return can_fit;
	}

	getShapeIdFromCoord(coord: WebGL.Grid.Generic.Coordinate): Int32 | undefined{
		return this.shape_grid.get(coord.x, coord.y);
	}

	update(dt: Float){
	}

}