import * as Equation from "./equation";
import * as Wave from "./waves";
import * as Base from "./../Geometry/base";
import * as Utils from "./../Util/utils";
import * as Interface from "./../Interface/interface";
import * as WebGL from "./../globals";

type Int32 = number;
type Float = number;

type GraphEquation = {
  equation: Equation.Equation,
  end_point: Float
}

type LineEquation = Equation.LineABC | Equation.LineMC;

//uses equations to create 1 x -> 1 y graph
export class CustomEquationGraph{
  private equations: GraphEquation[];
  constructor(){
    this.equations = [];
  }

  addEquation(equation: Equation.Equation, end_point: Float){
    this.equations.push({equation, end_point});
  }

  getY(x: Float): Float | undefined{
    const equ_index = this.upperBound(x);
    if(equ_index >= this.equations.length || equ_index == -1){
      return undefined;
    }
    const equ = this.equations[equ_index];
    return equ.equation.getY(x);
  }
  upperBound(x: Float): Int32{
    const i = Utils.Array.binarySearchUpperBound(this.equations, (t) => x-t.end_point);
    return i;
  }
  clear(){
    this.equations = [];
  }
  getConnectionPoints(): Base.Point2D[]{
    const points = [];
    for(let i = 0; i < this.equations.length; i++){
      const ep = this.equations[i].end_point;
      const y = this.equations[i].equation.getY(ep);
      if(y != undefined){
        points.push(new Base.Point2D(ep, y));
      }
    }
    return points;
  }
  serialise(): string{
    const fl = this.equations.map((v) => v.end_point.toString()).join(",");
    const equation_strs = this.equations.map((e) => e.equation.serialise());
    return `${fl}\n${equation_strs.join("\n")}`;
  }
  static deserialise(s: string): CustomEquationGraph{
    const sp = s.split("\n");
    const end_points = sp[0].split(",").map((s) => parseFloat(s))
    const ceq = new CustomEquationGraph();
    for(let i = 1; i < sp.length; i++){
      const equation_of_type = Equation.deserialiseEquation(sp[i]);
      const equ = Equation.getEquationFromEquationOfType(equation_of_type);
      ceq.addEquation(equ, end_points[i-1]);
    }
    return ceq;
  }
}

export class GraphRect extends Base.Rect{
  getLineIntersectionXRange(line: LineEquation): Utils.Interval.Interval | undefined{
    let top_x = line.getX(this.top);
    let bot_x = line.getX(this.bot);
    if(top_x == undefined && bot_x == undefined){
      if(this.bot > line.c && line.c < this.top){
        return new Utils.Interval.Interval(this.left, this.right);
      }
      return undefined;
    }
    let range: Utils.Interval.Interval | undefined = undefined;
    if(top_x == undefined || bot_x == undefined){
      range = new Utils.Interval.Interval(this.left, this.right);
    }else{
      range = new Utils.Interval.Interval(top_x, bot_x);
      if(top_x > bot_x){
        range.start = bot_x;
        range.end = top_x;
      }
    }
    if(range != undefined){
      if(range.start < this.left){
        range.start = this.left;
      }
      if(range.end > this.right){
        range.end = this.right;
      }
    }
    //console.log(range);
    return range;
  }
  getLineIntersectionPoints(line: LineEquation): Base.Point2D[]{
    const x_range =  this.getLineIntersectionXRange(line);
    if(x_range == undefined) return [];
    return [new Base.Point2D(x_range.start, line.getY(x_range.start)), new Base.Point2D(x_range.end, line.getY(x_range.end))];
  }
  getQuadraticIntersectionRanges(qe: Equation.Quadratic): Utils.Interval.Interval[]{
    const ranges: Utils.Interval.Interval[] = [];
    const upfacing = qe.isUpFacing();
    const top = upfacing ? this.top : this.bot;
    const bot = upfacing ? this.bot : this.top;
    const intersect_top = qe.getX(top);
    const intersect_bot = qe.getX(bot);
    if(intersect_top.x1 != undefined){
      if(intersect_bot.x1 != undefined){
        const sx = Math.max(this.left, intersect_top.x1);
        const ex = Math.min(this.right, intersect_top.x2!);
        if(intersect_bot.x1 > sx){
          ranges.push(new Utils.Interval.Interval(sx, Math.min(this.right, intersect_bot.x1)));
        }
        if(intersect_bot.x2! < ex){
          ranges.push(new Utils.Interval.Interval(Math.max(this.left, intersect_bot.x2!), ex));
        }
      }else{
        //only checking bot
        const is_intersecting = !((intersect_top.x1 < this.left && intersect_top.x2! < this.left) 
          || (intersect_top.x1 > this.right && intersect_top.x2! > this.right));
        if(is_intersecting){
          const lo_x = Math.max(this.left, intersect_top.x1);
          const hi_x = Math.min(this.right, intersect_top.x2!);
          ranges.push(new Utils.Interval.Interval(lo_x, hi_x));
        }
      }
    }
    return ranges;
  }
  inY(y: Float): boolean{
    return y >= this.top && y <= this.bot;
  }
  inX(x: Float): boolean{
    return x >= this.left && x <= this.right;
  }
}

