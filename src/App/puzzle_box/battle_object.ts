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
	constructor(shape: Shape.GridShape, name: string, cd: Float, ot: ObjectType){
		super(shape);
		this.name = name;
		this.cooldown = cd;
		this.object_type = ot;
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
	constructor(shape: Shape.GridShape, name: string, cd: Float, dl: Int32, dh: Int32){
		super(shape, name, cd, ObjectTypeEnum.Weapon);
		this.damage_low = dl;
		this.damage_hi = dh;
	}
	trigger(){
		
	}
}

export class WoodenSword extends WeaponObject{
	constructor(){
		super(BattleObject.object_shapes[0], "WoodenSword", 1000, 1, 2);

	}
}

//export class Battle

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