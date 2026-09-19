import * as WebGL from "./../../WebGL/globals";
import * as Engine from "./engine";
import * as Shape from "./shape";
import * as BObject from "./battle_object";
import * as Character from "./character";

type Float = number;
type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;
import Button = WebGL.Interface.Button;

export class BattleGrid{
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
		const can_fit = this.shape_grid.canFitShape(object, x, y);
		if(can_fit){
    	this.shape_grid.addShapeWithId(object, x, y, id);
			object.setPlacement(x, y);
		}
	}

	getShapeIdFromCoord(coord: WebGL.Grid.Generic.Coordinate): Int32 | undefined{
		return this.shape_grid.getId(coord.x, coord.y);
	}

	update(dt: Float){
	}
}

class BattleEngineControls{
	start_battle: WebGL.Interface.Button.BasicButton;
	constructor(x: Int32, y: Int32){
		const button_width = 80;
		const button_height = 30;

		this.start_battle = new Button.BasicButton(x, y, button_width, button_height);
		this.start_battle.text = "Start";
		this.start_battle.text_size = 15;

	}
	setStartBattleFunction(f: () => void){
		this.start_battle.onPressed = f;
	}
	onMouseMove(point: Point2D){
		this.start_battle.onMouseMove(point);
	}
	onMouseDown(point: Point2D){
		this.start_battle.onMouseDown();
	}
	onMouseUp(point: Point2D){
		this.start_battle.onMouseUp();
	}

	draw(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram, 
		text_drawer: WebGL.TextDrawer,

	){
		this.start_battle.draw(vp, colour_shader, text_drawer);
	}
}

const BattleStateEnum = {
	Setup: 0,
	Battle: 1
} as const

type BattleState = (typeof BattleStateEnum)[keyof typeof BattleStateEnum];

export class BattleObjectInstanceGenerator{
	x: Int32;
	y: Int32;
	obj_interface_size: Int32;
	cell_size: Int32;
	objs: BObject.BattleObject[];
	hover_index: Int32 | undefined;
	constructor(x: Int32, y: Int32){
		this.x = x;
		this.y = y;
		this.obj_interface_size = 80;
		this.cell_size = 15;
		this.objs = [];
	}
	getHoveredObject(): BObject.BattleObject | undefined{
		if(this.hover_index == undefined) return undefined;
		return this.objs[this.hover_index];
	}
	addObject(obj: BObject.BattleObject){
		this.objs.push(obj);
	}
	getGeneratorXFromPoint(point: Point2D): Int32 | undefined{
		const rx = point.x - this.x;
		const ry = point.y - this.y;
		if(ry < 0 || ry > this.obj_interface_size){
			return undefined;
		}
		const x = rx / this.obj_interface_size;
		if(x < 0 || x > this.objs.length){
			return undefined;
		}
		return Math.floor(x);
	}
	onMouseMove(point: Point2D){
		const hover_x = this.getGeneratorXFromPoint(point);
		this.hover_index = hover_x;
		//console.log(this.hover_index);

	}
	onMouseDown(point: Point2D){
		if(this.hover_index != undefined){
			console.log(this.hover_index);
		}
	}
	onMouseUp(point: Point2D){

	}

	draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, colour_collection: WebGL.Colour.ColourRGBCollection){
		let x = this.x;
		for(let i = 0; i < this.objs.length; i++){
			WebGL.WebGL.drawColourRect(vp, colour_shader, x, this.y, this.obj_interface_size, this.obj_interface_size, WebGL.Colour.ColourUtils.cyan());
			const cx = x + this.obj_interface_size*0.5;
			const cy = this.y + this.obj_interface_size*0.5;
			const pw = this.objs[i].getShapeWidth()*this.cell_size;
			const ph = this.objs[i].getShapeHeight()*this.cell_size;
			const colour = colour_collection.getColour(this.objs[i].colour);
			if(colour != undefined){
				const coords = this.objs[i].shape.getCoordinates();
				for(const c of coords){
					const cx = x + this.obj_interface_size*0.5 - pw*0.5;
					const cy = this.y + this.obj_interface_size*0.5 - ph*0.5 ;
					WebGL.WebGL.drawColourRect(vp, colour_shader, 
						cx+c.x*this.cell_size, cy+c.y*this.cell_size, 
						this.cell_size, this.cell_size, 
						colour
					);
				}
			}
			if(colour != undefined){
				WebGL.WebGL.drawColourRect(vp, colour_shader, cx-pw*0.5, cy-ph*0.5, pw, ph, colour);
			}
			x += this.obj_interface_size;
		}
	}
}

export class BattleEngine{
	battle_grid: BattleGrid;
	battle_grid_coord: WebGL.Grid.Generic.Coordinate | undefined;
	battle_grid_true_coord: WebGL.Geometry.Base.Point2D | undefined;

	//battle object
	shapes: Shape.GridShape[];

	battle_object_generators: BattleObjectInstanceGenerator;
	object_instances: BObject.BattleObjectInstanceCollection;
	dragged_object: Int32 | undefined;

	global_mouse: Point2D;

	object_bin: WebGL.Interface.InterfaceElement.InterfaceElement;

	player: Character.BattleCharacter;
	kills: Int32;
	enemy: Character.Character;

	state: BattleState;

