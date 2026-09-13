import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";
import * as Character from "./character";
import * as GridBattle from "./grid_battle";

type Float = number;
type Int32 = number;

const ObjectTypeEnum = {
	Weapon: 0,
	Accessory: 1
} as const;

type ObjectType = (typeof ObjectTypeEnum)[keyof typeof ObjectTypeEnum];

export class BattleObject extends Shape.GridShapeInstance{
	name: string;
	cooldown: Float;
	object_type: ObjectType;
	static object_shapes = BattleObject.generateBattleObjectShapes();


	colour: string; // to override with a sprite name
	constructor(shape: Shape.GridShape, name: string, cd: Float, ot: ObjectType, colour: string){
		super(shape);
		this.name = name;
		this.cooldown = cd;
		this.object_type = ot;
		this.colour = colour;
	}

	static generateBattleObjectShapes(): Shape.GridShape[]{
		const shapes = [];
		shapes.push(new Shape.GridShape(1, 1, [true]));
		shapes.push(new Shape.GridShape(2, 1, [true, true]));
		shapes.push(new Shape.GridShape(3, 1, [true, true, true]));
		return shapes;
	}

	//to override
	trigger(user: Character.Character, target: Character.Character){
		console.log(this.name);
	}
}

class HealingObject extends BattleObject{
	heal_amount: Int32;
	constructor(shape: Shape.GridShape, name: string, cd: Float, ha: Int32, colour: string){
		super(shape, name, cd, ObjectTypeEnum.Accessory, colour);
		this.heal_amount = ha;
	}
	trigger(user: Character.Character, target: Character.Character){
		user.heal(this.heal_amount);
	}
}

class WeaponObject extends BattleObject{
	damage_low: Int32;
	damage_hi: Int32;
	constructor(shape: Shape.GridShape, name: string, cd: Float, dl: Int32, dh: Int32, colour: string){
		super(shape, name, cd, ObjectTypeEnum.Weapon, colour);
		this.damage_low = dl;
		this.damage_hi = dh;
	}
	private calcRandomDamage(): Int32{
		const rand = Math.floor(Math.random()*(this.damage_hi-this.damage_low+1));
		return rand + this.damage_low;
	}
	trigger(user: Character.Character, target: Character.Character){
		const damage = this.calcRandomDamage();
		target.takeDamage(damage);
		//target.current_health -= damage;
	}
}

export class WoodenSword extends WeaponObject{
	constructor(){
		super(BattleObject.object_shapes[1], "WoodenSword", 1000, 1, 2, "yellow");

	}
}

export class Stone extends WeaponObject{
	constructor(){
		super(BattleObject.object_shapes[0], "Stone", 2000, 2, 4, "white");
	}
}

export class BandAid extends HealingObject{
	constructor(){
		super(BattleObject.object_shapes[0], "Bandaid", 3000, 2, "red");
	}
}

export class BattleObjects{
	static objects = BattleObjects.generateObjects();

	static generateObjects(): Map<string, BattleObject>{
		const m = new Map();
		m.set("WoodenSword", new WoodenSword());
		m.set("Stone", new Stone());
		m.set("Bandaid", new BandAid());
		return m;
	}
}

export class BattleObjectInstance{
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
	update(dt: Float, user: Character.Character, target: Character.Character){
		this.cooldown_timer += dt;
		if(this.cooldown_timer >= this.battle_object.cooldown){
			this.battle_object.trigger(user, target);
			this.num_triggers++;
			this.cooldown_timer -= this.battle_object.cooldown;
		}
	}
	getId(): Int32{
		return this.id;
	}
	draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram,
		grid: GridBattle.BattleGrid, colour_collection: WebGL.Colour.ColourRGBCollection
	){
		const cs = grid.interface.cell_size;
		const colour = colour_collection.getColour(this.battle_object.colour)!;
		colour_shader.use();
		if(this.freeform_placement != undefined){
			for(const c of this.battle_object.getCoordinates()){
				const cx = this.freeform_placement.x + c.x*cs - this.battle_object.width*cs*0.5;
				const cy = this.freeform_placement.y + c.y*cs - this.battle_object.height*cs*0.5;
				WebGL.WebGL.drawColourRect(vp, colour_shader, cx, cy, cs, cs, colour);
			}
		}
		else if(this.battle_object.grid_placement != undefined){
			const x = grid.interface.x;
			const y = grid.interface.y;
			if(colour != undefined){
				for(const c of this.battle_object.getGridPlacementCoordinates()){
					const cx = x + c.x*cs;
					const cy = y + c.y*cs;
					WebGL.WebGL.drawColourRect(vp, colour_shader, cx, cy, cs, cs, colour);
				}
			}
		}
	}
}

export class BattleObjectInstanceCollection{
	objects: Map<Int32, BattleObjectInstance>;
	constructor(){
		this.objects = new Map();
	}
	createInstance(object_key: string): BattleObjectInstance | undefined{
		const battle_object = BattleObjects.objects.get(object_key);
		if(battle_object != undefined){
			const instance = new BattleObjectInstance(battle_object);
			this.objects.set(instance.getId(), instance);
			return instance;
		}
		return undefined;
	}
	addObjectInstance(inst: BattleObjectInstance){
		this.objects.set(inst.getId(), inst);
	}
	getInstance(id: Int32): BattleObjectInstance | undefined{
		return this.objects.get(id);
	}
	forAll(fn: (inst: BattleObjectInstance, i: Int32) => void){
		for(const [i, inst] of this.objects){
			fn(inst, i);
		}
	}
}