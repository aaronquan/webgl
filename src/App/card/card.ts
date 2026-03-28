import WebGL from "../../WebGL/globals"
import * as App from "../app"
import * as Shader from "../../WebGL/Shaders/custom"
import * as Texture from "../../WebGL/Texture/texture"
import * as Matrix from "../../WebGL/Matrix/matrix"
import * as Shapes from "../../WebGL/Shapes/Shapes"
import * as WebGLGlobals from "../../WebGL/globals"
import { colour } from "../../WebGL/Shaders/Fragment/Source/fragment_source"
import { DirectionUtil } from "../grid"
import * as Grid from "../grid";

type Int32 = number;
type Float = number;

type VoidFunction = () => void;
const EmptyFunction: VoidFunction = () => {};

const CardSuitEnum = {
  Spade: 0,
  Heart: 1,
  Club: 2,
  Diamond: 3
} as const;

type CardSuit = (typeof CardSuitEnum)[keyof typeof CardSuitEnum];

const CardNumberEnum = {
  Ace: 0,
  King: 1,
  Queen: 2,
  Jack: 3,
  Ten: 4,
  Nine: 5,
  Eight: 6,
  Seven: 7,
  Six: 8,
  Five: 9,
  Four: 10,
  Three: 11,
  Two: 12
} as const;

type CardNumber = (typeof CardNumberEnum)[keyof typeof CardNumberEnum];


const ButtonStateEnum = {
  Off: 0,
  Disabled: 1,
  Hovered: 2,
  Pressed: 3,
  PressedHovered: 4,
  Selected: 5,
} as const;



type ButtonState = (typeof ButtonStateEnum)[keyof typeof ButtonStateEnum];

class BasicButton{
  x: Int32;
  y: Int32;
  text: string;
  width: Int32;
  height: Int32;
  text_size: Int32;

  state: ButtonState;

  colours: Map<ButtonState, WebGLGlobals.Colour.ColourRGB>;
  text_colour: WebGLGlobals.Colour.ColourRGB;
  onHoveredOver: VoidFunction;
  onHoveredOut: VoidFunction;
  onPressed: VoidFunction;
  onPressedOut: VoidFunction;

  constructor(x: Int32, y: Int32, w: Int32, h: Int32){
    this.text = "";
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.text_size = 13;
    this.state = ButtonStateEnum.Off;
    this.colours = new Map();
    this.colours.set(ButtonStateEnum.Off, WebGLGlobals.Colour.ColourUtils.blue());
    this.colours.set(ButtonStateEnum.Hovered, WebGLGlobals.Colour.ColourUtils.red());
    this.colours.set(ButtonStateEnum.Pressed, WebGLGlobals.Colour.ColourUtils.green());
    this.colours.set(ButtonStateEnum.PressedHovered, WebGLGlobals.Colour.ColourUtils.cyan());
    this.text_colour = WebGLGlobals.Colour.ColourUtils.white();
    this.onHoveredOver = EmptyFunction;
    this.onHoveredOut = EmptyFunction;
    this.onPressed = EmptyFunction;
    this.onPressedOut = EmptyFunction;
  }
  private isInside(x: Int32, y: Int32): boolean{
    const sx = x - this.x;
    const sy = y - this.y;
    return 0 < sx && sx < this.width && 0 < sy && sy < this.height;
  }
  mouseDown(){
    if(this.state == ButtonStateEnum.Hovered){
      this.state = ButtonStateEnum.PressedHovered;
      this.onPressed();
    }
  }
  mouseUp(){
    if(this.state === ButtonStateEnum.Pressed){
      this.state = ButtonStateEnum.Off;
      this.onPressedOut();
    }else if(this.state === ButtonStateEnum.PressedHovered){
      this.state = ButtonStateEnum.Hovered;
      this.onPressedOut();
    }
  }
  updateMouse(point: Point){
    if(this.isInside(point.x, point.y)){
      if(this.state == ButtonStateEnum.Off){
        this.state = ButtonStateEnum.Hovered;
      }else if(this.state == ButtonStateEnum.Pressed){
        this.state = ButtonStateEnum.PressedHovered;
      }
      this.onHoveredOver();
    }else{
      if(this.state === ButtonStateEnum.Hovered){
        this.state = ButtonStateEnum.Off;
      }else if(this.state === ButtonStateEnum.PressedHovered){
        this.state = ButtonStateEnum.Pressed;
      }
      this.onHoveredOut();
    }
  }
  draw(vp: Matrix.TransformationMatrix3x3, colour_shader: Shader.MVPColourProgram, text_drawer: WebGLGlobals.TextDrawer){
    colour_shader.use();
    const transformation = WebGLGlobals.WebGL.rectangleModel(this.x, this.y, this.width, this.height);
    colour_shader.setMvp(vp.multiplyCopy(transformation));
    if(this.colours.has(this.state)){
      colour_shader.setColourFromColourRGB(this.colours.get(this.state)!);
    }
    Shapes.Quad.draw();

    if(this.text.length > 0){
      const text_width = this.text_size*this.text.length;
      const tx = this.x + (this.width/2) - (text_width/2);
      const ty = this.y + (this.height/2) - (this.text_size/2);
      text_drawer.drawTextColour(vp, tx, ty, this.text, this.text_size, this.text_colour);
    }
  }
}

