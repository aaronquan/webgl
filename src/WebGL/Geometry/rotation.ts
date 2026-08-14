export const RotationEnum = {
  None: 0,
  Right: 1,
  Down: 2,
  Left: 3
} as const;

export type Rotation = (typeof RotationEnum)[keyof typeof RotationEnum];

export class RotationUtil{
  static clockwise(rot: Rotation): Rotation{
    switch(rot){
      case RotationEnum.None:
        return RotationEnum.Right;
      case RotationEnum.Right:
        return RotationEnum.Down;
      case RotationEnum.Down:
        return RotationEnum.Left;
      case RotationEnum.Left: 
        return RotationEnum.None;
    }
  }
  static anticlockwise(rot: Rotation): Rotation{
    switch(rot){
      case RotationEnum.None:
        return RotationEnum.Left;
      case RotationEnum.Left:
        return RotationEnum.Down;
      case RotationEnum.Down:
        return RotationEnum.Right;
      case RotationEnum.Right: 
        return RotationEnum.None;
    }
  }
}