export class DrawGraph extends Interface.InterfaceElement.InterfaceElement{
  rect: GraphRect;
  grid_size: Float;
  x: Int32;
  y: Int32;
  width: Int32;
  height: Int32;

  constructor(x: Int32, y: Int32, width: Int32, height: Int32, 
    rect_left: Float, rect_bot: Float, rect_width: Float, rect_height: Float
  ){
    super(x, y, width, height);
    this.rect = new GraphRect(rect_left, rect_bot, rect_width, rect_height);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.grid_size = (this.width/this.height < this.rect.width/this.rect.height) ? this.width/this.rect.width : this.height/this.rect.height;
    this.height = this.grid_size*this.rect.height;
  }

  globalPointToGraphPoint(x: Int32, y: Int32): Base.Point2D{
    const rx = x-this.x; // relative point
    const ry = y-this.y;

    const sx = rx/this.grid_size; //scaled point
    const sy = ry/this.grid_size;

    //translated point
    const tx = sx + this.rect.left;
    const ty = sy + this.rect.bot;

    return new Base.Point2D(tx, ty);
  }

  generateGridModel(lt: Float, colour: WebGL.Colour.ColourRGB): WebGL.BasicModel{
    const model = new WebGL.BasicModel();

    const zx = this.getZeroX();
    const zy = this.getZeroY();
    const width = this.graphWidth();
    const height = this.graphHeight();

    const ht = lt*0.5;
    const dt = lt+lt;

    //zero lines
    if(this.rect.left <= 0 && this.rect.right >= 0){
      const transformation = WebGL.WebGL.rectangleModel(zx-lt, this.y, dt, height);
      model.addPart({colour, transformation});
    }
    if(this.rect.bot <= 0 && this.rect.top >= 0){
      const transformation = WebGL.WebGL.rectangleModel(this.x, zy-lt, width, dt);
      model.addPart({colour, transformation});
    }

    //horizontal lines
    for(let gx = Math.ceil(this.rect.left); gx <= this.rect.right; gx++){
      if(gx == 0) continue;
      const rx = zx+gx*this.grid_size;
      const transformation = WebGL.WebGL.rectangleModel(rx-ht, this.y, lt, height);
      model.addPart({colour, transformation});
    }

    for(let gy = Math.ceil(this.rect.bot); gy <= this.rect.top; gy++){
      if(gy == 0) continue;
      const ry = zy-gy*this.grid_size;
      const transformation = WebGL.WebGL.rectangleModel(this.x, ry-ht, width, lt);
      model.addPart({colour, transformation});
    }
    

    return model;
  }

  drawGraphGrid(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, 
    circle_shader: WebGL.Shader.MVPCircleOnlyProgram){
    //const zx = this.getZeroX();
    //const zy = this.getZeroY();
    const white = WebGL.Colour.ColourUtils.white();
    const model = this.generateGridModel(2, white); // can store model

    model.draw(vp);
    this.drawPointCircle(vp, 0, 0, 7, circle_shader, white);
    
    //this.drawLineGraphCoords(vp, 1, 1, -1, -1, 3, colour_shader, WebGL.Colour.ColourUtils.red());

  }

