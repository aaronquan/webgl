import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";
import * as Character from "./character";
import * as BattleGrid from "./battle_grid";

import TransformAnimator2D = WebGL.Animator.TransformAnimator2D;
import TransformSequenceAnimator2D = WebGL.Animator.TransformSequenceAnimator2D;

type Float = number;
type Int32 = number;

const ObjectTypeEnum = {
	Weapon: 0,
	Accessory: 1,
	Apparel: 2
} as const;

type ObjectType = (typeof ObjectTypeEnum)[keyof typeof ObjectTypeEnum];

const TriggerTypeEnum = {
	Start: 0,
	Health: 1,
	Cooldown: 2
} as const;

type TriggerType = (typeof TriggerTypeEnum)[keyof typeof TriggerTypeEnum];

const ConditionalTypeEnum = {
	Buff: 0,
	UserHealth: 1,
} as const;

type ConditionalType = (typeof ConditionalTypeEnum)[keyof typeof ConditionalTypeEnum];

type TriggerCondition = {
	trigger_type: TriggerType;
	cooldown: Float | undefined;
	//current_cooldown: Float;
	health_percent: Float | undefined;
	health_amount: Float | undefined;
	trigger_limit: Int32 | undefined;
	//current_limit: Int32;
}

function cooldownCondition(cd: Float): TriggerCondition{
	return {
		trigger_type: TriggerTypeEnum.Cooldown,
		cooldown: cd,
		//current_cooldown: 0,
		//current_limit: 0,
		health_percent: undefined,
		health_amount: undefined,
		trigger_limit: undefined,
	}
}

const ObjectActionTypeEnum = {
	Attack: 0,
	UserBuff: 1,
	TargetBuff: 2,
	Heal: 3
} as const;

type ObjectActionType = (typeof ObjectActionTypeEnum)[keyof typeof ObjectActionTypeEnum];

type ObjectAction = {
	action_type: ObjectActionType,
	low_value: Int32,
	high_value: Int32,
	base_accuracy: Float,
	buff: Character.BattleBuff | undefined//uses low_value-high_value for amount
	//buff_amount: Int32 | undefined
}

type TriggerAction = {
	//trigger_type: TriggerType,
	condition: TriggerCondition,
	actions: ObjectAction[]
}

type ActionInstance = {
	trigger_action: TriggerAction,
	current_cooldown: Float,
	triggers: Int32
}

export class BattleObject{
	name: string;
	cooldown: Float;
	object_type: ObjectType;
	shape: Shape.GridShape;
	user_buff_change: Character.BuffChange[];
	target_buff_change: Character.BuffChange[];
	trigger_actions: TriggerAction[];
	static object_shapes = BattleObject.generateBattleObjectShapes();


	colour: string; // to override with a sprite name
	constructor(shape: Shape.GridShape, name: string, cd: Float, ot: ObjectType, colour: string){
		this.shape = shape;
		this.name = name;
		this.cooldown = cd;
		this.object_type = ot;
		this.colour = colour;
		this.user_buff_change = [];
		this.target_buff_change = [];
		this.trigger_actions = []; // test this with wood sword
	}

	static startOfBattleCondition(): TriggerCondition{
		return {
			trigger_type: TriggerTypeEnum.Start,
			cooldown: undefined,
			health_percent: undefined,
			health_amount: undefined,
			trigger_limit: 1,
		}
	}

	static cooldownCondition(cd: Float, limit: Int32 | undefined=undefined): TriggerCondition{
		return {
			trigger_type: TriggerTypeEnum.Cooldown,
			cooldown: cd,
			health_percent: undefined,
			health_amount: undefined,
			trigger_limit: limit,
		}
	}

