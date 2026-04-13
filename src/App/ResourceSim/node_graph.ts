import * as Grid from './grid';
import * as Node from './nodes';
import * as ArrayUtil from './../../utils/array';
import { PriorityQueue } from '@datastructures-js/priority-queue';

type Int32 = number;

class RoadConnection{
  path: Grid.GridPosition[];
  from: Int32;
  to: Int32;

  constructor(path: Grid.GridPosition[], from: Int32, to: Int32){
    this.path = path;
    this.from = from;
    this.to = to;
  }
  length(): Int32{
    return this.path.length;
  }
  //generateReverse(): RoadConnection{
  //  return new RoadConnection([...this.path].reverse());
  //}
}

class RoadNode{
  //connections: Map<Int32, RoadConnection>;
  connections: RoadConnection[];
  position: Grid.GridPosition;
  key_node_id: Int32 | undefined;
  id: Int32;


  constructor(pos: Grid.GridPosition, id: Int32, key_id: Int32 | undefined=undefined){
    //this.connections = new Map();
    this.connections = [];
    this.position = pos;
    this.id = id;
    this.key_node_id = key_id;
  }
  addConnection(conn: RoadConnection){
    this.connections.push(conn);
  }

  static unpackGridPositionPath(conns: RoadConnection[]): Grid.GridPosition[]{
    const positions: Grid.GridPosition[] = [];
    for(const conn of conns){
      for(const pos of conn.path){
        positions.push(pos);
      }
    }
    return positions;
  }
}

export class RoadGraph{
  //nodes in the graphs are either key nodes or road intersection

  //connections are arrays of grid_positions;
  nodes: RoadNode[];
  key_map: Map<Int32, Int32>;