	controls: BattleEngineControls;
	constructor(){
		this.battle_grid = new BattleGrid(50, 50, 14, 14);
		this.global_mouse = new Point2D(0, 0);

		this.battle_object_generators = new BattleObjectInstanceGenerator(220, 500);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.WoodenSword.name)!);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.Stone.name)!);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.BandAid.name)!);

		this.shapes = this.generateObjectShapes();

		this.player = new Character.BattleCharacter(10);
		//this.battle_objects = this.generateBattleObjects();

		this.object_instances = new BObject.BattleObjectInstanceCollection();
		const ws1 = this.object_instances.createInstance(BObject.WoodenSword.name);
		const st1 = this.object_instances.createInstance(BObject.Stone.name);
		const ba1 = this.object_instances.createInstance(BObject.BandAid.name);
		const st2 = this.object_instances.createInstance(BObject.Stone.name);
		if(ws1 != undefined){
			this.battle_grid.addObjectToGrid(2, 4, ws1);
			ws1.setOwner(this.player);
			//this.player.addObject(ws1);
		}
		if(st1 != undefined){
			this.battle_grid.addObjectToGrid(5, 7, st1);
			st1.setOwner(this.player);
			//this.player.addObject(st1);
		}
		if(ba1 != undefined){
			this.battle_grid.addObjectToGrid(1,2, ba1);
			ba1.setOwner(this.player);
			//this.player.addObject(ba1);
		}
		if(st2 != undefined){
			this.battle_grid.addObjectToGrid(8, 8, st2);
			st2.setOwner(this.player);
			//this.player.addObject(st2);
		}

		this.kills = 0;
		this.enemy = new Character.Character(15);

		this.state = BattleStateEnum.Setup;

		this.controls = new BattleEngineControls(
			this.battle_grid.interface.x+this.battle_grid.interface.interfaceWidth()+10, 
			100
		);
		
		this.setControlFunctions();

		this.object_bin = new WebGL.Interface.InterfaceElement.InterfaceElement(this.battle_grid.interface.x+this.battle_grid.interface.interfaceWidth()+10, 50, 40, 40);
	}

	private setControlFunctions(){
		this.controls.setStartBattleFunction(() => {
			if(this.state == BattleStateEnum.Setup){
				this.state = BattleStateEnum.Battle;
			}else{
				console.log("Already battling");
			}
		})
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

	onKeyDown(key: string){
		switch(key){
			case "q":
				console.log(this.object_instances);
				break;
		}
	}

	onMouseMove(point: Point2D){
		this.global_mouse = point;
		this.battle_grid_coord = this.battle_grid.interface.getCoord(this.global_mouse);
		this.battle_grid_true_coord = this.battle_grid.interface.trueCoord(this.global_mouse);
		this.controls.onMouseMove(point);
		this.battle_object_generators.onMouseMove(point);

		if(this.dragged_object != undefined){
			const instance = this.object_instances.getInstance(this.dragged_object);
			if(instance != undefined){
				instance.freeform_placement = point;
			}
		}
	}
	onMouseDown(point: Point2D){
		//pick up objects from grid
    if(this.battle_grid_coord != undefined){
			const id = this.battle_grid.getShapeIdFromCoord(this.battle_grid_coord);
			if(id != undefined){
				const instance = this.object_instances.getInstance(id);
				if(instance != undefined){
					this.battle_grid.shape_grid.removeShape(instance);
					instance.displace();
					
					this.dragged_object = instance.getId();
					instance.freeform_placement = point;
				}
			}
    }

		this.controls.onMouseDown(point);
		this.battle_object_generators.onMouseDown(point);

		//create new instance from generator
		const generator_object = this.battle_object_generators.getHoveredObject();
		if(generator_object != undefined){
			const instance = this.object_instances.createInstance(generator_object.name!);
			if(instance != undefined){
				this.dragged_object = instance.getId();
				instance.freeform_placement = point;
			}
		}
	}
	onMouseUp(point: Point2D){
		this.controls.onMouseUp(point);
		this.battle_object_generators.onMouseUp(point);

		if(this.dragged_object != undefined){
			const instance = this.object_instances.getInstance(this.dragged_object);
			this.battle_object_generators.getHoveredObject()
			if(instance != undefined){
				instance.freeform_placement = undefined;

				//add dragged object to grid if can
				if(this.battle_grid_true_coord != undefined){
					const coord = this.getInstanceGridCoord(this.battle_grid_true_coord, instance);
					this.battle_grid.addObjectToGrid(coord.x, coord.y, instance);
				}else if(this.object_bin.isInside(this.global_mouse)){
					//check if on bin then delete instance
					console.log("bin it");
					instance.unlinkOwner();
					this.object_instances.delete(instance);
				}else{
					//reset item to it's last grid location
					console.log("reset");
					console.log(instance.placement_history);
					const last = instance.getLastPlacement();
					if(last != undefined){
						this.battle_grid.addObjectToGrid(last.x, last.y, instance);
					}else{
						//remove as no placement
						console.log("remove");
						instance.unlinkOwner();
						this.object_instances.delete(instance);
					}
				}
			}

			this.dragged_object = undefined;
		}
	}

	getInstanceGridCoord(true_coord: WebGL.Geometry.Base.Point2D, object: BObject.BattleObjectInstance): WebGL.Grid.Generic.Coordinate{
		const x = true_coord.x - (object.width*0.5);
		const y = true_coord.y - (object.height*0.5);
		return {x: Math.round(x), y: Math.round(y)};
	}

	resetEnemy(){
		this.state = BattleStateEnum.Setup;
		this.enemy.reset();
	}

	checkEnemy(): boolean{
		if(this.enemy.isDefeated()){
			this.kills+=1;
			this.resetEnemy();
			return true;
		}
		return false;
	}
	
	update(dt: Float){
		if(this.state == BattleStateEnum.Battle){

			this.player.forEachObject((inst) => {
				inst.update(dt, this.player, this.enemy);
				if(this.checkEnemy()){
					return;
				}
			}, this.object_instances);
		}

		this.battle_grid.update(dt); // does nothing currently
	}
}