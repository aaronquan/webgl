import WebGL from "../../WebGL/globals"
import * as App from "../app"
import * as Shader from "../../WebGL/Shaders/custom"
import * as Texture from "../../WebGL/Texture/texture"
import * as Matrix from "../../WebGL/Matrix/matrix"
import * as Shapes from "../../WebGL/Shapes/Shapes"
import * as WebGLGlobals from "../../WebGL/globals"

type Int32 = number;

const CardSuitEnum = {
  Spade: 0,
  Heart: 1,
  Club: 2,
  Diamond: 3
} as const;

type CardSuit = (typeof CardSuitEnum)[keyof typeof CardSuitEnum];

const CardNumberEnum = {
  Ace: 1
} as const;

type CardNumber = (typeof CardNumberEnum)[keyof typeof CardNumberEnum];

class Card{
  suit: CardSuit;
  number: CardNumber;
  constructor(){
    this.suit = CardSuitEnum.Spade;
    this.number = CardNumberEnum.Ace;
  }

  static toNumberChar(n: CardNumber){
    switch(n){
      case CardNumberEnum.Ace:
        return "A";
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

export class CardEngine extends App.BaseEngine{
  cards: Card[];

  constructor(){
    super();
    this.cards = [new Card()];
  }
}

type VoidFunction = () => void;

export class CardRenderer implements App.IEngineRenderer<CardEngine>{
  solid_shader: Shader.MVPColourProgram;
  sprite_sheet_shader: Shader.MVPSpriteSheetProgram;

  //font: Texture.CustomFont;

  text_drawer: WebGLGlobals.TextDrawer;
  loader: App.RendererLoader;

  width: Int32;
  height: Int32;
  vp: Matrix.TransformationMatrix3x3;
  constructor(w: Int32, h: Int32){
    this.solid_shader = new Shader.MVPColourProgram();
    this.sprite_sheet_shader = new Shader.MVPSpriteSheetProgram();

    this.width = w;
    this.height = h;

    /*
    this.font = new Texture.CustomFont("letters-Sheet.png");
    this.font.load();
    this.font.active(0);*/

    this.vp = Matrix.TransformationMatrix3x3.orthographic(0, this.width, this.height, 0);
    this.text_drawer = new WebGLGlobals.TextDrawer();
  }
  loadShaders(){

  }
  loadResources(onLoad:VoidFunction=()=>{}){
    this.text_drawer.loadFont();
  }
  render(time: number, engine: CardEngine){
    this.text_drawer.drawText(this.vp, 0, 0, "hi there", 15);
    //const c1 = engine.cards[0];
    this.solid_shader.use();
    const model = WebGL.rectangleModel(100, 100, 80, 120);
    this.solid_shader.setMvp(this.vp.multiplyCopy(model));
    this.solid_shader.setColour(0.25, 0.5, 0.75);
    Shapes.Quad.draw();
    console.log(this.vp);
    this.text_drawer.drawText(this.vp, 50, 50, "hi there", 15);
  }
  
}