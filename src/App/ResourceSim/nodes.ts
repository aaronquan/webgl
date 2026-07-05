import * as WebGL from '../../WebGL/globals';
import * as Resource from './resource';
import * as Grid from "./grid";

type Int32 = number;
type Float = number;

interface Point{
  x: Int32;
  y: Int32;
  equals:(p:Point) => boolean;
}

export const NodeTypeEnum = {
  Basic: 0,
  Resource: 1,
  Requirement: 2
} as const;

type NodeType = (typeof NodeTypeEnum)[keyof typeof NodeTypeEnum];


type NodeCollectionSerialise = {
  number_of_nodes: Int32,
  serialised_string: string
}

export class NodeCollection{
  nodes: Map<Int32, KeyNode>;
  constructor(){
    this.nodes = new Map();
  }
  addNode(node: KeyNode){
    this.nodes.set(node.getId(), node);
  }

  getNode(id: Int32): KeyNode | undefined{
    return this.nodes.get(id);
  }
  remove(id: Int32){
    this.nodes.delete(id);
  }
  serialise(): NodeCollectionSerialise{
    let node_string = "";
    let number_of_nodes = 0;
    for(const [key, node] of this.nodes){
      if(node.tile != undefined){
        node_string += `${node.tile!.x},${node.tile!.y}\n`;
        number_of_nodes++;
      }
    }
    return {serialised_string: node_string, number_of_nodes};
  }
  clear(){
    this.nodes.clear();
  }
}

//no capacity
export class KeyNode{
  static current_id: Int32 = 0;
  //x: Int32;
  //y: Int32;
  inventory: Map<Resource.Resource, Int32>;
  type: NodeType;
  tile: Grid.WallTile | undefined;
  private id: Int32;
  constructor(tile: Grid.WallTile | undefined=undefined, ty: NodeType=NodeTypeEnum.Basic){
    this.inventory = new Map();
    this.type = ty;
    this.id = KeyNode.current_id;
    KeyNode.current_id++;
    this.tile = tile;
    if(tile != undefined){
      tile.key_node = this;
    }
    this.initialiseDefaultInventory();
  }
  static idToNodeType(id: Int32): NodeType{
    switch(id){
      case 1: 
        return NodeTypeEnum.Resource;
      case 2:
        return NodeTypeEnum.Requirement;
    }
    return NodeTypeEnum.Basic;
  }
  protected initialiseDefaultInventory(){
    this.inventory.set(Resource.ResourceEnum.Water, 0);
    this.inventory.set(Resource.ResourceEnum.Apple, 0);
  }
  typeToString(node_type: NodeType): string{
    switch(node_type){
      case NodeTypeEnum.Basic:
        return 'Bsc';
      case NodeTypeEnum.Requirement:
        return 'Req';
      case NodeTypeEnum.Resource:
        return 'Res';
    }
    return "";
  }
  getId(): Int32{
    return this.id;
  }
  setId(id: Int32){
    this.id = id;
  }

  //can override
  update(t: Float){
    
  }
  distanceSq(p: Point): Float | undefined{
    if(this.tile == undefined) return undefined;
    const dx = p.x - this.tile.x - 0.5;
    const dy = p.y - this.tile.y - 0.5;
    return dx*dx + dy*dy;
  }
  drawNodeUI(perspective: WebGL.Matrix.TransformationMatrix3x3, solid_shader: WebGL.Shader.MVPColourProgram, text_drawer: WebGL.TextDrawer, 
    x: Float, y: Float, text_size:Int32=12): Float{
    //const text_size = 10;
    const white = WebGL.Colour.ColourUtils.white();
    solid_shader.use();
    const back_model = WebGL.WebGL.rectangleModel(x, y, text_size*15, text_size*15);
    solid_shader.setColour(0, 0, 0);
    solid_shader.setMvp(perspective.multiplyCopy(back_model));
    WebGL.Shapes.Quad.draw();
    
    //details
    text_drawer.drawTextColour(perspective, x, y, `id ${this.id.toString()}`, text_size, white);
    text_drawer.drawTextColour(perspective, x+(text_size*6), y, this.typeToString(this.type), text_size, white);
    //
    if(this.tile != undefined){
      text_drawer.drawTextColour(perspective, x, y+text_size, this.tile.x.toFixed(0), text_size, white);
      text_drawer.drawTextColour(perspective, x, y+(text_size*2), this.tile.y.toFixed(0), text_size, white);
    }
    return text_size*3;
  }
  getResourceInventory(res: Resource.Resource): Int32{
    if(!this.inventory.has(res)) return 0;
    return this.inventory.get(res)!;
  }
  deliverResource(res: Resource.Resource, amount: Int32){
    const count = this.inventory.get(res)!
    this.inventory.set(res, count+amount);
  }

  //return number drawn from node
  drawResource(res: Resource.Resource, amount: Int32): Int32{
    const count = this.inventory.get(res)!;
    if(count > 0){
      if(count < amount){
        this.inventory.set(res, 0);
        return count;
      }
      this.inventory.set(res, count-amount);
      return amount;
    }
    return 0;
  }

  //
  /*
  serialise(): string{
    //x,y,type
    return `${this.x.toString()},${this.y.toString()},${this.type.toString()}`;
  }
  static deserialise(s: string): KeyNode{
    const sp = s.split(',');
    const type = KeyNode.idToNodeType(parseInt(sp[2]));
    return new KeyNode(parseInt(sp[0]), parseInt(sp[1]), type);
  }*/
}

export class RequirementNode extends KeyNode{
  require_resource: Resource.Resource;
  require_amount: Int32;
  constructor(){
    super();
    this.require_resource = Resource.ResourceEnum.Water;
    this.require_amount = 5;
    this.type = NodeTypeEnum.Requirement;
  }
}

export class ResourceGeneratorNode extends KeyNode{
  current_time: Float;
  gen_time: Float;
  resource: Resource.Resource;
  constructor(){
    super();
    this.current_time = 0;
    this.gen_time = 1000;
    this.resource = Resource.ResourceEnum.Water;
    this.type = NodeTypeEnum.Resource;
  }
  update(t: Float){
    this.current_time += t;
    if(this.current_time >= this.gen_time){
      this.current_time -= this.gen_time;
      const n_resources = this.inventory.get(this.resource)!;
      this.inventory.set(this.resource, n_resources+1);
    }
  }
}