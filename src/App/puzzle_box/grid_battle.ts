import * as WebGL from "./../../WebGL/globals";
import * as Engine from "./engine";
import * as Shape from "./shape";

type Float = number;
type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;

class BattleObject extends Shape.GridShapeInstance{
  name: string;
  cooldown: Float;
	constructor(shape: Shape.GridShape, name: string, cd: Float){
    super(shape);
    this.name = name;
    this.cooldown = cd;
	}

  //to override
  trigger(){

  }
}

class BattleObjectInstance{
  static current_id = 0;
  id: Int32;
  battle_object: BattleObject;
  freeform_placement: WebGL.Geometry.Base.Point2D | undefined;
  cooldown_timer: Float;
  num_triggers: Int32;
  constructor(bo: BattleObject){
    this.id = BattleObjectInstance.current_id;
    BattleObjectInstance.current_id++;
    this.battle_object = bo;
    this.cooldown_timer = 0;
    this.num_triggers = 0;
  }
  update(dt: Float){
    this.cooldown_timer += dt;
    if(this.cooldown_timer >= this.battle_object.cooldown){
      this.battle_object.trigger();
      this.num_triggers++;
      this.cooldown_timer -= this.battle_object.cooldown;
    }
  }
  getId(): Int32{
    return this.id;
  }
}

class BattleGrid{
	shape_grid: Engine.ShapeIdGrid;
	interface: Engine.ShapeGridInterface;

  objects: BattleObjectInstance[];
	//objects: 
	//layout: Engine.GridLayout;
	constructor(x: Int32, y: Int32, w: Int32, h: Int32){
		this.shape_grid = new Engine.ShapeIdGrid(w, h);
		this.interface = new Engine.ShapeGridInterface(x, y, 30, this.shape_grid);
    this.objects = [];
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

	addObjectToGrid(x: Int32, y: Int32, object: BattleObjectInstance){
		const id = object.getId();
    this.shape_grid.addShapeWithId(object.battle_object, x, y, id);
	}

  onMouseDown(coord: WebGL.Grid.Generic.Coordinate){
    //
    
  }

  

	update(){

	}
}

export class BattleEngine{
	battle_grid: BattleGrid;
	battle_grid_coord: WebGL.Grid.Generic.Coordinate | undefined;

	shapes: Shape.GridShape[];
  battle_objects: BattleObject[];

  object_instances: Map<Int32, BattleObjectInstance>;

	global_mouse: Point2D;
	constructor(){
		this.battle_grid = new BattleGrid(50, 50, 14, 14);
		this.global_mouse = new Point2D(0, 0);

		this.shapes = this.generateObjectShapes();
		this.battle_objects  = this.generateBattleObjects();

		this.object_instances = new Map();
		const test_instance = new BattleObjectInstance(this.battle_objects[0]);
		this.object_instances.set(0, test_instance);
    this.battle_grid.addObjectToGrid(2,2, test_instance);
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

  private generateBattleObjects(): BattleObject[]{
    const objects = [];

    const example = new BattleObject(this.shapes[0], "example", 1000);

    objects.push(example);

    const e2 = new BattleObject(this.shapes[0], "ex2", 1200);
    objects.push(e2);


    return objects;
  }

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

	}
}