import * as WebGL from "../../WebGL/globals";

WebGL.Grid.Generic.Grid2DInterface

import Grid = WebGL.Grid;

type Int32 = number;

export class TetrisEngine{
  grid: Grid.Generic.GenericGrid2D<Int32>;

  grid_interface:  Grid.Generic.Grid2DInterface;
  constructor(){
    this.grid = new Grid.Generic.GenericGrid2D<Int32>(10, 10);
    this.grid_interface = new Grid.Generic.Grid2DInterface();
  }
}