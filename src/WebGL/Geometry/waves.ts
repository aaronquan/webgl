import * as Base from "./base";

import Point2D = Base.Point2D;

type Int32 = number;
type Float = number;

export class Wave{
	frequency: Float;
	amplitude: Float;
	shift: Float;
	constructor(f: Float=1, a: Float=1, s: Float=0){
		this.frequency = f;
		this.amplitude = a;
		this.shift = s;
	}

	//to override
	getY(x: Float): Float{
		return 0;
	}
}

export class Sine extends Wave{
	static equation_str = "sn";
	constructor(f: Float=1, a: Float=1, s: Float=0){
		super(f, a, s);
	}
	getY(x: Float): Float{
			return Math.sin((x-this.shift)*this.frequency)*this.amplitude;
	}
	getPointsInRange(x_start: Float, x_end: Float, samples: Int32): Point2D[]{
		const points: Point2D[] = [];
		points.push(new Point2D(x_start, this.getY(x_start)));
		const inc = 1/samples;
		let x_sample = Math.floor(x_start);
		while(x_sample <= x_start){
				x_sample+=inc;
		}
		while(x_sample < x_end){
				const y_sample = this.getY(x_sample);
				points.push(new Point2D(x_sample, y_sample));
				x_sample+=inc;
		}
		points.push(new Point2D(x_end, this.getY(x_end)));
		return points;
	}
	serialise(): string{
		return `${Sine.equation_str},${this.frequency},${this.amplitude}`;
	}
	static deserialise(s: string): Sine | undefined{
		const sp = s.split(",");
		if(sp[0] != "sn"){
			return undefined;
		}
		return new Sine(parseFloat(sp[1]), parseFloat(sp[2]));
	}
}

export class Sawtooth extends Wave{
	static equation_str = "st";
	shift: Float;
	constructor(f: Float=1, a: Float=1, shift: Float=0){
		super(f,a);
		this.shift = shift;
	}
	getY(x: Float): Float{
		const fopi = this.frequency;
		return 2*this.amplitude*(fopi*(x-this.shift)-Math.floor(fopi*(x-this.shift))) - 1;
	}
	nextPeak(curr_x: Float): Float{
		const period = 1/this.frequency;
		let diff_to_next = (curr_x-this.shift) % period;
		if(diff_to_next < 0){
			diff_to_next += period;
		}
		return diff_to_next == 0 ? curr_x + period : curr_x + period - diff_to_next;
	}
	//only for testing
	testPoints(x_start: Float, x_end: Float, samples: Int32=20): Point2D[]{
		//try with getY only todo
		const points: Point2D[] = [];
		points.push(new Point2D(x_start, this.getY(x_start)));
		const inc = 1/samples;
		let x_sample = Math.floor(x_start);
		while(x_sample <= x_start){
				x_sample+=inc;
		}
		while(x_sample < x_end){
				const y_sample = this.getY(x_sample);
				points.push(new Point2D(x_sample, y_sample));
				x_sample+=inc;
		}
		points.push(new Point2D(x_end, this.getY(x_end)));
		return points;
	}
	getPointsInRange(x_start: Float, x_end: Float): Point2D[]{
		const points = [];
		const start = new Point2D(x_start, this.getY(x_start));
		points.push(start);
		let next = this.nextPeak(x_start);
		//let n = 0;
		while(next < x_end){
			points.push(new Point2D(next, 1));
			points.push(new Point2D(next, -1));
			next += 1/this.frequency;
			//if(n > 5) break;
			//n++;
		}
		if(next != x_end){
			const end = new Point2D(x_end, this.getY(x_end));
			points.push(end);
		}else if(next == x_end){
			const end = new Point2D(x_end, 1);
			points.push(end);
		}
		return points;
	}
	static fromHertz(h: Float, a: Float=1): Sawtooth{
		const shift = -Math.PI/2;
		const frequency = h*Math.PI;
		return new Sawtooth(frequency, a, shift);
	}
	serialise(): string{
		return `${Sawtooth.equation_str},${this.frequency},${this.amplitude}`;
	}
}

