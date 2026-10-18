import * as WebGL from "./../../WebGL/globals";
import * as Shape from "./shape";
import * as Character from "./character";
import * as BattleGrid from "./battle_grid";
import * as Battle from "./battle";

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

export const TriggerTypeEnum = {
	Start: 0,
	LowerHealthPercent: 1,
	Cooldown: 2,
	BuffReached: 3,
	None: 4
} as const;

type TriggerType = (typeof TriggerTypeEnum)[keyof typeof TriggerTypeEnum];

/*
const ConditionalTypeEnum = {
	Buff: 0,
	UserHealth: 1,
} as const;

type ConditionalType = (typeof ConditionalTypeEnum)[keyof typeof ConditionalTypeEnum];*/

type TriggerCondition = {
	trigger_type: TriggerType;
	//cooldown: Float | undefined;
	//current_cooldown: Float;
	//value_percent: Float | undefined;
	value_amount: Float | undefined; //could be percent
	secondary_value: Float | undefined; // is buff on buffreached
	trigger_limit: Int32 | undefined;

	//current_limit: Int32;
}

/* set inside battleobject
function cooldownCondition(cd: Float): TriggerCondition{
	return {
		trigger_type: TriggerTypeEnum.Cooldown,
		cooldown: cd,
		//current_cooldown: 0,
		//current_limit: 0,
		value_percent: undefined,
		value_amount: undefined,
		trigger_limit: undefined,
	}
}*/

export const ObjectActionTypeEnum = {
	Attack: 0,
	UserBuffAdd: 1,
	TargetBuff: 2,
	UserHeal: 3,
	None: 4,
	UserBuffRemove: 5,
	Modifier: 6
} as const;

export type ObjectActionType = (typeof ObjectActionTypeEnum)[keyof typeof ObjectActionTypeEnum];

