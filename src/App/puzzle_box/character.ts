

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
}