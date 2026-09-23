import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";
import * as Character from "./character";
import * as GridBattle from "./grid_battle";

import TransformAnimator2D = WebGL.Animator.TransformAnimator2D;
import TransformSequenceAnimator2D = WebGL.Animator.TransformSequenceAnimator2D;

type Float = number;
type Int32 = number;

const ObjectTypeEnum = {
	Weapon: 0,
	Accessory: 1
} as const;

type ObjectType = (typeof ObjectTypeEnum)[keyof typeof ObjectTypeEnum];

export class BattleObject{
	name: string;
	cooldown: Float;
	object_type: ObjectType;
	shape: Shape.GridShape;
	static object_shapes = BattleObject.generateBattleObjectShapes();


	colour: string; // to override with a sprite name
	constructor(shape: Shape.GridShape, name: string, cd: Float, ot: ObjectType, colour: string){
		this.shape = shape;
		this.name = name;
		this.cooldown = cd;
		this.object_type = ot;
		this.colour = colour;
	}

	getCoordinates(): WebGL.Grid.Generic.Coordinate[]{
		return this.shape.getCoordinates();
	}

	getShapeWidth(): Int32{
		return this.shape.getWidth();
	}

	getShapeHeight(): Int32{
		return this.shape.getHeight();
	}

	static generateBattleObjectShapes(): Shape.GridShape[]{
		const shapes = [];
		shapes.push(new Shape.GridShape(1, 1, [true]));
		shapes.push(new Shape.GridShape(2, 1, [true, true]));
		shapes.push(new Shape.GridShape(3, 1, [true, true, true]));
		shapes.push(new Shape.GridShape(2, 2, [true, false, true, true]));
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
	static name = "WoodenSword";
	constructor(){
		super(BattleObject.object_shapes[1], WoodenSword.name, 1000, 1, 2, "yellow");

	}
}

export class Stone extends WeaponObject{
	static name = "Stone";
	constructor(){
		super(BattleObject.object_shapes[0], Stone.name, 2000, 2, 4, "white");
	}
}

export class BandAid extends HealingObject{
	static name = "Bandaid";
	constructor(){
		super(BattleObject.object_shapes[0], BandAid.name, 3000, 2, "red");
	}
}

export class Hook extends WeaponObject{
	static name = "Hook";
	constructor(){
		super(BattleObject.object_shapes[3], Hook.name, 2000, 3, 5, "blue");
	}
}

export class BattleObjects{
	static objects = BattleObjects.generateObjects();

	static generateObjects(): Map<string, BattleObject>{
		const m = new Map();
		m.set(WoodenSword.name, new WoodenSword());
		m.set(Stone.name, new Stone());
		m.set(BandAid.name, new BandAid());
		m.set(Hook.name, new Hook());
		return m;
	}
}

export class BattleObjectInstance extends Shape.GridShapeInstance{
	static current_id = 0;
	id: Int32;
	battle_object: BattleObject;
	freeform_placement: WebGL.Geometry.Base.Point2D | undefined;
	cooldown_timer: Float;
	num_triggers: Int32;
	placement_history: WebGL.Grid.Generic.Coordinate[];
	owner: Character.BattleCharacter | undefined;

	transform_animator: TransformSequenceAnimator2D;
	constructor(bo: BattleObject){
		super(bo.shape);
		this.id = BattleObjectInstance.current_id;
		BattleObjectInstance.current_id++;
		this.battle_object = bo;
		this.cooldown_timer = 0;
		this.num_triggers = 0;
		this.placement_history = [];

		this.transform_animator = new TransformSequenceAnimator2D();
		//add animations for trigger
		const m1 = WebGL.Matrix.TransformationMatrix3x3.identity();
		const m2 = WebGL.Matrix.TransformationMatrix3x3.scale(2, 2);
		const trigger_animator_start = new WebGL.Animator.LinearTransformAnimator(m1, m2, 200);
		const trigger_animator_end = new WebGL.Animator.LinearTransformAnimator(m2, m1, 200);
		this.transform_animator.addTranformation("trigger_start", trigger_animator_start);
		this.transform_animator.addTranformation("trigger_end", trigger_animator_end);
		this.transform_animator.setAnimation("trigger_start");
		this.transform_animator.addSequence("trigger_start");
		this.transform_animator.addSequence("trigger_end");
		//this.transform_animator.setAnimation("trigger_end");
		this.transform_animator.play();
		
	}
	setOwner(char: Character.BattleCharacter){
		this.owner = char;
		char.addObject(this);
	}
	unlinkOwner(){
		this.owner?.removeObject(this);
		this.owner = undefined;
	}
	update(dt: Float, user: Character.Character, target: Character.Character){
		if(!this.isPlaced()){
			return;
		}
		this.transform_animator.update(dt);
		this.cooldown_timer += dt;
		if(this.cooldown_timer >= this.battle_object.cooldown){
			this.battle_object.trigger(user, target);
			this.num_triggers++;
			this.cooldown_timer -= this.battle_object.cooldown;
		}
	}
	setPlacement(x: number, y: number){
		super.setPlacement(x, y);
		const last = this.placement_history.at(-1);
		//console.log("placing at x"+x.toString());
		if(last != undefined && last.x != x && last.y != y){
			//this.placement_history.push()
		}else{
			this.placement_history.push({x, y});
		}
	}
	getLastPlacement(): WebGL.Grid.Generic.Coordinate | undefined{
		return this.placement_history.at(-1);
	}
	useLastPlacement(): boolean{
		const last = this.placement_history.at(-1);
		if(last != undefined){
			this.setPlacement(last.x, last.y);
			return true;
		}
		return false;
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
		colour_shader.setColourFromColourRGB(colour);
		if(this.freeform_placement != undefined){
			for(const c of this.getCoordinates()){
				const cx = this.freeform_placement.x + c.x*cs - this.width*cs*0.5;
				const cy = this.freeform_placement.y + c.y*cs - this.height*cs*0.5;
				WebGL.WebGL.drawColourRect(vp, colour_shader, cx, cy, cs, cs, colour);
			}
		}
		else if(this.grid_placement != undefined){
			const x = grid.interface.x;
			const y = grid.interface.y;
			const hcs = cs*0.5;
			if(colour != undefined){
				for(const c of this.getGridPlacementCoordinates()){
					const cx = x + c.x*cs + hcs;
					const cy = y + c.y*cs + hcs;
					//WebGL.WebGL.drawColourRect(vp, colour_shader, cx, cy, cs, cs, colour);
					const model = WebGL.WebGL.rectangleModel(cx, cy, cs, cs);
					const transformation = this.transform_animator.getMatrix();
					const draw_model = model.multiplyCopy(transformation);

					colour_shader.setMvp(vp.multiplyCopy(draw_model));

					WebGL.Shapes.CenterQuad.draw();
				}
			}
		}
	}
}

export class BattleObjectInstanceCollection{
	private objects: Map<Int32, BattleObjectInstance>;
	constructor(){
		this.objects = new Map();
	}
	delete(instance: BattleObjectInstance){
		this.objects.delete(instance.getId());
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