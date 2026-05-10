import * as WebGL from "./../../WebGL/globals";
import * as Options from "./../../Interface/options";


export class PuzzleEngine extends WebGL.App.BaseEngine{
  option_select: Options.DropdownOptions;
  mouse_point: WebGL.Matrix.Point2D | undefined;
  constructor(){
    super();
    this.option_select = new Options.DropdownOptions(100, 100, 150, 25, ["hello", "good", "bye"]);
  }
  override handleKeyDown(ev: KeyboardEvent){};
  //to override
  override handleKeyUp(ev: KeyboardEvent){};
  //to override
  override handleMouseMove(ev: MouseEvent){
    const point = new WebGL.Matrix.Point2D(ev.clientX, ev.clientY);
    this.mouse_point = point;
    this.option_select.onMouseOver(point);
  };
  //to override
  override handleMouseDown(ev: MouseEvent){
    if(this.mouse_point != undefined){  
      this.option_select.onMouseDown(this.mouse_point);
    }
  };
  //to override
  override handleMouseUp(ev: MouseEvent){};
}