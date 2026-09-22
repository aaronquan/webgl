import * as WebGL from "./../globals";

import TransformationMatrix = WebGL.Matrix.TransformationMatrix3x3;

type Int32 = number;
type Float = number;

export class TranformAnimator2D{
	matrix: TransformationMatrix;
	animations: Map<string, Animator2D>;
	current_animation: string | undefined;

	
	private paused: boolean;

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

	update(dt: Float){
		if(this.paused){
			return;
		}
		if(this.current_animation != undefined){
			this.animations.get(this.current_animation)!.update(dt);
		}
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
		return true;
	}

	addTranformation(key: string, anim: Animator2D){
		this.animations.set(key, anim);
	}
}

interface Animator2D{
	update:(dt: Float) => void;
	setRatio: (r: Float) => void;
	getMatrix:() => TransformationMatrix;
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
	update(dt: Float){
		this.current_time += dt;
		if(this.current_time >= this.transition_time){
			this.current_time = this.transition_time;
		}
	}
	setRatio(r: Float){
		this.current_time = this.transition_time*r;
	}

	getMatrix(): TransformationMatrix{
		return TransformationMatrix.interpolate(this.start_matrix, this.end_matrix, this.getRatio());
	}
}