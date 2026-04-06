import * as Grid from './grid';
import * as Node from './nodes';
import * as Resource from './resource';

type Int32 = number;
type Float = number;

type TrackPosition = {
  distance_covered: Float,
  move_index: Int32
}

export class Car{
  //coordinates are from top-left corner
  x: Float; // center point 
  y: Float;
  size: Float;
  plan: Grid.Track | undefined;
  plan_position: TrackPosition;
  plan_index: Int32;
  turn_speed: Float; // per second?
  speed: Float; // per second
  rotation: Float; // in radians
  last_key: Grid.GridPosition | undefined;
  //inventory: Resource | undefined;
  constructor(){
    this.x = 0;
    this.y = 0;
    this.size = 0.2;
    this.plan = undefined;
    this.plan_position = {distance_covered: 0, move_index: 0};
    this.plan_index = 0;
    this.speed = 0.01;
    this.turn_speed = 0.05;
    this.rotation = 0;
    this.last_key = undefined;
  }

  setPlan(plan: Grid.Track){
    //console.log(plan);
    this.plan = plan;
    this.x = plan.starting_location.x+0.5;
    this.y = plan.starting_location.y+0.5;
    this.last_key = plan.starting_location;
    //this.rotation = Grid.DirectionUtil.turnDirectionToRadians(plan.part.getMoves()[0].direction);
    this.plan_position = {distance_covered: 0, move_index: 0};
    //console.log(this.plan.part.getMoves().at(0)?.direction);
  }
  update(t:Float){
    if(this.plan){
      const moves = this.plan.part.getMoves();
      const dir = moves[this.plan_position.move_index].direction;
      const dir_movement = Grid.DirectionUtil.directions[dir];
      const target_rotation = Grid.DirectionUtil.turnDirectionToRadians(dir);
      const turn = Grid.DirectionUtil.getTurnDirection(dir, this.rotation);
      if(turn === Grid.TurnDirectionEnum.Clockwise){
        if(this.rotation + this.turn_speed > target_rotation && this.rotation < target_rotation){
          this.rotation = target_rotation;
          //console.log("stop rot clock");
        }else{
          this.rotation += this.turn_speed;
          this.rotation %= (Math.PI*2);
        }
      }else if(turn === Grid.TurnDirectionEnum.AntiClockwise){
        if(this.rotation - this.turn_speed < target_rotation && this.rotation > target_rotation){
          this.rotation = target_rotation;
          //console.log("stop rot anti");
        }else{
          this.rotation -= this.turn_speed;
          if(this.rotation < 0){
            this.rotation += Math.PI*2;
          }
        }
      }
      else if(this.plan_position.distance_covered+this.speed >= moves[this.plan_position.move_index].distance){
        const remaining = moves[this.plan_position.move_index].distance-this.plan_position.distance_covered;
        this.x += dir_movement.x*remaining;
        this.y -= dir_movement.y*remaining;
        if(this.plan_position.move_index+1 >= moves.length){
          this.plan_position = {distance_covered: 0, move_index: 0};
          this.last_key = this.plan.endPoint();
          this.plan = undefined;
        }else{
          this.plan_position = {distance_covered: 0, move_index: this.plan_position.move_index+1};
        }
      }else{
        this.x += dir_movement.x*this.speed;
        this.y -= dir_movement.y*this.speed;
        this.plan_position.distance_covered += this.speed;
      }
    }
  }
}

const CarStateEnum = {
  Waiting: 0,
  MovingToNode: 1,
  Extracting: 2,

} as const;

type CarState = (typeof CarStateEnum)[keyof typeof CarStateEnum];

export class ResourceCar extends Car{
  capacity: Int32;
  inventory: Map<Resource.Resource, Int32>;
  current_capacity: Int32;

  car_state: CarState;

  current_node: Node.KeyNode;

  constructor(starting_node: Node.KeyNode){
    super();
    this.capacity = 1;
    this.inventory = new Map();
    this.current_capacity = 0;
    this.car_state = CarStateEnum.Waiting;
    this.current_node = starting_node;
    this.centerCarOnNode(this.current_node);
  }
  centerCarOnNode(node: Node.KeyNode){
    this.x = node.x+0.5;
    this.y = node.y+0.5;
  }
  //findClosestResourceNode(engine: WallEngine){
    
  ///}
}
