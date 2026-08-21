import * as WebGL from "./../../WebGL/globals";
import * as Engine from "./engine";

type Float = number;
type Int32 = number;

class BattleGrid{
	shape_grid: Engine.ShapeIdGrid;
	interface: Engine.ShapeGridInterface;
	//layout: Engine.GridLayout;
	constructor(w: Int32, h: Int32){
		this.shape_grid = new Engine.ShapeIdGrid(w, h);
		this.interface = new Engine.ShapeGridInterface(w, h, 30, this.shape_grid);
	}
}

export class BattleEngine{
	battle_grid: BattleGrid;

	constructor(){
		this.battle_grid = new BattleGrid(14, 14);
	}

	onMouseMove(point: WebGL.Matrix.Point2D){
			//this.play_button.onMouseMove(point);
	}
	onMouseDown(point: WebGL.Matrix.Point2D){
		//this.play_button.onMouseDown();
	}
	onMouseUp(point: WebGL.Matrix.Point2D){
		//this.play_button.onMouseUp();
	}
	
	update(dt: Float){

	}
}