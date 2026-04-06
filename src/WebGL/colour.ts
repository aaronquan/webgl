
type Float = number;
export type ColourRGB = {
  red: Float;
  green: Float;
  blue: Float;
}

export type ColourRGBA = ColourRGB & {
  alpha: Float;
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
}