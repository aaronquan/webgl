import * as BattleObject from "./battle_object";
import * as BattleGrid from "./battle_grid";
import type { ShapeGridInterface } from "./shape";

type Int32 = number;
type Float = number;

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

export class BattleCharacter extends Character{
	protected held_object_ids: Set<Int32>;
	protected battle_grid: BattleGrid.BattleGrid; // todo finish adding this
	target: BattleCharacter | undefined;
	constructor(mh: Int32, grid: BattleGrid.BattleGrid=new BattleGrid.BattleGrid(0, 0, 10, 10)){
		super(mh);
		this.held_object_ids = new Set();
		this.battle_grid = grid;
	}
	setTarget(char: BattleCharacter){
		this.target = char;
	}
	getGrid(): BattleGrid.BattleGrid{
		return this.battle_grid;
	}
	update(dt: Float, battle_objects: BattleObject.BattleObjectInstanceCollection): boolean{
		//add grid updates here for playing
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

	getGridInterface(): ShapeGridInterface{
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

