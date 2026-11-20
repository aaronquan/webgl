import * as WebGL from "./../globals";
import * as Scroll from "./scroll_bar";
import * as InterfaceElement from "./interface_element";

type Int32 = number;
type Float = number;

type Point2D = WebGL.Geometry.Base.Point2D | WebGL.Matrix.Point2D;

export class ScrollInterfaceElement extends InterfaceElement.InterfaceElement{
	horizontal_scroll_bar: Scroll.HorizontalScrollBar;
	vertical_scroll_bar: Scroll.VerticalScrollBar;
	scroll_width: Int32;
	content_width: Int32;
	content_height: Int32;
	constructor(x: Int32, y: Int32, width: Int32, height: Int32,
		content_width: Int32, content_height: Int32, scroll_width: Int32=10
	){
		super(x, y, width, height);
		this.horizontal_scroll_bar = new Scroll.HorizontalScrollBar(
			this.x, this.y+this.height-scroll_width, 
			this.width-scroll_width, scroll_width, 
			this.width-scroll_width, content_width
		);
		this.vertical_scroll_bar = new Scroll.VerticalScrollBar(
			this.x+this.width-scroll_width, this.y,
			scroll_width, this.height-scroll_width,
			this.height-scroll_width, content_height
		);
		this.content_width = content_width;
		this.content_height = content_height;
		this.scroll_width = scroll_width;
	}
	onMouseMove(position: WebGL.Geometry.Base.Point2D){
		this.horizontal_scroll_bar.onMouseMove(position);
		this.vertical_scroll_bar.onMouseMove(position);
	}
	onMouseDown(position: WebGL.Geometry.Base.Point2D){
		this.horizontal_scroll_bar.onMouseDown(position);
		this.vertical_scroll_bar.onMouseDown(position);
	}
	onMouseUp(){
		this.horizontal_scroll_bar.onMouseUp();
		this.vertical_scroll_bar.onMouseUp();
	}
	contentOffsetX(): Int32{
		return this.x + this.horizontal_scroll_bar.windowOffsetX();
  }
	contentOffsetY(): Int32{
		return this.y + this.vertical_scroll_bar.windowOffsetY();
	}
	enableScissors(){
		WebGL.WebGL.enableScissor(this.x, this.y, this.width-this.scroll_width, this.height-this.scroll_width);
	}
	disableScissors(){
		WebGL.WebGL.disableScissor();
	}
	draw(vp: WebGL.Matrix.TransformationMatrix3x3, colour_shader: WebGL.Shader.MVPColourProgram, bg_colour: WebGL.Colour.ColourRGB){
		this.drawBackground(vp, colour_shader, bg_colour);
		this.horizontal_scroll_bar.draw(vp, colour_shader);
		this.vertical_scroll_bar.draw(vp, colour_shader);

		//draw extra scroll square in bottom right
		WebGL.WebGL.drawColourRect(vp, colour_shader, this.horizontal_scroll_bar.x+this.horizontal_scroll_bar.width, 
			this.vertical_scroll_bar.y+this.vertical_scroll_bar.height, this.scroll_width, this.scroll_width, WebGL.Colour.ColourUtils.grey());
	}
}