  constructor(){
    this.nodes = [];
    this.key_map = new Map();
  }
  generate(grid: Grid.WallGrid, nodes: Map<Int32, Node.KeyNode>){
    this.nodes = [];
    if(nodes.size == 0) return;
    function getKey(x: Int32, y: Int32){
      return y*grid.width + x;
    }
    //this.nodes = Array.from({length: nodes.length}, () => new RoadNode());
    this.nodes = [];
    this.key_map.clear();

    const node_map: (Int32 | undefined)[] = Array.from({length: grid.width*grid.height}, () => undefined);

    const road_node_reference: (Int32 | undefined)[] = Array.from({length: grid.width*grid.height}, () => undefined);
    const road_node_directions: Grid.ActiveDirections[] = Array.from(
      {length: grid.width*grid.height}, () => Grid.DirectionUtil.blankActiveDirections()
    );
    //indexes road nodes (NOT key nodes)
    for(const [id, node] of nodes){
      //const node = nodes[i];
      const key = getKey(node.x, node.y);
      node_map[key] = id;
    }

    console.log(node_map);

    //const last_position: (GridPosition | undefined)
    //start on node 0 and run dfs to either intersection or other nodes
    const first_node = nodes.values().next().value!;
    let road_node_index = 0;

    const position_queue: Grid.GridPosition[] = [];
    let current_road_node_index = 0;
    position_queue.push(new Grid.GridPosition(first_node.x, first_node.y));

    const starting_position = new Grid.GridPosition(first_node.x, first_node.y);
    let next_directions = grid.getTileFromPosition(starting_position)!.getDirections();
    const first_id = first_node.getId();
    const start_node = new RoadNode(starting_position.copy(), current_road_node_index, first_id);
    this.nodes.push(start_node);
    this.key_map.set(first_id, road_node_index);
    const start_key = getKey(starting_position.x, starting_position.y);
    road_node_reference[start_key] = current_road_node_index;

    while(current_road_node_index < position_queue.length && current_road_node_index < 10){
      console.log(`starting n ${current_road_node_index}`);
      const starting_position = position_queue[current_road_node_index];
      const starting_key = getKey(starting_position.x, starting_position.y);
      //let current_node = road_node_reference.get(node_map[getKey(starting_position.x, starting_position.y)]);
      next_directions = grid.getTileFromPosition(starting_position)!.getDirections();
      console.log(next_directions);
      for(const dir of next_directions){
        if(Grid.DirectionUtil.isActiveDirection(road_node_directions[starting_key], dir)){
          //already used edge
          console.log(`repeat edge ${Grid.DirectionUtil.toString(dir)}`);
          continue;
        }
        console.log(`running dir: ${Grid.DirectionUtil.toString(dir)}`);
        const position = starting_position.copy();
        //const tile = grid.getTileFromPosition(position)!;
        //const opp = Grid.DirectionUtil.opposite(dir);
        let next_directions = [dir];

        let is_node = false;
        let times = 0;
        let key = 0;
        const connection: Grid.GridPosition[] = [];
        let last_direction = dir;
        do{
          last_direction = next_directions[0];
          Grid.DirectionUtil.movePosition(next_directions[0], position);
          const tile = grid.getTileFromPosition(position)!;
          const opp = Grid.DirectionUtil.opposite(next_directions[0]);
          next_directions = tile.getDirectionsOtherThan(opp);
          key = getKey(position.x, position.y);
          is_node = node_map[key] != undefined || next_directions.length != 1;
          times++;
          console.log(position);
          connection.push(position.copy());
        }while(!is_node);


        const current_road_node = this.nodes[current_road_node_index];
        const last_opposite_direction = Grid.DirectionUtil.opposite(last_direction);
        if(road_node_reference[key] == undefined){
          road_node_index++;
          const connected_node = road_node_reference[key] == undefined ? new RoadNode(position, road_node_index, node_map[key]) : this.nodes[road_node_reference[key]!];
          const connected_index = road_node_reference[key] == undefined ? road_node_index : road_node_reference[key]!;
          const road_connection_backwards = new RoadConnection(connection, current_road_node_index, connected_index);

          const backwards = [...connection];
          backwards.pop();
          ArrayUtil.reverse(backwards);
          backwards.push(current_road_node.position.copy());
          const road_connection = new RoadConnection(backwards, connected_index, current_road_node_index);

          connected_node.addConnection(road_connection);
          current_road_node.addConnection(road_connection_backwards);
          //connected_node.connections.set(current_road_node_index, road_connection);
          //current_road_node.connections.set(road_node_index, road_connection_backwards);

          road_node_reference[key] = road_node_index;

          if(node_map[key] != undefined){
            this.key_map.set(node_map[key]!, road_node_index);
          }

          position_queue.push(position.copy());
          this.nodes.push(connected_node);

          //setting directions;
          //const last_opposite_direction = Grid.DirectionUtil.opposite(last_direction);
          //Grid.DirectionUtil.setActiveDirection(road_node_directions[key], true, Grid.DirectionUtil.opposite(last_direction));
          //console.log(`added direction to new node ${Grid.DirectionUtil.toString(last_opposite_direction)}`);

          //Grid.DirectionUtil.setActiveDirection(road_node_directions[starting_key], true, dir);
          //console.log(`added direction to current node ${dir}`);

          console.log(`position added as key node ${position.x}, ${position.y}`);
        }else{
          console.log(`dir from source added: ${Grid.DirectionUtil.toString(dir)}`);
          const connected_index = road_node_reference[key]!;
          const connected_node = this.nodes[connected_index];

          console.log(connected_index);
          console.log(connected_node);
          const road_connection_backwards = new RoadConnection(connection, current_road_node_index, connected_index);

          const backwards = [...connection];
          backwards.pop();
          ArrayUtil.reverse(backwards);
          backwards.push(current_road_node.position.copy());
          const road_connection = new RoadConnection(backwards, connected_index, current_road_node_index);
          //connected_node.connections.set(current_road_node_index, road_connection);
          //current_road_node.connections.set(road_node_index, road_connection_backwards);
          connected_node.addConnection(road_connection);
          current_road_node.addConnection(road_connection_backwards);
          
        }
        Grid.DirectionUtil.setActiveDirection(road_node_directions[key], true, Grid.DirectionUtil.opposite(last_direction));
        console.log(`added direction to new node ${Grid.DirectionUtil.toString(last_opposite_direction)}`);
        Grid.DirectionUtil.setActiveDirection(road_node_directions[starting_key], true, dir);
        console.log(`added direction to current node ${dir}`);

      }
      current_road_node_index++;
    }
    console.log(position_queue);
    console.log(this.nodes);
    console.log(this.key_map);
  }
  shortestPath(from: Int32, to: Int32): RoadConnection[] | undefined{
    type PathTo = {
      node: RoadNode;
      distance: Int32;
      last_connection: RoadConnection | undefined;
    }

    const seen = new Set();

    const from_id = this.key_map.get(from);
    const to_id = this.key_map.get(to);
    if(from_id == undefined || to_id == undefined) return;
    
    const from_node = this.nodes[from_id];
    const to_node = this.nodes[to_id];

    console.log(from_node);
    console.log(to_node);

    //run bfs until to_node

    const node_queue = new PriorityQueue<PathTo>((a, b) => {
      return a.distance - b.distance;
    })

    node_queue.push({node: from_node, distance: 0, last_connection: undefined});

    const backtrack_map: (RoadConnection | undefined)[] = Array.from({length: this.nodes.length}, () => undefined);

    while(!node_queue.isEmpty()){

      const curr = node_queue.pop()!;
      if(seen.has(curr.node.id)){
        //node_id++;
        continue;
      }
      backtrack_map[curr.node.id] = curr.last_connection;
      seen.add(curr.node.id);
      if(curr.node.id === to_id){
        const moves = curr.distance;
        
        console.log(`found to in ${moves} moves`);
        //run backtrack 
        const connections: RoadConnection[] = [];
        let id = curr.node.id;
        let t = 0; // remove after fully tested
        while(backtrack_map[id] != undefined && t < 10){
          console.log(id);
          connections.push(backtrack_map[id]!)
          id = backtrack_map[id]!.from;
          t++;
        }
        ArrayUtil.reverse(connections);
        console.log(connections);
        return connections;
      }
      console.log(curr);
      //console.log(curr.node.connections);
      for(const conn of curr.node.connections){
        if(!seen.has(conn.to)){
          node_queue.push({node: this.nodes[conn.to], distance: curr.distance + conn.length(), last_connection: conn});
        }
      }
      //node_id++;
    }
    //console.log(node_heap);

    return undefined;
  }
}
class ClosestNodeGraph{

}

class NodeGraph{

}