export class Square extends Wave{
	static equation_str = "sq";
	//shift: Float;
	constructor(f: Float=1, a: Float=1, shift: Float=0){
		super(f,a, shift);
		//this.shift = shift;
	}
	nextPeak(curr_x: Float): Float{
		const period = 1/this.frequency;
		//Math.ceil(curr_x-this.shift)
		let diff_to_next = ((curr_x-this.shift) % period);
		if(diff_to_next < 0){
			diff_to_next += period;
		}
		return curr_x + period - diff_to_next;
	}
	getPointsInRange(x_start: Float, x_end: Float): Point2D[]{
		const points = [];
		const start = new Point2D(x_start, this.getY(x_start));
		let next = this.nextPeak(x_start);
		let is1 = start.y == this.amplitude;
		//for the condition where square wave starts down
		if((x_start-this.shift+(1/this.frequency)) % (2/this.frequency) == 0){
			is1 = !is1;
		}
		points.push(start);
		while(next < x_end){
			points.push(new Point2D(next, is1 ? this.amplitude : -this.amplitude));
			points.push(new Point2D(next, is1 ? -this.amplitude : this.amplitude));
			is1 = !is1;
			//if(this.nextPeak(next) <= next) break;
			//next = this.nextPeak(next);
			next += 1/this.frequency;
		}
		if(next != x_end){
			const end = new Point2D(x_end, is1 ? this.amplitude : -this.amplitude);
			points.push(end);
		}else if(next == x_end){
			const end = new Point2D(x_end, is1 ? this.amplitude : -this.amplitude);
			points.push(end);
		}
		return points;
	}
	testPoints(x_start: Float, x_end: Float, samples: Int32=20): Point2D[]{
		//try with getY only todo
		const points: Point2D[] = [];
		points.push(new Point2D(x_start, this.getY(x_start)));
		const inc = 1/samples;
		let x_sample = Math.floor(x_start);
		while(x_sample <= x_start){
				x_sample+=inc;
		}
		while(x_sample < x_end){
				const y_sample = this.getY(x_sample);
				points.push(new Point2D(x_sample, y_sample));
				x_sample+=inc;
		}
		points.push(new Point2D(x_end, this.getY(x_end)));
		return points;
	}
	getY(x: Float): Float{
		let val = (x-this.shift) % (2/this.frequency);
		if(val < 0){
			val += (2/this.frequency);
		}

		return val > 1/this.frequency ? -this.amplitude : this.amplitude;
	}
	serialise(): string{
		return `${Square.equation_str},${this.frequency},${this.amplitude}`;
	}
}

export class Triangle extends Wave{
	static equation_str = "tr";
	constructor(f: Float=1, a: Float=1, shift: Float=0){
		super(f,a, shift);
	}

	//todo get proper points (not sampled)
	getPointsInRange(x_start: Float, x_end: Float, samples:Int32=5): Point2D[]{
		const points: Point2D[] = [];
		points.push(new Point2D(x_start, this.getY(x_start)));
		const inc = 1/samples;
		let x_sample = Math.floor(x_start);
		while(x_sample <= x_start){
				x_sample+=inc;
		}
		while(x_sample < x_end){
				const y_sample = this.getY(x_sample);
				points.push(new Point2D(x_sample, y_sample));
				x_sample+=inc;
		}
		points.push(new Point2D(x_end, this.getY(x_end)));
		return points;
	}
	getY(x: Float): Float{
		let val = (x-this.shift) % (2/this.frequency);
		if(val < 0){
			val += (2/this.frequency);
		}
		val *= this.frequency;
		const amount = val > 1 ? val - 1 : val;
		return val > 1 ? this.amplitude - amount*this.amplitude*2 : -this.amplitude + amount*this.amplitude*2;
		
	}
	serialise(): string{
		return `${Triangle.equation_str},${this.frequency},${this.amplitude}`;
	}
}

export class CombinedWave{
	waves: Wave[];
	constructor(){
		this.waves = [];
	}
	getPointsInRange(x_start: Float, x_end: Float, samples:Int32=5): Point2D[]{
		const points = [];
		const start = new Point2D(x_start, this.getY(x_start));
		points.push(start);
		const inc = 1/samples;
		let x_sample = Math.floor(x_start);
		while(x_sample <= x_start){
			x_sample+=inc;
		}
		while(x_sample < x_end){
			const y_sample = this.getY(x_sample);
			points.push(new Point2D(x_sample, y_sample));
			x_sample+=inc;
		}
		points.push(new Point2D(x_end, this.getY(x_end)));
		return points;
	}
	addWave(wave: Wave){
		this.waves.push(wave);
	}
	getY(x: Float){
		if(this.waves.length == 0) return 0;
		let y = 0;
		for(const wave of this.waves){
			y += wave.getY(x);
		}
		return y/this.waves.length;
	}
}