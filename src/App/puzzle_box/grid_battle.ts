import * as WebGL from "./../../WebGL/globals";
//import * as Engine from "./engine";
//import * as Shape from "./shape";
import * as BObject from "./battle_object";
import * as Character from "./character";
import * as BattleGrid from "./battle_grid";

type Float = number;
type Int32 = number;

import Point2D = WebGL.Geometry.Base.Point2D;
import Button = WebGL.Interface.Button;

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
			//const cx = x + this.obj_interface_size*0.5;
			//const cy = this.y + this.obj_interface_size*0.5;
			const pw = this.objs[i].getShapeWidth()*this.cell_size;
			const ph = this.objs[i].getShapeHeight()*this.cell_size;
			const colour = colour_collection.getColour(this.objs[i].colour);
			if(colour != undefined){
				const coords = this.objs[i].getCoordinates();
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
			//if(colour != undefined){
			//	WebGL.WebGL.drawColourRect(vp, colour_shader, cx-pw*0.5, cy-ph*0.5, pw, ph, colour);
			//}
			x += this.obj_interface_size;
		}
	}
}


//space for objects
class DumpZone extends WebGL.Interface.InterfaceElement.InterfaceElement{
	//
	objects: Int32[]; //ids of battle objects
	//objects exist as a square inside the zone
	//adding objects makes existing objects smaller to compensate
	//prioritise width -> height if equal

	relative_mouse: Point2D;

	object_width: Int32;
	object_height: Int32;
	square_size: Float;

	hovered_index: Int32 | undefined;

	x_offset: Float; // starting object x
	y_offset: Float; // starting object y


	constructor(x: Int32, y: Int32, w: Int32, h: Int32){
		super(x, y, w, h);
		this.objects = [];

		this.relative_mouse = new Point2D();

		this.object_width = 0;
		this.object_height = 0;
		this.square_size = 0;
		this.x_offset = 0;
		this.y_offset = 0;
	}

	addObject(o_id: Int32){
		this.objects.push(o_id);
		this.recalculateObjectDimensions();
	}
	removeObject(o_id: Int32){
		WebGL.Utils.Array.removeFirstValue(this.objects, o_id);
		this.recalculateObjectDimensions();
	}
	recalculateObjectDimensions(){
		const size = this.objects.length;
		//test height = 1 -> size
		const wh_ratio = this.width/this.height;
		let smallest_ratio = 1;
		let sm_width = 0;
		let sm_height = 0;
		for(let h = 1; h <= size; h++){
			const w = Math.ceil(size/h);
			const rat = w/h;
			const rat_diff = Math.abs(wh_ratio-rat);
			if(smallest_ratio > rat_diff){
				sm_width = w;
				sm_height = h;
				smallest_ratio = rat_diff;
			}
		}
		this.object_width = sm_width;
		this.object_height = sm_height;
		if(this.object_width/this.object_height > wh_ratio){
			//object width greater so go by width
			this.square_size = this.width/this.object_width;
			//this.square_size = this.height/this.object_height;
		}else{
			this.square_size = this.height/this.object_height;
		}
		this.x_offset = (this.width - this.square_size*this.object_width)*0.5;
		this.y_offset = (this.height - this.square_size*this.object_height)*0.5;

		this.updateHoveredIndex(this.relative_mouse);
	}

	updateHoveredIndex(rel_pt: Point2D){
		//try and calculate object hover
		const px = rel_pt.x - this.x_offset;
		const py = rel_pt.y - this.y_offset;
		const cx = Math.floor(px/this.square_size);
		const cy = Math.floor(py/this.square_size);
		const index = cy*this.object_width+cx;
		if(index >= 0 || index < this.objects.length){
			this.hovered_index = index;
		}else{
			this.hovered_index = undefined;
		}
	}

	onMouseOver(pt: Point2D){
		if(this.isInside(pt)){
			const relative_point = new Point2D(pt.x-this.x, pt.y-this.y);
			this.relative_mouse = relative_point;
			//calculate object hover
			this.updateHoveredIndex(relative_point);
		}else{
			this.hovered_index = undefined;
		}
	}

	onMouseDown(pt: Point2D){

	}
	onMouseUp(pt: Point2D){

	}

	getDraggedObjectId(): Int32 | undefined{
		if(this.hovered_index != undefined){
			return this.objects[this.hovered_index];
		}
		return undefined;
	}