  drawPointCircle(vp: WebGL.Matrix.TransformationMatrix3x3, x: Float, y: Float, radius: Float, 
    circle_shader: WebGL.Shader.MVPCircleOnlyProgram, colour: WebGL.Colour.ColourRGB){
    const zx = this.getZeroX();
    const zy = this.getZeroY();
    const dia = radius+radius;
    const model = WebGL.WebGL.rectangleModel(zx+x*this.grid_size, zy+y*this.grid_size, dia, dia);
    WebGL.WebGL.enableBlend();
    circle_shader.use();
    circle_shader.setMvp(vp.multiplyCopy(model));
    circle_shader.setCircleColourFromColourRGB(colour);
    circle_shader.setCentre(0.5, 0.5);
    circle_shader.setRadius(0.5);
    WebGL.Shapes.CenterQuad.drawRelative();
    WebGL.WebGL.disableBlend();
  }

  drawLineGraphCoords(vp: WebGL.Matrix.TransformationMatrix3x3, x1: Float, y1: Float, x2: Float, y2: Float, lt: Float, 
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB){
    const zx = this.getZeroX();
    const zy = this.getZeroY();
    const line_model = WebGL.WebGL.lineModel(
      zx+x1*this.grid_size, zy-y1*this.grid_size, 
      zx+x2*this.grid_size, zy-y2*this.grid_size, lt
    );
    colour_shader.use();
    colour_shader.setColourFromColourRGB(colour);
    colour_shader.setMvp(vp.multiplyCopy(line_model));
    WebGL.Shapes.Quad.drawRelative();
  }

  drawLinesFromPoints(vp: WebGL.Matrix.TransformationMatrix3x3, points: WebGL.Geometry.Base.Point2D[], lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB){
    if(points.length < 2) return;
    for(let i = 1; i < points.length; i++){
      const p1 = points[i-1];
      const p2 = points[i];
      this.drawLineGraphCoords(vp, p1.x, p1.y, p2.x, p2.y, lt, colour_shader, colour);
    }
  }

  drawLineEquation(vp: WebGL.Matrix.TransformationMatrix3x3, le: LineEquation, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB
  ){
    const intersection = this.rect.getLineIntersectionPoints(le);
    if(intersection.length == 2){
      this.drawLinesFromPoints(vp, intersection, lt, colour_shader, colour);
    }
  }

  drawQuadraticEquation(vp: WebGL.Matrix.TransformationMatrix3x3, qe: Equation.Quadratic, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, samples: Int32=5
  ){
    const ranges = this.rect.getQuadraticIntersectionRanges(qe);
    for(const range of ranges){
      const points = qe.getPointsInRange(range.start, range.end, samples);
      this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
    }
  }

  drawSine(vp: WebGL.Matrix.TransformationMatrix3x3, se: Wave.Sine, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, samples: Int32=5
  ){
    const points = se.getPointsInRange(this.rect.left, this.rect.right, samples);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawSaw(vp: WebGL.Matrix.TransformationMatrix3x3, se: Wave.Sawtooth, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB
  ){
    const points = se.getPointsInRange(this.rect.left, this.rect.right);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawSawTest(vp: WebGL.Matrix.TransformationMatrix3x3, se: Wave.Sawtooth, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB
  ){
    const points = se.testPoints(this.rect.left, this.rect.right);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawSquare(vp: WebGL.Matrix.TransformationMatrix3x3, sq: Wave.Square, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB
  ){
    const points = sq.getPointsInRange(this.rect.left, this.rect.right);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawSquareTest(vp: WebGL.Matrix.TransformationMatrix3x3, sq: Wave.Square, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB
  ){
    const points = sq.testPoints(this.rect.left, this.rect.right);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawTriangle(vp: WebGL.Matrix.TransformationMatrix3x3, tr: Wave.Triangle, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, samples: Int32=5
  ){
    const points = tr.getPointsInRange(this.rect.left, this.rect.right, samples);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  drawCombinedWave(vp: WebGL.Matrix.TransformationMatrix3x3, cw: Wave.CombinedWave, lt: Float,
    colour_shader: WebGL.Shader.MVPColourProgram, colour: WebGL.Colour.ColourRGB, samples: Int32=5
  ){
    const points = cw.getPointsInRange(this.rect.left, this.rect.right, samples);
    this.drawLinesFromPoints(vp, points, lt, colour_shader, colour);
  }

  graphWidth(): Float{
    return this.rect.width*this.grid_size;
  }

  graphHeight(): Float{
    return this.rect.height*this.grid_size;
  }

  getZeroX(): Float{
    return this.x-(this.rect.left*this.grid_size);
  }
  getZeroY(): Float{
    return this.y+(this.rect.top*this.grid_size);
  }
}

class GraphInterfaceWindow extends Interface.InternalWindow.InternalWindow{

}