class ButtonSet{
  buttons: BasicButton[];
  constructor(){
    this.buttons = [];
  }
  addButton(b: BasicButton){
    this.buttons.push(b);
  }
  updateMouse(pt: Point){
    for(const button of this.buttons){
      button.updateMouse(pt);
    }
  }
  mouseDown(){
    for(const button of this.buttons){
      button.mouseDown();
    }
  }
  mouseUp(){
    for(const button of this.buttons){
      button.mouseUp();
    }
  }
  draw(vp: Matrix.TransformationMatrix3x3, colour_shader: Shader.MVPColourProgram, text_drawer: WebGLGlobals.TextDrawer){
    for(const button of this.buttons){
      button.draw(vp, colour_shader, text_drawer);
    }
  }
}


export class List<T>{
  head: ListItem<T> | undefined;
  constructor(){
    //this.head.
  }
}

export type ListItem<T> = {
  item: T;
  next?: ListItem<T>;
}

export class Deck{
  cards: VirtualCard[];
  constructor(){
    this.cards = [];
  }
  static regularDeck(): Deck{
    const deck = new Deck();
    for(const n of Object.values(CardNumberEnum)){
      for(const s of Object.values(CardSuitEnum)){
        deck.addCard(s, n);
      }
    }
    return deck;
  }
  addCard(suit: CardSuit, number: CardNumber){
    this.cards.push(new VirtualCard(suit, number));
  }
  addRandomCard(){
    const random_card = VirtualCard.randomCard();
    this.cards.push(random_card);
  }
  private createList(){
    let list: List<VirtualCard> = {head: undefined};
    let last: ListItem<VirtualCard> | undefined = undefined;
    for(const card of this.cards){
      if(last == undefined){
        last = {item: card, next: undefined};
        list = {head: last};
      }else{
        last.next = {item: card, next: undefined};
        last = last.next;
      }
    }
    return list;
  }
  shuffle(){
    const n_cards = this.cards.length;
    const new_cards = Array.from({length: n_cards}, () => {
      return new VirtualCard();
    });
    let n = 0;
    for(let i = n_cards-1; i > 0; i--){
      const j = Math.floor(Math.random()*(i+1));
      //new_cards[n] = this.cards[j];

      [this.cards[j], this.cards[i]] = [this.cards[i], this.cards[j]];
    }

    //this.cards = new_cards;
  }
}

class SimpleCardModel{
  text_matrix: WebGLGlobals.Matrix.TransformationMatrix3x3;
  card_matrix: WebGLGlobals.Matrix.TransformationMatrix3x3;
  card_colour: WebGLGlobals.Colour.ColourRGB;
  width: Int32;
  height: Int32;
  constructor(width: Int32, height: Int32, text_size: Int32=16){
    this.text_matrix = WebGLGlobals.Matrix.TransformationMatrix3x3.translate(-text_size, -text_size/2);
    this.text_matrix = this.text_matrix.multiplyCopy(WebGLGlobals.Matrix.TransformationMatrix3x3.scale(text_size, text_size));

    this.card_colour = WebGLGlobals.Colour.ColourUtils.red();

    this.card_matrix = WebGLGlobals.Matrix.TransformationMatrix3x3.scale(width, height);
    this.width = width;
    this.height = height;
  }

