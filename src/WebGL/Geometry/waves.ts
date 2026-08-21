import * as Base from "./base";

import Point2D = Base.Point2D;

type Int32 = number;
type Float = number;

export class Sine{
	static equation_str = "sn";
	frequency: Float;
	amplitude: Float;
	constructor(f: Float=1, a: Float=1){
			this.frequency = f;
			this.amplitude = a;
	}
	getY(x: Float){
			return Math.sin(x*this.frequency)*this.amplitude;
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
		return `sn,${this.frequency},${this.amplitude}`;
	}
	static deserialise(s: string): Sine | undefined{
		const sp = s.split(",");
		if(sp[0] != "sn"){
			return undefined;
		}
		return new Sine(parseFloat(sp[1]), parseFloat(sp[2]));
	}
}

export class Sawtooth{

}