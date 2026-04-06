import * as Grid from './grid';
import * as Node from './nodes';

type Int32 = number;

class RoadConnection{
  path: Grid.GridPosition[];

  constructor(path: Grid.GridPosition[]){
    this.path = path;
  }
  length(){

  }
  generateReverse(): RoadConnection{
    return new RoadConnection([...this.path].reverse());
  }
}

class RoadNode{
  connections: Map<Int32, RoadConnection>;
  position: Grid.GridPosition;
  key_node_id: Int32 | undefined;
  id: Int32;


  constructor(pos: Grid.GridPosition){
    this.connections = new Map();
  }
}

export class RoadGraph{
  //nodes in the graphs are either key nodes or road intersection

  //connections are arrays of grid_positions;
  nodes: RoadNode[];

  constructor(){
    this.nodes = [];
  }
  generate(grid: Grid.WallGrid, nodes: Node.KeyNode[]){
    function getKey(x: Int32, y: Int32){
      return y*grid.width + x;
    }
    //this.nodes = Array.from({length: nodes.length}, () => new RoadNode());
    this.nodes = [];

    const node_map: (Int32 | undefined)[] = Array.from({length: grid.width*grid.height}, () => undefined);
    //indexes nodes

    for(let i = 0; i < nodes.length; i++){
      const node = nodes[i];
      const key = getKey(node.x, node.y);
      node_map[key] = i;
    }

    console.log(node_map);

    //const last_position: (GridPosition | undefined)
    //start on node 0 and run dfs to either intersection or other nodes
    let node_index = 0;
    const current_node = nodes[0];

    const position_queue = [];
    

    const starting_position = new Grid.GridPosition(nodes[node_index].x, nodes[node_index].y);
    const next_directions = grid.getTileFromPosition(starting_position)!.getDirections();
    for(const dir of next_directions){
      const position = starting_position.copy();
      const tile = grid.getTileFromPosition(position)!;
      const opp = Grid.DirectionUtil.opposite(dir);
      let next_directions = tile.getDirectionsOtherThan(opp);

      let is_node = false;
      let times = 0;
      let key = 0;
      do{
        Grid.DirectionUtil.movePosition(next_directions[0], position);
        const tile = grid.getTileFromPosition(position)!;
        const opp = Grid.DirectionUtil.opposite(next_directions[0]);
        next_directions = tile.getDirectionsOtherThan(opp);
        key = getKey(position.x, position.y);
        is_node = node_map[key] != undefined || next_directions.length > 1;
        times++;
        console.log(position);
      }while(node_map[key] != undefined || next_directions.length > 1);
      if(node_map[key]){
        console.log("found node");
      }else{
        console.log("found intersect");
      }
      position_queue.push(position.copy());
    }
    console.log(position_queue)
  }
}

class ClosestNodeGraph{

}