  draw(card: VirtualCard, colour_shader: Shader.MVPColourProgram, 
      text_drawer: WebGLGlobals.TextDrawer,
      vp: WebGLGlobals.Matrix.TransformationMatrix3x3, 
      model_matrix: WebGLGlobals.Matrix.TransformationMatrix3x3, bg_colour:WebGLGlobals.Colour.ColourRGB=this.card_colour)
  {
    colour_shader.use();
    colour_shader.setColourFromColourRGB(bg_colour);
    const card_model = model_matrix.multiplyCopy(this.card_matrix);
    const card_matrix = vp.multiplyCopy(card_model);
    colour_shader.setMvp(card_matrix);
    Shapes.CenterQuad.drawRelative();
    
    const text_model = model_matrix.multiplyCopy(this.text_matrix);
    const text_matrix = vp.multiplyCopy(text_model);
    text_drawer.drawTextModelColour(text_matrix, card.toString(), 1, WebGLGlobals.Colour.ColourUtils.yellow());
  }
  isInside(x: Float, y: Float): boolean{
    const half_width = this.width*0.5;
    const half_height = this.height*0.5;
    return -half_width < x && x < half_width && -half_height < y && y < half_height;
  }
}

class VisualCard{
  transformation_matrix: WebGLGlobals.Matrix.TransformationMatrix3x3;
  card_model: SimpleCardModel;
  card: VirtualCard;
  colour: WebGLGlobals.Colour.ColourRGB;
  constructor(model: SimpleCardModel, card: VirtualCard){
    this.card_model = model;
    this.transformation_matrix = WebGLGlobals.Matrix.TransformationMatrix3x3.identity();
    this.card = card;
    this.colour = WebGLGlobals.Colour.ColourUtils.blue();
  }
  translate(x: Int32, y: Int32){
    this.transformation_matrix.translate(x, y);
  }
  checkMouse(mouse_point: WebGLGlobals.Matrix.Point2D){
    const inverse = this.transformation_matrix.copy();
    inverse.invert();
    const pt = inverse.transformPoint(mouse_point);
    if(this.card_model.isInside(pt.x, pt.y)){
      this.colour = WebGLGlobals.Colour.ColourUtils.blue();
    }else{
      this.colour = WebGLGlobals.Colour.ColourUtils.red();
    }
  }
}

export class VirtualCard{
  suit: CardSuit;
  number: CardNumber;
  constructor(suit: CardSuit=CardSuitEnum.Spade, number: CardNumber=CardNumberEnum.Ace){
    this.suit = suit;
    this.number = number;
  }
  toString(): string{
    return VirtualCard.toNumberChar(this.number)+VirtualCard.toSuitChar(this.suit);
  }
  static randomCard(): VirtualCard{
    const card = new VirtualCard(VirtualCard.randomSuit(), VirtualCard.randomNumber());
    return card;
  }
  static randomSuit(): CardSuit{
    const r = Math.random();
    const i = Math.floor(Object.keys(CardSuitEnum).length*r);
    return i as CardSuit;
  }
  static randomNumber(): CardNumber{
    const r = Math.random();
    const i = Math.floor(Object.keys(CardNumberEnum).length*r);
    return i as CardNumber;
  }

  static toNumberChar(n: CardNumber): string{
    switch(n){
      case CardNumberEnum.Ace:
        return "A";
      case CardNumberEnum.King:
        return "K";
      case CardNumberEnum.Queen:
        return "Q";
      case CardNumberEnum.Jack:
        return "J";
      case CardNumberEnum.Ten:
        return "10";
      case CardNumberEnum.Nine:
        return "9";
      case CardNumberEnum.Eight:
        return "8";
      case CardNumberEnum.Seven:
        return "7";
      case CardNumberEnum.Six:
        return "6";
      case CardNumberEnum.Five:
        return "5";
      case CardNumberEnum.Four:
        return "4";
      case CardNumberEnum.Three:
        return "3";
      case CardNumberEnum.Two:
        return "2";
    }
  }