	static weaponAction(lo: Int32, hi: Int32, acc: Float): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.Attack,
			low_value: lo,
			high_value: hi,
			base_accuracy: acc,
			buff: undefined
		}
	}

	static buffAction(buff: Character.BattleBuff, value: Int32): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.UserBuff,
			low_value: value,
			high_value: value,
			base_accuracy: 100,
			buff
		}
	}

	//moved to instance
	/*
	testCondition(condition: TriggerCondition): boolean{
		if(condition.limit != undefined && condition.limit >= condition.current_limit){
			return false;
		}
		switch(condition.trigger_type){
			case TriggerTypeEnum.Cooldown:
				if(condition.cooldown == undefined){
					console.log("exception: cooldown not assigned");
					return false;
				}
				if(condition.current_cooldown >= condition.cooldown){
					condition.current_cooldown -= condition.cooldown;
					condition.current_limit++;
					return true;
				}
				break;
			case TriggerTypeEnum.Start:
				if(condition.current_cooldown == 0){
					condition.current_limit++;
					//condition.current_cooldown++;
				}
				break;
		}

		return false;
	}*/
	protected calcRandomDamage(low: Int32, hi: Int32): Int32{
		const rand = Math.floor(Math.random()*(hi-low+1));
		return rand + low;
	}

	runAction(action: ObjectAction, user: Character.BattleCharacter, target: Character.BattleCharacter){
		switch(action.action_type){
			case ObjectActionTypeEnum.Attack:
				const rand_damage = this.calcRandomDamage(action.low_value, action.high_value);
				target.takeDamage(rand_damage);
				console.log(`target damaged: ${rand_damage}`);
				break;
			case ObjectActionTypeEnum.Heal:
				user.heal(action.low_value);
				console.log(`user healed ${action.low_value}`);
				break;
		}
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
	trigger(user: Character.BattleCharacter, target: Character.BattleCharacter){
		//
		user.buffs.applyBuffChange(this.user_buff_change);
		target.buffs.applyBuffChange(this.target_buff_change);
		console.log(this.name);

	}
}

class HealingObject extends BattleObject{
	heal_amount: Int32;
	constructor(shape: Shape.GridShape, name: string, cd: Float, ha: Int32, colour: string){
		super(shape, name, cd, ObjectTypeEnum.Accessory, colour);
		this.heal_amount = ha;
	}
	trigger(user: Character.BattleCharacter, target: Character.BattleCharacter){
		super.trigger(user, target);
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
	/*
	private calcRandomDamage(): Int32{
		const rand = Math.floor(Math.random()*(this.damage_hi-this.damage_low+1));
		return rand + this.damage_low;
	}*/
	trigger(user: Character.BattleCharacter, target: Character.BattleCharacter){
		super.trigger(user, target);
		const damage = this.calcRandomDamage(this.damage_low, this.damage_hi);
		target.takeDamage(damage);
		//target.current_health -= damage;
	}
}

export class WoodenSword extends WeaponObject{
	static name = "WoodenSword";
	constructor(){
		super(BattleObject.object_shapes[1], WoodenSword.name, 1000, 1, 2, "yellow");
		const attack: TriggerAction = {
			condition: cooldownCondition(1500),
			actions: [BattleObject.weaponAction(2, 3, 100)]
		}
		this.trigger_actions.push(attack);
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
		this.user_buff_change.push({buff: Character.BattleBuffEnum.Regen, amount: 1});
	}
}

export class Hook extends WeaponObject{
	static name = "Hook";
	constructor(){
		super(BattleObject.object_shapes[3], Hook.name, 2500, 4, 7, "blue");
	}
}

export class MagicWand extends WeaponObject{
	static name = "MagicWand";
	constructor(){
		super(BattleObject.object_shapes[1], MagicWand.name, 1800, 3,5, "pink");
	}
}

export class HealingPack extends HealingObject{
	static name = "HealingPack";
	constructor(){
		super(BattleObject.object_shapes[1], HealingPack.name, 1000, 1, "green");
		const start_action: TriggerAction = {
			condition: BattleObject.startOfBattleCondition(),
			actions: [
				{
					action_type: ObjectActionTypeEnum.UserBuff,
					low_value: 1,
					high_value: 1,
					base_accuracy: 100,
					buff: Character.BattleBuffEnum.Regen
				}
			]
		}
		this.trigger_actions.push(start_action);
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

	action_instances: ActionInstance[];

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

		this.action_instances = this.battle_object.trigger_actions.map((act) => {
			return {trigger_action: act, current_cooldown: 0, triggers: 0};
		});
		
	}

