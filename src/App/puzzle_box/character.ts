import * as BObject from "./battle_object";

type Int32 = number;
type Float = number;

export class Character{
	current_health: Int32;
	max_health: Int32;
	constructor(mh: Int32){
		this.max_health = mh;
		this.current_health = this.max_health;
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
	held_object_ids: Set<Int32>;
	constructor(mh: Int32){
		super(mh);
		this.held_object_ids = new Set();
	}	

	addObject(object: BObject.BattleObjectInstance){
		this.held_object_ids.add(object.getId());
	}
	removeObject(object: BObject.BattleObjectInstance){
		this.held_object_ids.delete(object.getId());
	}

	forEachObject(obj_function: (bo: BObject.BattleObjectInstance) => void, obj_map: BObject.BattleObjectInstanceCollection){
		this.held_object_ids.forEach((id) => {
			const obj = obj_map.getInstance(id);
			if(obj != undefined){
				obj_function(obj);
			}
		});
	}

}