  static toNumberString(n: CardNumber): string{
    switch(n){
      case CardNumberEnum.Ace:
        return "Ace";
      case CardNumberEnum.King:
        return "King";
      case CardNumberEnum.Queen:
        return "Queen";
      case CardNumberEnum.Jack:
        return "Jack";
      case CardNumberEnum.Ten:
        return "Ten";
      case CardNumberEnum.Nine:
        return "Nine";
      case CardNumberEnum.Eight:
        return "Eight";
      case CardNumberEnum.Seven:
        return "Seven";
      case CardNumberEnum.Six:
        return "Six";
      case CardNumberEnum.Five:
        return "Five";
      case CardNumberEnum.Four:
        return "Four";
      case CardNumberEnum.Three:
        return "Three";
      case CardNumberEnum.Two:
        return "Two";
    }
  }

  static toSuitString(s: CardSuit): string{
    switch(s){
      case CardSuitEnum.Spade:
        return "Spade";
      case CardSuitEnum.Heart:
        return "Heart";
      case CardSuitEnum.Club:
        return "Club";
      case CardSuitEnum.Diamond:
        return "Diamond";
    }
  }

  static toSuitChar(s: CardSuit): string{
    switch(s){
      case CardSuitEnum.Spade:
        return "S";
      case CardSuitEnum.Heart:
        return "H";
      case CardSuitEnum.Club:
        return "C";
      case CardSuitEnum.Diamond:
        return "D";
    }
  }
}

interface Point{
  x: Int32;
  y: Int32;
  equals:(p:Point) => boolean;
}

export class CardEngine extends App.BaseEngine{
  cards: VirtualCard[];
  base_card_model: SimpleCardModel;
  vis_card: VisualCard;

  deck: Deck;
  deck_visuals: VisualCard[];

  card_model: WebGLGlobals.Matrix.TransformationMatrix3x3;
  button1: BasicButton;
  button2: BasicButton;
  button3: BasicButton;

  buttons: ButtonSet;

  mouse_point: Point;
  updated_mouse: boolean;

  rotation: Float;
  turn_speed: Float;
  turn_target: Grid.GridDirection;