	draw(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram,
		object_instances: BObject.BattleObjectInstanceCollection,
		colours: WebGL.Colour.ColourRGBCollection
	){
		const inner_border = 3;
		//background first
		super.drawBackground(vp, colour_shader, WebGL.Colour.ColourUtils.grey());
		//draw squares
		//const ox = (this.width - this.square_size*this.object_width)*0.5;
		//const oy = (this.height - this.square_size*this.object_height)*0.5;
		let x = 0;
		let y = 0;
		for(let i = 0; i < this.objects.length; i++){
			const bg_colour = i == this.hovered_index ? WebGL.Colour.ColourUtils.red() : WebGL.Colour.ColourUtils.cyan();
			const sx = this.x+this.x_offset+x*this.square_size;
			const sy = this.y+this.y_offset+y*this.square_size;
			//background
			WebGL.WebGL.drawColourRect(vp, colour_shader, 
				sx, sy, 
				this.square_size, this.square_size, 
				bg_colour
			);

			const instance = object_instances.getInstance(this.objects[i]);
			if(instance != undefined){
				const sub_square_size = (this.square_size-inner_border-inner_border)/Math.max(instance.width, instance.height);
				//console.log(sub_square_size);a
				const coords = instance.getCoordinates();
				const inst_colour = colours.getColour(instance.battle_object.colour)!;
				const ox = (this.square_size - instance.width*sub_square_size)*0.5;
				const oy = (this.square_size - instance.height*sub_square_size)*0.5;
				
				for(const c of coords){
					WebGL.WebGL.drawColourRect(vp, colour_shader, 
						sx+ox+c.x*sub_square_size, sy+oy+c.y*sub_square_size,
						sub_square_size, sub_square_size,
						inst_colour
					);
				}
			}

			x++;
			if(x == this.object_width){
				x = 0;
				y++;
			}
		}

	}

}


export class CharacterBuffInterface extends WebGL.Interface.InterfaceElement.InterfaceElement{
	character_buffs: Character.BattleBuffCollection;

	constructor(x: Int32, y: Int32, width: Int32, height: Int32, buffs: Character.BattleBuffCollection){
		super(x, y, width, height);
		this.character_buffs = buffs;
	}
	draw(vp: WebGL.Matrix.TransformationMatrix3x3, 
		colour_shader: WebGL.Shader.MVPColourProgram,
		text_drawer: WebGL.TextDrawer
	){
		//background
		//
		this.drawBackground(vp, colour_shader, WebGL.Colour.ColourUtils.white());

		//buffs values
		let x = this.x;
		for(const [id, value] of this.character_buffs.buffs){
			//todo: use icons for buffs
			const char = Character.BattleBuffCollection.buffToChar(id);
			const text = `${char} ${value.toString()}`;
			const tsize = 12;
			const text_width = text_drawer.getTextWidth(text, tsize);
			text_drawer.drawText(vp, x, this.y, text, tsize);
			//exchange with x inc
			x += text_width;
		}
	}
}

export class BattleEngine{
	//battle_grid: BattleGrid;
	battle_grid_coord: WebGL.Grid.Generic.Coordinate | undefined;
	battle_grid_true_coord: WebGL.Geometry.Base.Point2D | undefined;

	//battle object
	//shapes: Shape.GridShape[]; // shapes are now included inside instances

	battle_object_generators: BattleObjectInstanceGenerator;
	object_instances: BObject.BattleObjectInstanceCollection;
	dragged_object: Int32 | undefined;

	global_mouse: Point2D;

	object_bin: WebGL.Interface.InterfaceElement.InterfaceElement;

	player_grid: BattleGrid.BattleGrid;
	player: Character.BattleCharacter;

	player_buff_interface: CharacterBuffInterface;

	enemy_grid: BattleGrid.BattleGrid;
	enemy: Character.BattleCharacter;
	//enemy_grid: BattleGrid; //todo

	kills: Int32;

	state: BattleState;

	controls: BattleEngineControls;

