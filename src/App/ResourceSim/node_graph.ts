import * as WebGL from './../../WebGL/globals';
import * as Grid from './grid';
import * as Node from './nodes';
import * as ArrayUtil from './../../utils/array';
import { PriorityQueue } from '@datastructures-js/priority-queue';

type Int32 = number;

export class RoadConnection{
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
  static reversePath(path: Grid.GridPosition[], end: Grid.GridPosition): Grid.GridPosition[]{
    const new_path = [...path];
    new_path.pop();
    ArrayUtil.reverse(new_path);
    new_path.push(end);
    return new_path;
  }
}

export class RoadNode{
  //connections: Map<Int32, RoadConnection>;
  connections: RoadConnection[];
  position: Grid.GridPosition;
  key_node_id: Int32 | undefined; // a road node may not be a key node, it might be a 
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

  static unpackGridPositionPath(conns: RoadConnection[], start: Grid.GridPosition): Grid.GridPosition[]{
    const positions: Grid.GridPosition[] = [start.copy()];
    for(const conn of conns){
      for(const pos of conn.path){
        positions.push(pos);
      }
    }
    return positions;
  }
}

export type ShortestPathResult = {
  starting_position: Grid.GridPosition;
  connections: RoadConnection[];
}

export class RoadGraph{
  //nodes in the graphs are either key nodes or road intersection

  //connections are arrays of grid_positions;
  nodes: RoadNode[];
  key_map: Map<Int32, Int32>;

  private is_generated: boolean;

  constructor(){
    this.nodes = [];
    this.key_map = new Map();
    this.is_generated = false;
  }
  reset(){
    this.nodes = [];
    this.key_map = new Map();
    this.is_generated = false;
  }
  isGenerated(): boolean{
    return this.is_generated;
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
      if(node.tile != undefined){
        const key = getKey(node.tile.x, node.tile.y);
        node_map[key] = id;
      }
    }

    console.log(node_map);

    //const last_position: (GridPosition | undefined)
    //start on node 0 and run dfs to either intersection or other nodes
    const first_node = nodes.values().next().value!;
    let road_node_index = 0;

    const position_queue: Grid.GridPosition[] = [];
    let current_road_node_index = 0;
    position_queue.push(new Grid.GridPosition(first_node.tile!.x, first_node.tile!.y));

