import * as WebGL from "./../../WebGL/globals";
import * as Engine from "./engine";
import * as Shape from "./shape";
import * as BObject from "./battle_object";
import * as Character from "./character";

type Float = number;
type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;

class BattleGrid{
	shape_grid: Engine.ShapeIdGrid;
	interface: Engine.ShapeGridInterface;

	constructor(x: Int32, y: Int32, w: Int32, h: Int32){
		this.shape_grid = new Engine.ShapeIdGrid(w, h);
		this.interface = new Engine.ShapeGridInterface(x, y, 30, this.shape_grid);
    //this.objects = [];
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

	addObjectToGrid(x: Int32, y: Int32, object: BObject.BattleObjectInstance){
		const id = object.getId();
		const can_fit = this.shape_grid.canFitShape(object.battle_object, x, y);
		if(can_fit){
    	this.shape_grid.addShapeWithId(object.battle_object, x, y, id);
		}
	}

  onMouseDown(coord: WebGL.Grid.Generic.Coordinate){
    //

  }

  

	update(dt: Float){
	}
}

export class BattleEngine{
	battle_grid: BattleGrid;
	battle_grid_coord: WebGL.Grid.Generic.Coordinate | undefined;

	shapes: Shape.GridShape[];
  //battle_objects: BattleObject[];
  //object_instances: Map<Int32, BObject.BattleObjectInstance>;
	object_instances: BObject.BattleObjectInstanceCollection;

	global_mouse: Point2D;


	player: Character.Character;
	enemy: Character.Character;
	constructor(){
		this.battle_grid = new BattleGrid(50, 50, 14, 14);
		this.global_mouse = new Point2D(0, 0);

		this.shapes = this.generateObjectShapes();
		//this.battle_objects = this.generateBattleObjects();

		this.object_instances = new BObject.BattleObjectInstanceCollection();
		const ws1 = this.object_instances.createInstance("WoodenSword");
		const st1 = this.object_instances.createInstance("Stone");
		if(ws1 != undefined){
			this.battle_grid.addObjectToGrid(2, 4, ws1);
		}
		if(st1 != undefined){
			this.battle_grid.addObjectToGrid(5,7, st1);
		}

		this.player = new Character.Character(10);
		this.enemy = new Character.Character(15);
	}

	private generateObjectShapes(): Shape.GridShape[]{
		const shapes = [];
		const single = new Shape.GridShape(1, 1, [true]);
		shapes.push(single);

		const duo = new Shape.GridShape(2, 1, [true, true]);
		shapes.push(duo);

		const trio = new Shape.GridShape(3, 1, [true, true, true]);
		shapes.push(trio);

		return shapes;
	}
	/*
  private generateBattleObjects(): BattleObject[]{
    const objects = [];

    const example = new BattleObject(this.shapes[0], "example", 1000);
    objects.push(example);

    const e2 = new BattleObject(this.shapes[1], "ex2", 1200);
    objects.push(e2);

		const e3 = new BattleObject(this.shapes[2], "a", 1300);
		objects.push(e3);

    return objects;
  }*/

	onMouseMove(point: Point2D){
		this.global_mouse = point;
		this.battle_grid_coord = this.battle_grid.interface.getCoord(this.global_mouse);
	}
	onMouseDown(point: Point2D){
		console.log(this.battle_grid_coord);
    if(this.battle_grid_coord != undefined){
      this.battle_grid.onMouseDown(this.battle_grid_coord);
    }
		//this.play_button.onMouseDown();
	}
	onMouseUp(point: Point2D){
		//this.play_button.onMouseUp();
	}
	
	update(dt: Float){
		this.object_instances.forAll((inst, _) => {
			inst.update(dt);
		});

		this.battle_grid.update(dt); // does nothing currently
	}
}