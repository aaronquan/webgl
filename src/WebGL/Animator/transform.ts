import * as WebGL from "./../globals";

import TransformationMatrix = WebGL.Matrix.TransformationMatrix3x3;

type Int32 = number;
type Float = number;

export class TransformAnimator2D{
	matrix: TransformationMatrix;
	animations: Map<string, Animator2D>;
	current_animation: string | undefined;

	protected paused: boolean;

	constructor(){
		this.matrix = TransformationMatrix.identity();
		this.animations = new Map();
		this.current_animation = undefined;

		this.paused = true;
	}
	play(){
		this.paused = false;
	}
	pause(){
		this.paused = true;
	}

	getMatrix(): TransformationMatrix{
		return this.matrix;
	}

	protected getCurrentAnimation(): Animator2D | undefined{
		if(this.current_animation != undefined){
			return this.animations.get(this.current_animation);
		}
		return undefined;
	}

	//returns whether the animation is finished
	update(dt: Float): boolean{
		if(this.paused){
			return false;
		}
		const anim = this.getCurrentAnimation();
		if(anim != undefined){
			const tr = anim.update(dt);
			this.matrix = anim.getMatrix();
			if(tr != -1){
				return true;
			}
		}
		return false;
	}

	//start should be value 0-1 indicating when to start animation
	setAnimation(anim_key: string, start: Float=0.0): boolean{
		if(!this.animations.has(anim_key)){
			return false;
		}
		const anim = this.animations.get(anim_key)!;
		anim.setRatio(start);
		this.current_animation = anim_key;
		this.matrix = anim.getMatrix();
		console.log(this.matrix);
		return true;
	}

	addTranformation(key: string, anim: Animator2D){
		this.animations.set(key, anim);
	}
	
}

export class TransformSequenceAnimator2D extends TransformAnimator2D{
	sequence: string[];
	index: Int32;
	constructor(){
		super();
		this.sequence = [];
		this.index = 0;
	}

	addSequence(key: string){
		this.sequence.push(key);
	}
	reset(){
		this.index = 0;
		this.current_animation = this.sequence[this.index];
		const anim = this.getCurrentAnimation();
		if(anim != undefined){
			this.getCurrentAnimation()!.setTime(0);
		}
	}

	update(dt: Float): boolean {
		if(this.paused){
			return false;
		}
		let reset = false;
		const anim = this.getCurrentAnimation();
		if(anim != undefined){
			const tr = anim.update(dt);
			if(tr != -1){
				this.index++;
				if(this.index == this.sequence.length){
					this.index = 0;
					reset = true;
				}
				this.current_animation = this.sequence[this.index];
				this.getCurrentAnimation()!.setTime(tr);
			}
			this.matrix = anim.getMatrix();
		}
		return reset;
	}
}


interface Animator2D{
	update:(dt: Float) => Float; //returns time passed or -1 if animation not finished
	setRatio: (r: Float) => void;
	getMatrix:() => TransformationMatrix;
	setTime:(t: Float) => void;
}

export class LinearTransformAnimator implements Animator2D{
	transition_time: Float;
	current_time: Float;
	start_matrix: TransformationMatrix;
	end_matrix: TransformationMatrix;
	constructor(sm: TransformationMatrix, em: TransformationMatrix, tt: Float){
		this.current_time = 0;
		this.transition_time = tt;
		this.start_matrix = sm;
		this.end_matrix = em;
	}
	private getRatio(){
		return this.current_time/this.transition_time;
	}
	update(dt: Float): Float{
		this.current_time += dt;
		if(this.current_time >= this.transition_time){
			const passed = this.current_time - this.transition_time;
			this.current_time = this.transition_time;
			return passed;
		}
		return -1;
	}
	setTime(t: Float){
		this.current_time = t;
	}
	setRatio(r: Float){
		this.current_time = this.transition_time*r;
	}

	getMatrix(): TransformationMatrix{
		return TransformationMatrix.interpolate(this.start_matrix, this.end_matrix, this.getRatio());
	}
}