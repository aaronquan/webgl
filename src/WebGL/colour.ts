
type Float = number;
type Int32 = number;
export type ColourRGB = {
  red: Float;
  green: Float;
  blue: Float;
}

export type ColourRGBA = ColourRGB & {
  alpha: Float;
}

export class ColourRGBCollection{
  colour_map: Map<string, ColourRGB>;
  constructor(){
    this.colour_map = new Map();
  }
  getColour(cs: string): ColourRGB | undefined{
    return this.colour_map.get(cs);
  }
  addBaseColours(){
    this.colour_map.set("black", ColourUtils.black());
    this.colour_map.set("white", ColourUtils.white());
    this.colour_map.set("red", ColourUtils.red());
    this.colour_map.set("green", ColourUtils.green());
    this.colour_map.set("blue", ColourUtils.blue());
    this.colour_map.set("yellow", ColourUtils.yellow());
    this.colour_map.set("pink", ColourUtils.pink());
    this.colour_map.set("cyan", ColourUtils.cyan());

  }
}


export class ColourUtils{
  static mix(c1: ColourRGB, c2: ColourRGB): ColourRGB{
    const red = (c1.red+c2.red)*0.5;
    const green = (c1.green+c2.green)*0.5;
    const blue = (c1.blue+c2.blue)*0.5;
    return {red, green, blue};
  }
  static fromRGB(red: Float, green: Float, blue: Float): ColourRGB{
    return {red, green, blue};
  }
  static toRGBA(colour: ColourRGB, alpha: Float): ColourRGBA{
    return {...colour, alpha};
  }
  static black(): ColourRGB{
    return this.fromRGB(0, 0, 0);
  }
  static white(): ColourRGB{
    return this.fromRGB(1, 1, 1);
  }
  static red():ColourRGB{
    return this.fromRGB(1, 0, 0);
  }
  static green():ColourRGB{
    return this.fromRGB(0, 1, 0);
  }
  static blue():ColourRGB{
    return this.fromRGB(0, 0, 1);
  }
  static yellow():ColourRGB{
    return this.fromRGB(1, 1, 0);
  }
  static pink():ColourRGB{
    return this.fromRGB(1, 0, 1);
  }
  static cyan():ColourRGB{
    return this.fromRGB(0, 1, 1);
  }
  static grey(a: Float=0.5): ColourRGB{
    return this.fromRGB(a, a, a);
  }
  static random(): ColourRGB{
    return this.fromRGB(Math.random(), Math.random(), Math.random());
  }
  static fromHex(hex:string): ColourRGB{
    if(hex.length < 6) return this.white();
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return this.fromRGB(r/255, g/255, b/255);
  }
  static linearTransitionColours(c1: ColourRGB, c2: ColourRGB, n: Int32): ColourRGB[]{
    const colours: ColourRGB[] = [];
    const step_r = (c2.red-c1.red)/(n+1);
    const step_g = (c2.green-c1.green)/(n+1);
    const step_b = (c2.blue-c1.blue)/(n+1);

    for(let i = 1; i <= n; i++){
      const col = ColourUtils.fromRGB(c1.red+step_r*i, c1.green+step_g*i, c1.blue+step_b*i);
      colours.push(col);
    }

    return colours;
  }
}