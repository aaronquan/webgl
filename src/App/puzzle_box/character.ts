

type Int32 = number;
type Float = number;

export class Character{
	current_health
	max_health: Int32;
	constructor(mh: Int32){
		this.max_health = mh;
		this.current_health = this.max_health;
	}
}