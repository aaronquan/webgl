import * as Grid from "./generic";
import * as PQ from "@datastructures-js/priority-queue";
//import * as WebGL from "./../globals";
import * as Utils from "./../Util/utils";
import * as Geometry from "./../Geometry/geometry";

type Int32 = number;
type Float = number;

type Coordinate = Grid.Coordinate;

type PositionsAtDistance = {
	positions: Coordinate[];
	distance_squared: Float;
}

export type GridEucildianCompare = {
	position: Coordinate;
	distance_squared: Float;
};

export class GridAlgorithms{
	static positions_at_distance:PositionsAtDistance[] = [];
	private static distance_queue = new PQ.PriorityQueue<GridEucildianCompare>((a:GridEucildianCompare,b:GridEucildianCompare) => a.distance_squared-b.distance_squared);
	private static distances_seen: Float[] = [];

	static coordinateDistanceSquared(c1: Coordinate, c2: Coordinate): Float{
		const dx = c1.x - c2.x;
		const dy = c1.y - c2.y;
		return dx*dx+dy*dy;
	}

	static generatePositionsAtDistance(limit_sq: Float){
		//const limit_sq = limit*limit;

		const pq = GridAlgorithms.distance_queue;
		const p0: Coordinate = {x:0, y:0};
		if(pq.isEmpty()){
			pq.enqueue({position: p0, distance_squared: GridAlgorithms.coordinateDistanceSquared(p0, p0)});
			GridAlgorithms.distances_seen.push(0);
		}
		while(pq.front()!.distance_squared <= limit_sq){
			const top = pq.dequeue()!;
			const pos = top.position;

			const positions: Coordinate[] = [];
			if(pos.x == 0 && pos.y == 0){
				positions.push({...pos});
			}else if(pos.y == 0){
				positions.push({x:pos.x, y:0});
				positions.push({x:-pos.x, y:0});
				positions.push({x:0, y:pos.x});
				positions.push({x:0, y:-pos.x});
			}else{
				positions.push({x:pos.x, y:pos.y});
				positions.push({x:-pos.x, y:pos.y});
				positions.push({x:pos.x, y:-pos.y});
				positions.push({x:-pos.x, y:-pos.y});
			}

			const posx = {x:pos.x+1, y:pos.y};
			const dsx = GridAlgorithms.coordinateDistanceSquared(p0, posx);

			//console.log(`${this.distances_seen} - ${pos.x}, ${pos.y}`);

			if(posx.x >= GridAlgorithms.distances_seen.length || posx.y > GridAlgorithms.distances_seen[posx.x]){
				pq.enqueue({position: posx, distance_squared: dsx});
				if(GridAlgorithms.distances_seen.length == posx.x){
					GridAlgorithms.distances_seen.push(0);
				}else{
					GridAlgorithms.distances_seen[posx.x] = Math.max(GridAlgorithms.distances_seen[posx.x], posx.y);
				}
			}

			if(pos.x != pos.y){
				if(pos.y != 0){
					positions.push({x:pos.y, y:pos.x});
					positions.push({x:-pos.y, y:pos.x});
					positions.push({x:pos.y, y:-pos.x});
					positions.push({x:-pos.y, y:-pos.x});
				}
				//do y as well
				const posy = {x:pos.x, y:pos.y+1};
				const dsy = GridAlgorithms.coordinateDistanceSquared(p0, posy);
				if(posy.x >= GridAlgorithms.distances_seen.length || posy.y > GridAlgorithms.distances_seen[pos.x]){
					pq.enqueue({position: posy, distance_squared: dsy});
					if(GridAlgorithms.distances_seen.length == posy.x){
						GridAlgorithms.distances_seen.push(0);
					}else{
						GridAlgorithms.distances_seen[posy.x] = Math.max(GridAlgorithms.distances_seen[posy.x], posy.y);
					}
				}
			}
			if(GridAlgorithms.positions_at_distance.length > 0 && GridAlgorithms.positions_at_distance.at(-1)!.distance_squared === top.distance_squared){
				const last = GridAlgorithms.positions_at_distance.at(-1)!;
				//console.log(`same distance sq ${pos.x}, ${pos.y} == ${last.positions[0].x}, ${last.positions[0].y} ${top.distance_squared}`);
				GridAlgorithms.positions_at_distance[GridAlgorithms.positions_at_distance.length-1].positions = last.positions.concat(positions);
			}else{
				GridAlgorithms.positions_at_distance.push({positions, distance_squared: top.distance_squared});
			}
		}
	}
	static greatestCoordinateAtDistance(): Int32 | undefined{
			if(GridAlgorithms.positions_at_distance.length == 0) return undefined;
			return GridAlgorithms.positions_at_distance.at(-1)!.distance_squared;
		}
	static coordinatesWithinRange(limit_squared: Float, center: Coordinate={x:0, y:0}):Coordinate[]{
		const greatest_distance = GridAlgorithms.greatestCoordinateAtDistance();
		if(greatest_distance == undefined || greatest_distance < limit_squared){
			GridAlgorithms.generatePositionsAtDistance(limit_squared);
			let positions: Coordinate[] = [];
			for(const pd of GridAlgorithms.positions_at_distance){
				positions = positions.concat(pd.positions.map((p) => {
					return {x: p.x+center.x, y: p.y+center.y};
				}));
			}
			return positions; 
		}
		//search for limit index
		const find_index = Utils.Array.binarySearchLowerBound(GridAlgorithms.positions_at_distance, (e:PositionsAtDistance) => limit_squared-e.distance_squared);
		//console.log(find_index);
		let positions: Coordinate[] = [];
		for(let i = 0; i < find_index; i++){
			positions = positions.concat(GridAlgorithms.positions_at_distance[i].positions.map((p) => {
				return {x: p.x+center.x, y: p.y+center.y};
			}));
		}
		return positions;
	}
}

//area of a grid
export class GridRectArea extends Geometry.Base.Rect{
	
	
	randomCoordinate(): Coordinate{
		const x = this.left + Math.floor(Math.random()*this.width);
		const y = this.bot + Math.floor(Math.random()*this.height);
		return {x, y};
	}
}