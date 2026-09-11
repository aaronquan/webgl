import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";

type Float = number;
type Int32 = number;

const ObjectTypeEnum = {
	Weapon: 0,
	Accessory: 1
} as const;

type ObjectType = (typeof ObjectTypeEnum)[keyof typeof ObjectTypeEnum];

class BattleObject extends Shape.GridShapeInstance{
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
	trigger(){
		console.log(this.name);
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
	trigger(){
		
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

export class BattleObjects{
	static objects = BattleObjects.generateObjects();

	static generateObjects(): Map<string, BattleObject>{
		const m = new Map();
		m.set("WoodenSword", new WoodenSword());
		m.set("Stone", new Stone());
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