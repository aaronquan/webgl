import * as WebGL from '../../WebGL/globals';
import * as Resource from './resource';

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


//no capacity
export class KeyNode{
  x: Int32;
  y: Int32;
  inventory: Map<Resource.Resource, Int32>;
  type: NodeType;
  private id: Int32;
  constructor(x: Int32, y: Int32, ty: NodeType=NodeTypeEnum.Basic){
    this.x = x;
    this.y = y;
    this.inventory = new Map();
    this.type = ty;
    this.id = -1;
    this.initialiseDefaultInventory();
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
  distanceSq(p: Point){
    const dx = p.x - this.x - 0.5;
    const dy = p.y - this.y - 0.5;
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

    text_drawer.drawTextColour(perspective, x, y+text_size, this.x.toFixed(0), text_size, white);
    text_drawer.drawTextColour(perspective, x, y+(text_size*2), this.y.toFixed(0), text_size, white);

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
  serialise(): string{
    //TODO
    return "";
  }
  static deserialise(s: string): KeyNode{
    //TODO
    return new KeyNode(0, 0);
  }
}

export class RequirementNode extends KeyNode{
  require_resource: Resource.Resource;
  require_amount: Int32;
  constructor(x: Int32, y: Int32){
    super(x, y);
    this.require_resource = Resource.ResourceEnum.Water;
    this.require_amount = 5;
    this.type = NodeTypeEnum.Requirement;
  }
}

export class ResourceGeneratorNode extends KeyNode{
  current_time: Float;
  gen_time: Float;
  resource: Resource.Resource;
  constructor(x: Int32, y: Int32){
    super(x, y);
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