    const starting_position = new Grid.GridPosition(first_node.tile!.x, first_node.tile!.y);
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
    this.is_generated = true;
  }
  generateGraphFromChunks(chunks: Grid.ChunkHolder, nodes: Node.NodeCollection){
    if(nodes.nodes.size == 0) return;
    this.nodes = [];
    this.key_map = new Map();

    //const map_nodes = nodes. //could filter for nodes that contain tiles

    const key_node_position_map: WebGL.Utils.Map.PositionMap2D<Int32> = new WebGL.Utils.Map.PositionMap2D();
    for(const [id, node] of nodes.nodes){
      if(node.tile != undefined){
        key_node_position_map.set(node.tile.x, node.tile.y, id);
      }
    }

    //to finish off
    const road_node_reference: WebGL.Utils.Map.PositionMap2D<Int32> = new WebGL.Utils.Map.PositionMap2D();
    let road_node_index = 0;
    const road_node_directions: WebGL.Utils.Map.PositionMap2D<Grid.ActiveDirections> = new WebGL.Utils.Map.PositionMap2D();
    
    const start_node = nodes.nodes.values().next().value!;
    const start_position = new Grid.GridPosition(start_node.tile!.x, start_node.tile!.y);
    const first_road_node = new RoadNode(start_position, road_node_index, start_node.getId());
    road_node_index++;
    this.key_map.set(0, start_node.getId());
    this.nodes.push(first_road_node);
    road_node_reference.set(start_position.x, start_position.y, first_road_node.id);

    const position_queue: Grid.GridPosition[] = [];
    position_queue.push(start_position);
    let i = 0;

    while(i < position_queue.length){
      const position = position_queue[i];
      const position_node = this.nodes[road_node_reference.get(position.x, position.y)!];
      const tile = chunks.getTileFromPosition(position);
      if(tile == undefined){
        i++;
        continue;
      }
      const directions = tile.getDirections();
      //const node_directions_seen = road_node_directions.get(position.x, position.y);
      if(!road_node_directions.has(position.x, position.y)){
        road_node_directions.set(position.x, position.y, Grid.DirectionUtil.blankActiveDirections());
      }
      const node_directions_seen = road_node_directions.get(position.x, position.y)!;
      console.log("directions seen:")
      console.log(node_directions_seen);
      for(const dir of directions){
        if(Grid.DirectionUtil.isActiveDirection(node_directions_seen, dir)){
          continue;
        }
        console.log(Grid.DirectionUtil.toString(dir));
        const curr_pos = position.copy();
        let next_direction = dir;
        const path = [];
        let broken = false;
        do{
          Grid.DirectionUtil.movePosition(next_direction, curr_pos);
          const opp = Grid.DirectionUtil.opposite(next_direction);
          const next_tile = chunks.getTileFromPosition(curr_pos);
          path.push(curr_pos.copy());
          if(next_tile != undefined){
            if(next_tile.directionHasPath(opp)){
              console.log("path to tile");
              if(next_tile.isKeyNode()){
                break;
              }
              const next_directions = next_tile.getDirectionsOtherThan(opp);
              if(next_directions.length == 1){
                console.log("continue_path");
                next_direction = next_directions[0];
              }else{
                // new key location
                break;
              }
            }else{
              //there is no path leading to next tile
              broken = true;
              break;
            }
          }else{
            //next tile is undefined
            broken = true;
            break;
          }
        }while(true);
        
        if(broken){
          console.log("broken");
        }else{
          //position is starting position (from)
          //curr is ending position (to)

          console.log(path);
          console.log(curr_pos);
          console.log(position);

          //add node if not found
          if(!road_node_reference.has(curr_pos.x, curr_pos.y)){
            const key_id = key_node_position_map.get(curr_pos.x, curr_pos.y);
            const new_road_node = new RoadNode(curr_pos, road_node_index, key_id);
            road_node_index++;
            this.nodes.push(new_road_node);
            road_node_reference.set(curr_pos.x, curr_pos.y, new_road_node.id);
            road_node_directions.set(curr_pos.x, curr_pos.y, Grid.DirectionUtil.blankActiveDirections());

            position_queue.push(curr_pos.copy());

            if(key_id != undefined){
              this.key_map.set(key_id, new_road_node.id);
            }

          }
          const current_node = this.nodes[road_node_reference.get(curr_pos.x, curr_pos.y)!]

          //add connection 
          const connection_to_current = new RoadConnection([...path], position_node.id, current_node.id);

          console.log(connection_to_current);
          position_node.addConnection(connection_to_current);
          console.log(`Added dir ${Grid.DirectionUtil.toString(dir)}`);
          console.log(road_node_directions.get(position.x, position.y));
          Grid.DirectionUtil.setActiveDirection(road_node_directions.get(position.x, position.y)!, true, dir);

          const connection_to_position = new RoadConnection(RoadConnection.reversePath(path, position), current_node.id, position_node.id);
          console.log(connection_to_position);
          current_node.addConnection(connection_to_position);
          const opposite_last = Grid.DirectionUtil.opposite(next_direction)
          console.log(`Added opp ${Grid.DirectionUtil.toString(opposite_last)}`);
          Grid.DirectionUtil.setActiveDirection(road_node_directions.get(curr_pos.x, curr_pos.y)!, true, opposite_last);
        }
      }
      i++;
    }
    console.log(this.nodes);
    console.log(this.key_map);
  }

  shortestPath(from: Int32, to: Int32): ShortestPathResult | undefined{
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

    const starting_position = from_node.position;

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
        return {connections, starting_position};
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