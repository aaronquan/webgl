import { MinPriorityQueue } from "@datastructures-js/priority-queue";
import * as BattleObject from "./battle_object";
import * as Character from "./character";
import * as WebGL from "./../../WebGL/globals";

import SortedArray = WebGL.Utils.Array.SortedArray;

type Float = number;
type Int32 = number;

export type BattleEvent = {
  time_stamp: Float,
  character: Character.BattleCharacterInstance,
  object: BattleObject.BattleObjectInstance,
  type: BattleObject.ObjectActionType,
  value: Int32,
  target?: Character.BattleCharacterInstance
}


type NextCooldownTrigger = {
  time: Float;
  actions: BattleObject.ObjectAction[];
  item_id: Int32;
}

type BuffReachedTrigger = {
  buff: Character.BattleBuff;
  buff_amount: Int32;
  actions: BattleObject.ObjectAction[];
  item_id: Int32;
}

export const BattleOutcomeEnum = {
  Continue: 0,
  EnemyDefeated: 1,
  PlayerDefeated: 2

} as const;

type BattleOutcome = (typeof BattleOutcomeEnum)[keyof typeof BattleOutcomeEnum];

export class Battle{
  left_character: Character.BattleCharacterInstance;
  right_character: Character.BattleCharacterInstance;

  objects: BattleObject.BattleObjectInstanceCollection;

  events: BattleEvent[];

  battle_time: Float;



  //log: string[];

  constructor(lc: Character.BattleCharacter, rc: Character.BattleCharacter, 
    objs: BattleObject.BattleObjectInstanceCollection){
    this.left_character = new Character.BattleCharacterInstance(lc);
    this.right_character = new Character.BattleCharacterInstance(rc);
    this.objects = objs;
    this.events = [];
    this.battle_time = 0;
  }
  reset(){
    console.log(this.events);
    for(const ev of this.events){
      console.log(this.eventToString(ev));
    }
    this.left_character.resetAll(this.objects);
    this.right_character.resetAll(this.objects);
    this.battle_time = 0;
    this.events = [];
    //this.left_character.resetObjects(this.objects);
    //this.right_character.resetObjects(this.objects);
  }
  eventTypeString(type: BattleObject.ObjectActionType): string{
    switch(type){
      case BattleObject.ObjectActionTypeEnum.Attack:
        break;
    }
    return "None";
  }
  eventToString(event: BattleEvent){
    let s = `${event.time_stamp.toFixed(0)}:`;
    switch(event.type){
      case BattleObject.ObjectActionTypeEnum.Attack:
        s += ` Attack hits for ${event.value}`;
    }
    return s;
  }
  startOfBattle(){
    this.left_character.setTarget(this.right_character);
    this.right_character.setTarget(this.left_character);
    this.left_character.startOfBattle(this.objects, this);
    this.right_character.startOfBattle(this.objects, this);
  }
  update(dt: Float): BattleOutcome{
    //play the battle out in time
    this.battle_time += dt;
    this.left_character.update(dt, this.objects, this);
    if(this.right_character.isDefeated()){
      console.log("dead")
      return BattleOutcomeEnum.EnemyDefeated;
    }
    this.right_character.update(dt, this.objects, this);
    if(this.left_character.isDefeated()){
      console.log("self defeat");
      return BattleOutcomeEnum.PlayerDefeated;
    }

    return BattleOutcomeEnum.Continue
  }
  addEvent(char: Character.BattleCharacterInstance, object: BattleObject.BattleObjectInstance, type: BattleObject.ObjectActionType,
  value: Int32, target?: Character.BattleCharacterInstance){
    this.events.push({time_stamp: this.battle_time, object, character: char, type, value, target});
  }

  //simulate battle to complete
  // object order is left first the right with grids from left to right
  preSimulateBattle(){
    const order = this.left_character.getGrid().getObjectOrder();
    order.push(...this.right_character.getGrid().getObjectOrder());
    console.log(order);

    const cooldown_queue = new MinPriorityQueue<NextCooldownTrigger>({compare: (i) => i.time});
    const buff_reached_triggers = new Map<Character.BattleBuff, SortedArray<BuffReachedTrigger>>();

    //const simulated_buffs_left = ; 

    //adding initial triggers
    for(const id of order){
      const object = this.objects.getInstance(id)!;
      for(const actions of object.action_instances){
        const condition = actions.trigger_action.condition;
        switch(condition.trigger_type){
          case BattleObject.TriggerTypeEnum.Cooldown:
            cooldown_queue.push({time: condition.value_amount!, item_id: id, actions: actions.trigger_action.actions});
            break;
          case BattleObject.TriggerTypeEnum.Start:
            //todo
            //apply actions

            break;
          case BattleObject.TriggerTypeEnum.BuffReached:
            const buff = condition.secondary_value as Character.BattleBuff;
            const reached = condition.value_amount!;
            const obj = {buff, buff_amount: reached, item_id: id, actions: actions.trigger_action.actions};
            if(buff_reached_triggers.has(buff)){
              buff_reached_triggers.get(buff)!.add(obj);
            }else{
              buff_reached_triggers.set(buff, new SortedArray([obj], (a, b) => a.buff_amount - b.buff_amount));
            }
            break;
        }
      }
    }
  }
}