export type ObjectAction = {
	action_type: ObjectActionType,
	low_value: Int32,
	high_value: Int32,
	base_accuracy: Float,
	buff: Character.BattleBuff | undefined,//uses low_value-high_value for amount
	//buff_amount: Int32 | undefined
	sub_action: TriggerAction | undefined,
	modifier_string?: string;
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
			//cooldown: undefined,
			//value_percent: undefined,
			value_amount: undefined,
			secondary_value: undefined,
			trigger_limit: 1,
		}
	}

	static cooldownCondition(cd: Float, limit: Int32 | undefined=undefined): TriggerCondition{
		return {
			trigger_type: TriggerTypeEnum.Cooldown,
			//cooldown: cd,
			//value_percent: undefined,
			value_amount: cd,
			secondary_value: undefined,
			trigger_limit: limit,
		}
	}

	static buffReachedCondition(buff: Character.BattleBuff, amount: Int32, limit: Int32 | undefined=undefined): TriggerCondition{
		return {
			trigger_type: TriggerTypeEnum.BuffReached,
			//cooldown: cd,
			//value_percent: undefined,
			value_amount: amount,
			secondary_value: buff,
			trigger_limit: limit,
		}
	}

	static noCondition():TriggerCondition{
		return{
			trigger_type: TriggerTypeEnum.None,
			value_amount: undefined,
			secondary_value: undefined,
			trigger_limit: undefined
		}
	}

	static subActionAction(sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.None,
			low_value: 0,
			high_value: 0,
			base_accuracy: 0,
			buff: undefined,
			sub_action
		}
	}

	static weaponAction(lo: Int32, hi: Int32, acc: Float, sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.Attack,
			low_value: lo,
			high_value: hi,
			base_accuracy: acc,
			buff: undefined,
			sub_action
		}
	}

	static buffAddAction(buff: Character.BattleBuff, value: Int32, sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.UserBuffAdd,
			low_value: value,
			high_value: value,
			base_accuracy: 100,
			buff,
			sub_action
		}
	}

	static buffRemoveAction(buff: Character.BattleBuff, value: Int32, sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return{
			action_type: ObjectActionTypeEnum.UserBuffRemove,
			low_value: value,
			high_value: value,
			base_accuracy: 100,
			buff,
			sub_action
		}
	}

	static healAction(lo: Int32, hi: Int32=lo, sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.UserHeal,
			low_value: lo,
			high_value: hi,
			base_accuracy: 100,
			buff: undefined,
			sub_action
		}
	}

	static modifierAction(modifier_string: string, value: Int32, sub_action: TriggerAction | undefined=undefined): ObjectAction{
		return {
			action_type: ObjectActionTypeEnum.Modifier,
			low_value: value,
			high_value: value,
			base_accuracy: 100,
			buff: undefined,
			modifier_string,
			sub_action
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
	/*
	protected calcRandomDamage(low: Int32, hi: Int32): Int32{
		const rand = Math.floor(Math.random()*(hi-low+1));
		return rand + low;
	}*/

	//to override in any weapons
	getDamage(): Int32{
		return 0;
	}
	/*
	runAction(action: ObjectAction, user: Character.BattleCharacter, target: Character.BattleCharacter){
		switch(action.action_type){
			case ObjectActionTypeEnum.Attack:
				const rand_damage = this.calcRandomDamage(action.low_value, action.high_value);
				target.takeDamage(rand_damage);
				console.log(`target damaged: ${rand_damage}`);
				break;
			case ObjectActionTypeEnum.UserHeal:
				user.heal(action.low_value);
				console.log(`user healed ${action.low_value}`);
				break;
		}
		if(action.sub_action != undefined){

		}
	}*/

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
	trigger(user: Character.BattleCharacterInstance, target: Character.BattleCharacterInstance){
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
	trigger(user: Character.BattleCharacterInstance, target: Character.BattleCharacterInstance){
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
	
	protected calcRandomDamage(): Int32{
		const rand = Math.floor(Math.random()*(this.damage_hi-this.damage_low+1));
		return rand + this.damage_low;
	}
	trigger(user: Character.BattleCharacterInstance, target: Character.BattleCharacterInstance){
		super.trigger(user, target);
		//const damage = this.calcRandomDamage(this.damage_low, this.damage_hi);
		//target.takeDamage(damage);
		//target.current_health -= damage;
	}
	override getDamage(): Int32{
		return this.calcRandomDamage();
	}
}

export class WoodenSword extends WeaponObject{
	static name = "WoodenSword";
	constructor(){
		super(BattleObject.object_shapes[1], WoodenSword.name, 1000, 1, 2, "yellow");
		const test_sub = {
			condition: BattleObject.noCondition(),
			actions: [BattleObject.buffAddAction(Character.BattleBuffEnum.Mana, 1)]
		}
		const attack: TriggerAction = {
			condition: BattleObject.cooldownCondition(1500),
			actions: [BattleObject.weaponAction(2, 3, 100, test_sub)]
		}
		this.trigger_actions.push(attack);
	}
}

export class Stone extends WeaponObject{
	static name = "Stone";
	constructor(){
		super(BattleObject.object_shapes[0], Stone.name, 2000, 2, 4, "white");
		const attack: TriggerAction = {
			condition: BattleObject.cooldownCondition(2100),
			actions: [BattleObject.weaponAction(2, 4, 80)]
		}
		this.trigger_actions.push(attack);
	}
}

export class BandAid extends HealingObject{
	static name = "Bandaid";
	constructor(){
		super(BattleObject.object_shapes[0], BandAid.name, 3000, 2, "red");
		const sub = {
			condition: BattleObject.buffReachedCondition(Character.BattleBuffEnum.Regen, 1),
			actions: [BattleObject.healAction(4), BattleObject.buffRemoveAction(Character.BattleBuffEnum.Regen, 1)]
		}
		const heal = {
			condition: BattleObject.cooldownCondition(1800),
			actions: [BattleObject.healAction(1, 1, sub)]
		}
		this.trigger_actions.push(heal);
	}
}

export class Hook extends WeaponObject{
	static name = "Hook";
	constructor(){
		super(BattleObject.object_shapes[3], Hook.name, 2500, 4, 7, "blue");
		const attack = {
			condition: BattleObject.cooldownCondition(2000),
			actions: [BattleObject.weaponAction(4,7, 90), BattleObject.buffAddAction(Character.BattleBuffEnum.Mana, 1)]
		}
		this.trigger_actions.push(attack)
	}
}

export class MagicWand extends WeaponObject{
	static name = "MagicWand";
	constructor(){
		super(BattleObject.object_shapes[1], MagicWand.name, 1800, 3,5, "pink");
		const add_damage = {
			condition: BattleObject.buffReachedCondition(Character.BattleBuffEnum.Mana, 1),
			actions: [BattleObject.modifierAction("low_damage", 1), BattleObject.modifierAction("high_damage", 1)]
		}
		const attack = {
			condition: BattleObject.cooldownCondition(2000),
			//try using mana
			actions: [BattleObject.weaponAction(1,1, 100, add_damage)]
		}
		this.trigger_actions.push(attack);
	}
}

export class HealingPack extends HealingObject{
	static name = "HealingPack";
	constructor(){
		super(BattleObject.object_shapes[1], HealingPack.name, 1000, 1, "green");
		const start_action: TriggerAction = {
			condition: BattleObject.startOfBattleCondition(),
			actions: [
				BattleObject.buffAddAction(Character.BattleBuffEnum.Regen, 2)
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
		m.set(MagicWand.name, new MagicWand());
		m.set(HealingPack.name, new HealingPack());
		return m;
	}
}

type BattleObjectInstanceModifiers = {
	low_damage: Int32,
	high_damage: Int32
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

	modifiers: BattleObjectInstanceModifiers;

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
		
		this.modifiers = {
			low_damage: 0,
			high_damage: 0
		}
	}

	reset(){
		this.cooldown_timer = 0;
		for(const action of this.action_instances){
			action.current_cooldown = 0;
			action.triggers = 0;
		}
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
	testSubActionCondition(condition: TriggerCondition, user: Character.BattleCharacterInstance): boolean{
		switch(condition.trigger_type){
			case TriggerTypeEnum.Cooldown:
				console.log("cooldown should not be a subaction");
				break;
			case TriggerTypeEnum.BuffReached:
				if(condition.secondary_value == undefined){
					return false;
				}
				if(condition.value_amount == undefined){
					return false;
				}
				if(user.hasBuffs(condition.secondary_value as Character.BattleBuff, condition.value_amount)){
					return true;
				}
				break;
			case TriggerTypeEnum.Start:
				break;
			case TriggerTypeEnum.None:
				return true;
		}
		return false;
	}

	testActionInstanceCondition(act_inst: ActionInstance, user: Character.BattleCharacterInstance, dt: Float=0): boolean{
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
				if(condition.value_amount == undefined){
					console.log("cooldown trigger has no cooldown");
					return false;
				}
				//act_inst.current_cooldown += dt;
				if(act_inst.current_cooldown >= condition.value_amount){
					act_inst.current_cooldown -= condition.value_amount;
					
					if(condition.trigger_limit != undefined && act_inst.triggers > condition.trigger_limit){
						console.log("above trigger limit");
						return false;
					}else{
						console.log(`trigger`);
						act_inst.triggers++;
						return true;
					}
				}
				break;
			case TriggerTypeEnum.LowerHealthPercent:
				//todo
				
				break;
			case TriggerTypeEnum.BuffReached:
				if(this.testSubActionCondition(condition, user)){
					act_inst.triggers++;
					return true;
				}
				break;
			case TriggerTypeEnum.None:
				return true;
		}

		return false;
	}
	protected calcRandomValue(low: Int32, hi: Int32): Int32{
		const rand = Math.floor(Math.random()*(hi-low+1));
		return rand + low;
	}

	runAction(action: ObjectAction, user: Character.BattleCharacterInstance, targets: Character.BattleCharacterInstance[],
		battle: Battle.Battle
	){
		switch(action.action_type){
			case ObjectActionTypeEnum.Attack:
				if(targets.length >= 1){
					const target = targets[0];
					//const damage = this.calcRandomValue(action.low_value, action.high_value);
					const damage = this.battle_object.getDamage();
					target.takeDamage(damage);
					battle.addEvent(user, this, action.action_type, damage);
				}
				break;
			case ObjectActionTypeEnum.UserBuffAdd:
				if(action.buff == undefined){
					console.log("object action buff cannot be undefined");
					return;
				}
				const value = action.low_value
				user.addBuff(action.buff, value);
				console.log("adding buff");
				battle.addEvent(user, this, action.action_type, value, undefined, action.buff);
				break;
			case ObjectActionTypeEnum.UserHeal:
				const heal = this.calcRandomValue(action.low_value, action.high_value);
				user.heal(heal);
				battle.addEvent(user, this, action.action_type, heal);
				break;
			case ObjectActionTypeEnum.TargetBuff:
				if(action.buff == undefined){
					console.log("object action buff cannot be undefined");
					return;
				}
				if(targets.length >= 1){
					const target = targets[0];
					const buff_amount = this.calcRandomValue(action.low_value, action.high_value);
					target.addBuff(action.buff, buff_amount);
					battle.addEvent(user, this, action.action_type, buff_amount, target, action.buff);
				}
				break;
			case ObjectActionTypeEnum.UserBuffRemove:
				if(action.buff == undefined){
					console.log("object action buff cannot be undefined");
					return;
				}
				const buff_amount = this.calcRandomValue(action.low_value, action.high_value);
				if(!user.hasBuffs(action.buff, buff_amount)){
					console.log("cannot remove buff action: BUG");
					return;
				}
				user.addBuff(action.buff, -buff_amount);
				battle.addEvent(user, this, action.action_type, buff_amount, undefined, action.buff);
				break;
			case ObjectActionTypeEnum.Modifier:
				if(action.modifier_string != undefined && action.modifier_string in this.modifiers){
					const value = action.low_value;
					this.modifiers[action.modifier_string as keyof BattleObjectInstanceModifiers] += value;
					console.log(`adding modifier ${action.modifier_string}`);
					battle.addEvent(user, this, action.action_type, value);
				}
				break;
		}
		if(action.sub_action != undefined){
			const condition = action.sub_action.condition;
			if(this.testSubActionCondition(condition, user)){
				for(const sub_action of action.sub_action.actions){
					console.log("running sub action");
					this.runAction(sub_action, user, targets, battle);
				}
			}
		}
	}
	runActionsWithoutTime(owner_instance: Character.BattleCharacterInstance, battle: Battle.Battle){
		this.runActionsWithTime(0, owner_instance, battle);
		//this.battle_object.testCondition()
	}
	runActionsWithTime(dt: Float, owner_instance: Character.BattleCharacterInstance, battle: Battle.Battle){
		//console.log("running");
		if(this.owner == undefined){
			return undefined;
		}
		for(const effect of this.action_instances){
			const condition = this.testActionInstanceCondition(effect, owner_instance, dt);
			if(condition){
				//run effects
				for(const action of effect.trigger_action.actions){
					const targets = [];
					if(owner_instance.target != undefined){
						targets.push(owner_instance.target);
					}
					this.runAction(action, owner_instance, targets, battle);
					this.num_triggers++;
					this.transform_animator.reset();
					this.transform_animator.play();
				}
			}
		}
	}
	startOfBattle(owner_instance: Character.BattleCharacterInstance, battle: Battle.Battle){
		this.runActionsWithoutTime(owner_instance, battle);
	}
	update(dt: Float, owner_instance: Character.BattleCharacterInstance, battle: Battle.Battle){
		if(!this.isPlaced()){
			return;
		}
		const fin = this.transform_animator.update(dt);
		if(fin){
			this.transform_animator.reset();
			this.transform_animator.pause();
		}
		this.runActionsWithTime(dt, owner_instance, battle);
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
	//override for weapons
	getDamage(): Int32{
		return 0;
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