	reset(){
		this.cooldown_timer = 0;
		this.transform_animator.reset();
		this.transform_animator.pause();
		console.log("reseting object");
	}
	setOwner(char: Character.BattleCharacter){
		this.owner = char;
		char.addObject(this);
	}
	unlinkOwner(){
		this.owner?.removeObject(this);
		this.owner = undefined;
	}
	testActionInstanceCondition(act_inst: ActionInstance, dt: Float=0): boolean{
		const condition = act_inst.trigger_action.condition;
		act_inst.current_cooldown += dt;
		switch(condition.trigger_type){
			case TriggerTypeEnum.Start:
				if(act_inst.triggers >= 1){
					return false;
				}
				act_inst.triggers++;
				return true;
			case TriggerTypeEnum.Cooldown:
				if(condition.cooldown == undefined){
					console.log("cooldown trigger has no cooldown");
					return false;
				}
				act_inst.current_cooldown += dt;
				if(act_inst.current_cooldown >= condition.cooldown){
					if(condition.trigger_limit != undefined && act_inst.triggers > condition.trigger_limit){
						console.log("above trigger limit");
						return false;
					}else{
						act_inst.triggers++;
						return true;
					}
				}
				break;
			case TriggerTypeEnum.Health:
				//todo
				break;
		}

		return false;
	}
	runAction(action: ObjectAction, user: Character.BattleCharacter, targets: Character.BattleCharacter[]){
		//todo
	}
	runActionsWithoutTime(){
		this.runActionsWithTime(0);
		//this.battle_object.testCondition()
	}
	runActionsWithTime(dt: Float){
		if(this.owner == undefined){
			return undefined;
		}
		for(const effect of this.action_instances){
			const condition = this.testActionInstanceCondition(effect, dt);
			if(condition){
				//run effects
				for(const action of effect.trigger_action.actions){
					const targets = [];
					if(this.owner.target != undefined){
						targets.push(this.owner.target);
					}
					this.runAction(action, this.owner, targets);
				}
			}
		}
	}
	startOfBattle(){
		this.runActionsWithoutTime();
	}
	update(dt: Float, user: Character.BattleCharacter, target: Character.BattleCharacter){
		if(!this.isPlaced()){
			return;
		}
		const fin = this.transform_animator.update(dt);
		if(fin){
			this.transform_animator.reset();
			this.transform_animator.pause();
		}
		for(const effect of this.action_instances){
			const condition = this.testActionInstanceCondition(effect, dt);
			if(condition){

			}
		}
		//Testing other trigger
		/*
		this.cooldown_timer += dt;
		if(this.cooldown_timer >= this.battle_object.cooldown){
			this.battle_object.trigger(user, target);
			console.log("triggering "+this.id.toString());
			this.transform_animator.reset();
			this.transform_animator.play();
			this.num_triggers++;
			this.cooldown_timer -= this.battle_object.cooldown;
		}
		*/
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
		colour_collection: WebGL.Colour.ColourRGBCollection
	){
		//const grid = this.owner?.getGrid();
		//const cs = grid != undefined ? grid.interface.cell_size : 15;
		const colour = colour_collection.getColour(this.battle_object.colour)!;
		colour_shader.use();
		colour_shader.setColourFromColourRGB(colour);
		if(this.freeform_placement != undefined){
			const cs = 15;
			for(const c of this.getCoordinates()){
				const cx = this.freeform_placement.x + c.x*cs - this.width*cs*0.5;
				const cy = this.freeform_placement.y + c.y*cs - this.height*cs*0.5;
				WebGL.WebGL.drawColourRect(vp, colour_shader, cx, cy, cs, cs, colour);
			}
		}
		else if(this.grid_placement != undefined){
			const grid = this.owner!.getGrid();
			const cs = grid.interface.cell_size;
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
	//takes object key
	addObjectFromString(str: string): BattleObjectInstance | undefined{
		if(!BattleObjects.objects.has(str)){
			return undefined;
		}
		const inst = new BattleObjectInstance(BattleObjects.objects.get(str)!);
		this.addObjectInstance(inst);
		return inst;
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