  constructor(){
    super();
    this.cards = [new VirtualCard()];
    this.base_card_model = new SimpleCardModel(50, 80);
    this.vis_card = new VisualCard(this.base_card_model, new VirtualCard());
    this.vis_card.translate(300, 300);
    //this.vis_card.transformation_matrix.rotate(DirectionUtil.turnDirectionToRadians(Grid.DirectionEnum.Right));
    console.log(this.vis_card)
    this.card_model = Matrix.TransformationMatrix3x3.translate(300, 300);
    this.deck = new Deck();
    this.button1 = new BasicButton(20, 20, 100, 50);
    this.button1.text = "Add";
    this.button1.onPressed = () => {
      //this.deck.addRandomCard();
      this.deck = Deck.regularDeck();
      console.log(this.deck.cards);
      this.turn_target = Grid.DirectionEnum.Left;
      console.log(this.rotation);
      //console.log(VirtualCard.toSuitString(VirtualCard.randomSuit()));
      //console.log(VirtualCard.toNumberString(VirtualCard.randomNumber()));
    };
    this.button2 = new BasicButton(140, 20, 100, 50);
    this.button2.text = "Shuffle";
    this.button2.onPressed = () => {
      this.deck.shuffle();
      console.log(this.deck.cards);
      this.turn_target = Grid.DirectionEnum.Up;
      console.log(this.rotation);
    };
    this.button3 = new BasicButton(260, 20, 100, 50);
    this.button3.text = "Update";
    this.button3.onPressed = () => {
      this.createDeckVisuals();
    };

    this.buttons = new ButtonSet();
    const left = new BasicButton(20, 80, 80, 40);
    left.text = "left";
    left.onPressed = () => {
      this.turn_target = Grid.DirectionEnum.Left;
    }
    this.buttons.addButton(left);

    const down = new BasicButton(120, 80, 80, 40);
    down.text = "down";
    down.onPressed = () => {
      this.turn_target = Grid.DirectionEnum.Down;
    }
    this.buttons.addButton(down);

    const right = new BasicButton(220, 80, 80, 40);
    right.text = "right";
    right.onPressed = () => {
      this.turn_target = Grid.DirectionEnum.Right;
    }
    this.buttons.addButton(right);

    const up = new BasicButton(320, 80, 80, 40);
    up.text = "up";
    up.onPressed = () => {
      this.turn_target = Grid.DirectionEnum.Up;
    }
    this.buttons.addButton(up);

    this.mouse_point = new Matrix.Point2D();
    this.updated_mouse = false;
    this.deck_visuals = [];

    this.rotation = 0;
    this.turn_speed = 0.05;
    this.turn_target = Grid.DirectionEnum.Up;
    //this.card_model
    //this.card_model = this.card_model.multiplyCopy(Matrix.TransformationMatrix3x3.scale(2, 2));
  }
  update(t: Float){
    this.updateTurn();
  }
  updateTurn(){
    const turn_dir = Grid.DirectionUtil.getTurnDirection(this.turn_target, this.rotation);
    //console.log(this.turn_target);
    //console.log(this.rotation);
    let target_radians = DirectionUtil.turnDirectionToRadians(this.turn_target);
    if(turn_dir === Grid.TurnDirectionEnum.Straight){
      return;
    }
    if(turn_dir === Grid.TurnDirectionEnum.AntiClockwise){
      if(this.rotation - this.turn_speed < target_radians && this.rotation > target_radians){
        this.vis_card.transformation_matrix.rotate(target_radians - this.rotation);
        this.rotation = target_radians;
        console.log("end anti");
      }else{
        this.vis_card.transformation_matrix.rotate(-this.turn_speed);
        this.rotation -= this.turn_speed;
      }
    }else{
      //target_radians += Math.PI*2;
      if(this.rotation + this.turn_speed > target_radians  && this.rotation < target_radians){
        this.vis_card.transformation_matrix.rotate(target_radians - this.rotation);
        this.rotation = target_radians;
        console.log("end clock");
      }else{
        this.vis_card.transformation_matrix.rotate(this.turn_speed);
        this.rotation += this.turn_speed;
      }
    }
    this.rotation %= (Math.PI*2);
    if(this.rotation < 0){
      this.rotation += Math.PI*2;
    }
    //console.log(this.rotation);
  }
  step(){
    this.vis_card.transformation_matrix.rotate(0.02);
  }
  protected override handleMouseDown(ev: MouseEvent): void {
    this.button1.mouseDown();
    this.button2.mouseDown();
    this.button3.mouseDown();
    this.buttons.mouseDown();
  }
  protected override handleMouseUp(ev: MouseEvent): void{
    this.button1.mouseUp();
    this.button2.mouseUp();
    this.button3.mouseUp();
    this.buttons.mouseUp();
  }
  protected override handleMouseMove(ev: MouseEvent): void {
    const mouse_point = new Matrix.Point2D(ev.offsetX, ev.offsetY);
    if(!this.mouse_point.equals(mouse_point)){
      this.updated_mouse = true;
      this.button1.updateMouse(mouse_point);
      this.button2.updateMouse(mouse_point);
      this.button3.updateMouse(mouse_point);
      this.buttons.updateMouse(mouse_point);

      this.updateMouse(mouse_point);
    }
    this.mouse_point = mouse_point;
  }
  createDeckVisuals(){
    this.deck_visuals = [];
    for(let i = 0; i < this.deck.cards.length; i++){
      const vis = new VisualCard(this.base_card_model, this.deck.cards[i]);
      vis.translate(100+(this.base_card_model.width+10)*i, 100);
      this.deck_visuals.push(vis);
    }
  }
  updateMouse(mp: Matrix.Point2D){
    this.vis_card.checkMouse(mp);

    for(const card of this.deck_visuals){
      card.checkMouse(mp);
    }
  }
}

export class CardRenderer implements App.IEngineRenderer<CardEngine>{
  solid_shader: Shader.MVPColourProgram;
  sprite_sheet_shader: Shader.MVPSpriteSheetProgram;
  texture_shader: Shader.MVPTextureProgram;

  //font: Texture.CustomFont;
  fonts: WebGLGlobals.FontLoader;

  text_drawer: WebGLGlobals.TextDrawer;

  width: Int32;
  height: Int32;
  vp: Matrix.TransformationMatrix3x3;

