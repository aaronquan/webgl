import * as BattleObject from "./battle_object";
import * as BattleGrid from "./battle_grid";
import * as Shape from "./shape";
//import type { ShapeGridInterface } from "./shape";

type Int32 = number;
type Float = number;

export const BattleBuffEnum = {
	Regen: 0,
	Mana: 1,
} as const;

export type BattleBuff = (typeof BattleBuffEnum)[keyof typeof BattleBuffEnum];

export type BuffChange = {
	buff: BattleBuff,
	amount: Int32
}

export class Character{
	current_health: Int32;
	max_health: Int32;
	constructor(mh: Int32){
		this.max_health = mh;
		this.current_health = this.max_health;
	}
	heal(amount: Int32){
		this.current_health += amount;
		if(this.current_health >= this.max_health){
			this.current_health = this.max_health;
		}
	}
	takeDamage(damage: Int32){
		this.current_health -= damage;
	}
	isDefeated(): boolean{
		return this.current_health <= 0;
	}
	reset(){
		this.current_health = this.max_health;
	}
}

export class BattleBuffCollection{
	//todo
	buffs: Map<BattleBuff, Int32>;

	constructor(){
		this.buffs = new Map();
		for(const t of Object.values(BattleBuffEnum)){
			this.buffs.set(t, 0);
		}
	}
	addBuffOfType(type: BattleBuff, amount: Int32){
		this.buffs.set(type, this.buffs.get(type)!+amount);
	}
	hasBuffsOfType(type: BattleBuff, amount: Int32): boolean{
		return this.buffs.get(type)! >= amount;
	}
	removeBuffOfType(type: BattleBuff, amount: Int32){
		this.addBuffOfType(type, -amount);
	}
	characterTick(character: BattleCharacter){
		character.heal(this.buffs.get(BattleBuffEnum.Regen)!);
	}
	applyBuffChange(buff_changes: BuffChange[]){
		for(const change of buff_changes){
			this.addBuffOfType(change.buff, change.amount);
		}
		//this.buffs.
	}
	static buffToString(buff: BattleBuff): string{
		switch(buff){
			case BattleBuffEnum.Regen:
				return "Regen";
			case BattleBuffEnum.Mana:
				return "Mana";
		}
		return "NA";
	}
	static buffToChar(buff: BattleBuff): string{
		return this.buffToString(buff).at(0)!;
	}
}

export class BattleCharacter extends Character{
	static tick_time = 1000;
	protected held_object_ids: Set<Int32>;
	protected battle_grid: BattleGrid.BattleGrid; // todo finish adding this
	target: BattleCharacter | undefined;

	buffs: BattleBuffCollection;

	battle_time: Float;
	character_tick_time: Float;
	constructor(mh: Int32, grid: BattleGrid.BattleGrid=new BattleGrid.BattleGrid(0, 0, 10, 10)){
		super(mh);
		this.held_object_ids = new Set();
		this.battle_grid = grid;

		this.buffs = new BattleBuffCollection();

		this.battle_time = 0;
		this.character_tick_time = 0;
	}
	setTarget(char: BattleCharacter){
		this.target = char;
	}
	getGrid(): BattleGrid.BattleGrid{
		return this.battle_grid;
	}
	buffTick(){
		this.buffs.characterTick(this);
	}
	update(dt: Float, battle_objects: BattleObject.BattleObjectInstanceCollection): boolean{
		//add grid updates here for playing
		this.battle_time += dt;
		this.character_tick_time += dt;
		if(this.character_tick_time >= BattleCharacter.tick_time){
			//tick for buffs, e.g 
			console.log("buff tick");
			this.buffTick();
			this.character_tick_time -= BattleCharacter.tick_time;
		}

		//update objects in grid
		let reset = false;
		if(this.target != undefined){
			this.forEachObject((inst) => {
				inst.update(dt, this, this.target!);
				if(this.target!.isDefeated()){
					reset = true;
					//return; // this return does not exit for each
				}
			}, battle_objects);
		}
		return reset;
	}
	resetObjects(obj_map: BattleObject.BattleObjectInstanceCollection){
		this.forEachObject((inst) => {
			inst.reset();
		}, obj_map);
	}

	addObject(object: BattleObject.BattleObjectInstance){
		this.held_object_ids.add(object.getId());
	}
	removeObject(object: BattleObject.BattleObjectInstance){
		this.held_object_ids.delete(object.getId());
	}

	addObjectToGrid(x: Int32, y: Int32, object: BattleObject.BattleObjectInstance): boolean{
		this.held_object_ids.add(object.getId());
		object.setOwner(this);
		return this.battle_grid.addObjectToGrid(x, y, object);
	}

	getGridInterface(): Shape.ShapeGridInterface{
		return this.battle_grid.interface;
	}

	forEachObject(obj_function: (bo: BattleObject.BattleObjectInstance) => void, obj_map: BattleObject.BattleObjectInstanceCollection){
		this.held_object_ids.forEach((id) => {
			const obj = obj_map.getInstance(id);
			if(obj != undefined){
				obj_function(obj);
			}
		});
	}

}

//has grid (probably add grid to battle character)
export class EnemyCharacter extends BattleCharacter{
	static createBaseEnemy(enemy_grid: BattleGrid.BattleGrid, objects: BattleObject.BattleObjectInstanceCollection): EnemyCharacter{
		const enemy = new EnemyCharacter(20, enemy_grid);
		const ws = objects.addObjectFromString(BattleObject.WoodenSword.name)!;
		console.log(ws);
		enemy.addObjectToGrid(3,3, ws);
		return enemy;
	}
}

