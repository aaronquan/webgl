import * as Grid from "./grid";

export const GridCellSectionEnum =  {
  ...Grid.DirectionEnum,
  Center: 4
} as const;

export type GridCellSection = (typeof GridCellSectionEnum)[keyof typeof GridCellSectionEnum];

export const WallEditStateEnum = {
  Default: 0,
  Adding: 1,
  Deleting: 2,
  Selecting: 3
} as const;

export type WallEditState = (typeof WallEditStateEnum)[keyof typeof WallEditStateEnum];

export class ConstUtil{
  static cellSectionToString(cs: GridCellSection){
    return cs === GridCellSectionEnum.Center ? "Center" : Grid.DirectionUtil.toString(cs as Grid.GridDirection);
  }
  static side_to_direction = {
    [GridCellSectionEnum.Left]: Grid.DirectionEnum.Left,
    [GridCellSectionEnum.Down]: Grid.DirectionEnum.Down,
    [GridCellSectionEnum.Right]: Grid.DirectionEnum.Right,
    [GridCellSectionEnum.Up]: Grid.DirectionEnum.Up
  }
}

export type PositionSide = {
  position: Grid.GridPosition;
  side: GridCellSection;

}