  rotation: Float;
  constructor(w: Int32, h: Int32){
    this.solid_shader = new Shader.MVPColourProgram();
    this.sprite_sheet_shader = new Shader.MVPSpriteSheetProgram();
    this.texture_shader = new Shader.MVPTextureProgram();

    this.width = w;
    this.height = h;

    /*
    this.font = new Texture.CustomFont("letters-Sheet.png");
    this.font.load();
    this.font.active(0);*/

    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, this.width, this.height, 0);
    this.fonts = new WebGLGlobals.FontLoader();
    this.text_drawer = new WebGLGlobals.TextDrawer();
    this.rotation = 0;
  }
  loadTextures(onLoad: VoidFunction=EmptyFunction){
    console.log("loading textures");
    const font_name = "letters-Sheet.png";
    const not_font = "asdf";
    this.fonts.addFont(font_name);
    this.fonts.addFont(not_font);
    this.fonts.loadFonts(() => {
      this.text_drawer.setFont(this.fonts.getFont(font_name)!);
      this.text_drawer.loadFont();
      console.log("finished loading");
      if(onLoad) onLoad();
    });
    //this.text_drawer.loadFont();
  }
  loadResources(onLoad:VoidFunction=EmptyFunction){
    //this.loader.load(onLoad);
    //this.text_drawer.loadFont();
  }
  drawCard(card: VirtualCard, x: Int32, y: Int32){
    const sc = Matrix.TransformationMatrix3x3.scale(50, 90);

    const tr = Matrix.TransformationMatrix3x3.translate(x, y);
    let m = Matrix.TransformationMatrix3x3.identity();
    m.multiply(tr);
    m.multiply(sc);
    this.solid_shader.use();
    this.solid_shader.setColour(0.2, 0.8, 1.0);
    this.solid_shader.setMvp(this.vp.multiplyCopy(m));
    Shapes.CenterQuad.drawRelative();

    const cs = card.toString();
    //const trs = Matrix.TransformationMatrix3x3.translate(x+25, y+45);
    const fs = 15;
    this.text_drawer.drawText(this.vp, x-fs, y-(fs/2), cs, fs);
    
    
  }
  render(engine: CardEngine){
    //engine.step();
    this.rotation += 0.01;
    //console.log("rendering card engine");
    this.text_drawer.drawText(this.vp, 0, 0, "hi there", 15);
    //const c1 = engine.cards[0];
    /*
    this.solid_shader.use();
    const model = WebGL.rectangleModel(100, 100, 80, 120);
    this.solid_shader.setMvp(this.vp.multiplyCopy(model));
    this.solid_shader.setColour(0.25, 0.5, 0.75);
    Shapes.Quad.drawRelative();*/
    //console.log(this.vp);
    this.text_drawer.drawText(this.vp, 50, 50, "hi there", 15);

    /*
    this.solid_shader.use();

    const cm = new SimpleCardModel(60, 100);
    let c_mat = Matrix.TransformationMatrix3x3.translate(150, 100);
    const tr2 = Matrix.TransformationMatrix3x3.translate(0, 120);
    for(let rp = 0; rp >= -0.8; rp-=0.2){
      const rot = Matrix.TransformationMatrix3x3.rotate(this.rotation+rp);
      let m = Matrix.TransformationMatrix3x3.identity();
      //m.multiply(Matrix.TransformationMatrix3x3.rotate(Math.PI));
      //m.multiply(Matrix.TransformationMatrix3x3.rotate(Math.PI/2));
      m.multiply(c_mat);
      //m.multiply(Matrix.TransformationMatrix3x3.rotate(Math.PI/2));
      m.multiply(rot);
      m.multiply(tr2);
      m.multiply(Matrix.TransformationMatrix3x3.rotate(Math.PI));
      cm.draw(new VirtualCard(), this.solid_shader, this.text_drawer, this.vp, m);
    }

    const mx = engine.card_model;
    //cm.draw(new VirtualCard(), this.solid_shader, this.text_drawer, this.vp, mx);
    */

    for(const v of engine.deck_visuals){
      engine.base_card_model.draw(v.card, this.solid_shader, this.text_drawer, this.vp, v.transformation_matrix, v.colour);
    }

    engine.button1.draw(this.vp, this.solid_shader, this.text_drawer);
    engine.button2.draw(this.vp, this.solid_shader, this.text_drawer);
    engine.button3.draw(this.vp, this.solid_shader, this.text_drawer);
    engine.buttons.draw(this.vp, this.solid_shader, this.text_drawer);

    this.solid_shader.use();
    engine.base_card_model.draw(new VirtualCard(), this.solid_shader, this.text_drawer, this.vp, engine.vis_card.transformation_matrix, engine.vis_card.colour);

    //requestAnimationFrame((t) => this.render(engine));
  }
  
}