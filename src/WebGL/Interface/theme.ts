import * as WebGL from "./../globals";

type Colour = WebGL.Colour.ColourRGB;

export type InterfaceTheme = {
  primary: Colour;
  secondary: Colour;
  tertiary: Colour;
  background: Colour;
  secondary_background: Colour;
  close: Colour;
  close_hover: Colour;
};