	dump_zone: DumpZone;
	constructor(){
		//this.battle_grid = new BattleGrid(50, 50, 14, 14);
		this.global_mouse = new Point2D(0, 0);

		this.battle_object_generators = new BattleObjectInstanceGenerator(220, 500);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.WoodenSword.name)!);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.Stone.name)!);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.BandAid.name)!);
		this.battle_object_generators.addObject(BObject.BattleObjects.objects.get(BObject.Hook.name)!);

		this.object_instances = new BObject.BattleObjectInstanceCollection();

		//this.shapes = this.generateObjectShapes();
		this.player_grid = new BattleGrid.BattleGrid(10, 10, 10, 10);
		this.player = new Character.BattleCharacter(10, this.player_grid);

		this.player_buff_interface = new CharacterBuffInterface(10, 400, 400, 80, this.player.buffs); //todo

		this.enemy_grid = new BattleGrid.BattleGrid(720, 10, 10, 10);
		this.enemy = Character.EnemyCharacter.createBaseEnemy(this.enemy_grid, this.object_instances);


		//test player objects
		const ws1 = this.object_instances.createInstance(BObject.WoodenSword.name);
		const st1 = this.object_instances.createInstance(BObject.Stone.name);
		const ba1 = this.object_instances.createInstance(BObject.BandAid.name);
		const st2 = this.object_instances.createInstance(BObject.Stone.name);
		if(ws1 != undefined){
			this.player.addObjectToGrid(2, 4, ws1);
			ws1.setOwner(this.player);
		}
		if(st1 != undefined){
			this.player.addObjectToGrid(5, 7, st1);
			st1.setOwner(this.player);
		}
		if(ba1 != undefined){
			this.player.addObjectToGrid(1,2, ba1);
			ba1.setOwner(this.player);
		}
		if(st2 != undefined){
			this.player.addObjectToGrid(8, 8, st2);
			st2.setOwner(this.player);
		}

		this.kills = 0;
		//this.enemy = new Character.BattleCharacter(15, new BattleGrid.BattleGrid(720, 10, 10, 10));
		//const ws2 = this.object_instances.createInstance(BObject.WoodenSword.name)!;
		//this.enemy.addObjectToGrid(1, 1, ws2);

		this.state = BattleStateEnum.Setup;

		const player_interface = this.player.getGridInterface();
		const int_x = player_interface.x+player_interface.interfaceWidth()+10;
		this.controls = new BattleEngineControls(
			int_x, 
			100
		);
		
		this.setControlFunctions();

		this.object_bin = new WebGL.Interface.InterfaceElement.InterfaceElement(int_x, 50, 40, 40);
	
		this.dump_zone = new DumpZone(int_x, 150, 400, 300);
	}

	private setControlFunctions(){
		this.controls.setStartBattleFunction(() => {
			if(this.state == BattleStateEnum.Setup){
				this.state = BattleStateEnum.Battle;
				this.player.setTarget(this.enemy);
				this.enemy.setTarget(this.player);
			}else{
				console.log("Already battling");
			}
		})
	}

	rotateSelected(clockwise: boolean=true){
		if(this.dragged_object != undefined){
			const instance = this.object_instances.getInstance(this.dragged_object)!; // should be known to exist
			if(clockwise){
				instance.rotateClockwise();
			}else{
				instance.rotateAntiClockwise();
			}
		}
	}

	onKeyDown(key: string){
		switch(key){
			case "q":
				console.log(this.object_instances);
				break;
			case "r":
				//rotate selected clockwise
				this.rotateSelected();
				break;
			case "a":
				this.dump_zone.addObject(1);
				break;
		}
	}

	onScrollWheel(ev: WheelEvent){
		if(ev.deltaY > 0){
			this.rotateSelected();
		}else{
			this.rotateSelected(false);
		}
	}
	onMouseMove(point: Point2D){
		this.global_mouse = point;

		const player_grid_interface = this.player.getGrid().interface;
		this.battle_grid_coord = player_grid_interface.getCoord(this.global_mouse);
		this.battle_grid_true_coord = player_grid_interface.trueCoord(this.global_mouse);
		this.dump_zone.onMouseOver(point);
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
		const player_grid = this.player.getGrid();
		//pick up objects from grid
		if(this.battle_grid_coord != undefined){
			const id = player_grid.getShapeIdFromCoord(this.battle_grid_coord);
			if(id != undefined){
				const instance = this.object_instances.getInstance(id);
				if(instance != undefined){
					player_grid.shape_grid.removeShape(instance);
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

		const dump_id = this.dump_zone.getDraggedObjectId();
		if(dump_id != undefined){
			this.dragged_object = dump_id;
			this.dump_zone.removeObject(dump_id);
		}
	}
	onMouseUp(point: Point2D){
		this.controls.onMouseUp(point);
		this.battle_object_generators.onMouseUp(point);
		//place objects
		if(this.dragged_object != undefined){
			const instance = this.object_instances.getInstance(this.dragged_object);
			this.battle_object_generators.getHoveredObject()
			if(instance != undefined){
				instance.freeform_placement = undefined;

				//add dragged object to grid if can
				if(this.battle_grid_true_coord != undefined){
					const coord = this.getInstanceGridCoord(this.battle_grid_true_coord, instance);
					const added_object = this.player.addObjectToGrid(coord.x, coord.y, instance);
					if(!added_object){
						//object is not added
						this.dump_zone.addObject(instance.getId());
						console.log("object dumped");
					}
				}else if(this.object_bin.isInside(this.global_mouse)){
					//check if on bin then delete instance
					console.log("bin it");
					instance.unlinkOwner();
					this.object_instances.delete(instance);
				}else{
					this.dump_zone.addObject(instance.getId());

					/*
					//reset item to it's last grid location
					console.log("reset");
					console.log(instance.placement_history);
					const last = instance.getLastPlacement();
					if(last != undefined){
						this.battle_grid.addObjectToGrid(last.x, last.y, instance);
					}else{
						//place in the dump zone
						this.dump_zone.addObject(instance.getId());
						//remove as no placement or pu
						console.log("dump");
						//instance.unlinkOwner();
						//this.object_instances.delete(instance);
					}*/
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
		this.player.resetObjects(this.object_instances);
		this.enemy.resetObjects(this.object_instances);
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
			/*
			let reset = false;
			this.player.forEachObject((inst) => {
				inst.update(dt, this.player, this.enemy);
				if(this.checkEnemy()){
					reset = true;
					//return; // this return does not exit for each
				}
			}, this.object_instances);
			if(reset){
				console.log("resetting")
				this.resetEnemy();
			}*/
			const killed_target = this.player.update(dt, this.object_instances); // does the object updates
			if(killed_target){
				console.log("resetting");
				this.resetEnemy();
			}
			this.enemy.update(dt, this.object_instances);
		}

	}
}