import * as WebGL from "./../globals";
import * as File from "./../Util/file"
import * as Shader from "./../Shaders/custom"
import { Generic } from "../Grid/grid";

type Int32 = number;

type VoidFunction = () => void;
type ErrorFunction = (e: any) => void;
const EmptyErrorFunction = (e: any) => {};

const EmptyFunction = () => {};


interface GenericTexture{
  load: (onLoad: VoidFunction, onError: ErrorFunction) => void;
  active: (id: Int32) => boolean;
  isLoaded: () => boolean;
  getDimensions: () => TextureDimensions;
}

type TextureDimensions = {
  width: Int32,
  height: Int32
}

//canvas texture
export class CanvasTexture implements GenericTexture{
  texture: WebGLTexture | undefined;
  img_data: ImageData | undefined;
  private dimensions: TextureDimensions;
  private is_loaded: boolean;
  constructor(){
    this.is_loaded = false;
    this.dimensions = {width: 0, height: 0};
  }
  setImageData(data: ImageData){
    this.img_data = data;
    this.dimensions = {width: data.width, height: data.height};
  }
  load(onLoad: VoidFunction){
    const gl = WebGL.WebGL.gl;
    if(gl != undefined && this.img_data != undefined && !this.is_loaded){
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.img_data.width, this.img_data.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.img_data);

      this.img_data = undefined; // if bugged, comment out this line, texture might need data pointer
      this.is_loaded = true;
      console.log("loaded canvas texture");
      onLoad();
    }
  }
  active(id: Int32): boolean{
    const gl = WebGL.WebGL.gl;
    if(this.texture && this.is_loaded && gl != undefined){
      gl.activeTexture(gl.TEXTURE0+id);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      return true;
    }
    return false;
  }
  isLoaded(){
    return this.is_loaded;
  }
  getDimensions(): TextureDimensions{
    return this.dimensions;
  }
}

//URL texture
export class Texture implements GenericTexture{
  static setup(){
    //not needed? should be set after each texture load?
    /*
    if(WebGL.gl){
      const gl = WebGL.gl;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }*/
  }
  static createTextureFromUrl(url: string): Texture{
    const img = new Image();
    img.src = url;
    this.textures_requested++;
    const gl = WebGL.WebGL.gl;
    if(gl != undefined){
      img.onload = () => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        this.textures_loaded++;
      }
    }
    const dims = {
      width: img.width,
      height: img.height
    }
    return new Texture(url, dims);
  }

  static textures_loaded: Int32 = 0;
  static textures_requested: Int32 = 0;
  static textures_failed: Set<string> = new Set();
  static path = "/";


  texture: WebGLTexture | undefined;
  is_loaded: boolean;
  url: string;
  dimensions: TextureDimensions;
  constructor(fn: string, dims: TextureDimensions={width:0, height:0}){
    //const gl = WebGL.gl;
    this.url = Texture.path+fn;
    this.is_loaded = false;
    this.dimensions = dims;
  }
  load(onLoad:VoidFunction=EmptyFunction, onError:ErrorFunction=EmptyErrorFunction){
    if(!this.is_loaded){
      Texture.textures_requested++;
      const gl = WebGL.WebGL.gl;
      if(gl != undefined){
        const img = new Image();
        img.src = this.url;
        img.onload = () => {
          console.log(`Loaded texture ${this.url}`);
          this.texture = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          Texture.textures_loaded++;
          this.is_loaded = true;
          this.dimensions = {width: img.width, height: img.height};
          onLoad();
        }
        img.onerror = (e) => {
          onError(e);
        }
      }
    }else{
      onLoad();
    }
  }
  //static loadList
  active(id: Int32): boolean{
    const gl = WebGL.WebGL.gl;
    if(this.texture && this.is_loaded && gl != undefined){
      gl.activeTexture(gl.TEXTURE0+id);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      return true;
    }

    return false;
  }
  isLoaded(): boolean{
    return this.is_loaded;
  }
  getDimensions(): TextureDimensions{
    return this.dimensions;
  };
}

interface TextureCollection{
  //addTexture: (key: string, texture: GenericTexture) => void;
  active: (key: string, id: Int32) => boolean;
  getDimensions: (key: string) => TextureDimensions | undefined;
}

export class GenericTextureCollection implements TextureCollection{
  textures: Map<string, GenericTexture>;
  loaded: Int32;
  loading: boolean;
  to_load: GenericTexture[]; // active to loading for 
  finished_loading: Int32;
  constructor(){
    this.textures = new Map();
    this.loaded = 0;
    this.loading = false;
    this.to_load = [];
    this.finished_loading = 0;
  }
  active(key: string, id: Int32): boolean{
    if(this.textures.has(key)){
      const tex = this.textures.get(key)!;
      if(!tex.isLoaded()) return false;
      tex.active(id);
      return true;
    }
    return false;
  }
  getTexture(key: string): GenericTexture | undefined{
    return this.textures.get(key);
  }
  addTexture(key: string, texture: GenericTexture){
    this.textures.set(key, texture);
  }
  load(onAllLoaded: VoidFunction=EmptyFunction){
    function finishLoading(fl: GenericTextureCollection){
      if(fl.finished_loading == fl.to_load.length){
        console.log("end loading texture collection");
        onAllLoaded();
        fl.loading = false;
      }
    }
    if(!this.loading){
      console.log("start loading textures");
      this.loading = true;
      this.to_load = [];
      for(const [name, tex] of this.textures){
        if(!tex.isLoaded()) this.to_load.push(tex);
      }

      for(const tex of this.to_load){
        tex.load(() => {
          this.loaded++;
          this.finished_loading++;
          console.log(`finished ${name}`);
          finishLoading(this);
        },
        () => {
          console.log(`error loading ${tex}`);
          this.finished_loading++;
          finishLoading(this);
        });
      }
    }
  }
  addFromUrl(key: string, file: string){
    const texture = new Texture(file);
    this.textures.set(key, texture);
  }
  getDimensions(key: string): TextureDimensions | undefined{
    if(!this.textures.has(key)){
      return undefined;
    }
    return this.textures.get(key)!.getDimensions();
  }
}

type SpriteSheetPosition = {
  x: Int32;
  y: Int32;
}
type Char = string;

interface FontSheetShader{
  setWidth: (w: Int32) => void;
  setHeight: (h: Int32) => void;
  setX: (x: Int32) => void;
  setY: (y: Int32) => void;
}

export class CustomFont{
  coord_to_sheet_position: Map<Char, SpriteSheetPosition>
  font_sheet: Texture;
  font_name: string;
  loaded: boolean;
  width: Int32;
  height: Int32;

  static alphabet = "abcdefghijklmnopqrstuvwxyz";
  
  //fn requires extension e.g. .png
  constructor(font_sheet_fn: string){
    this.font_sheet = new Texture(font_sheet_fn);
    this.font_name = font_sheet_fn.split('.')[0];
    this.loaded = false;
    this.coord_to_sheet_position = new Map();
    this.width = 0;
    this.height = 0;
    //test font settings
    //this.coord_to_sheet_position.set("a", {x: 0, y: 0});
    //this.coord_to_sheet_position.set("b", {x: 1, y: 0});
    //this.coord_to_sheet_position.set("c", {x: 2, y: 0});
  }
  active(id: Int32){
    this.font_sheet.active(id);
  }
  load(onLoaded:()=>void=()=>{}, onError?: (e: any) => void){
    console.log("loading");
    this.font_sheet.load(
      () =>
      File.fetchPublicFile(`${this.font_name}.txt`, (txt) => {
        const sp_var = txt.indexOf("\r\n") == -1 ? "\n" : "\r\n";
        const sp = txt.split(sp_var);
        const dims = sp[0].split(' ');
        this.width = parseInt(dims[0]);
        this.height = parseInt(dims[1]);
        for(let i = 1; i < sp.length; i++){
          const x = (i-1)%this.width;
          const y = Math.floor((i-1)/this.width);
          for(let j = 0; j < sp[i].length; j++){
            this.coord_to_sheet_position.set(sp[i][j], {x, y});
          }
        }
        console.log(`Font: loaded success, ${this.font_name}`);
        onLoaded();
        this.loaded = true;
      },
      (e) => {
        console.log(`${this.font_name}.txt - error`);
        if(onError) onError(e);
      }), 
      (e) => { 
        if(onError) onError(e);
      }
    );
  }

  setChar(shader: FontSheetShader, char: Char){
    shader.setWidth(this.width);
    shader.setHeight(this.height);
    const coord = this.coord_to_sheet_position.get(char);
    if(coord != undefined){
      shader.setX(coord.x);
      shader.setY(coord.y);
    }
  }
}

class FontGlyph extends CanvasTexture{
  font_width: Int32;
  char: string;
  constructor(w: Int32, c: string, img: ImageData){
    super();
    this.font_width = w;
    this.char = c;
    this.img_data = img;
  }
}

class GlyphCollection implements TextureCollection{
  texture_map: Map<string, FontGlyph>;
  constructor(){
    this.texture_map = new Map();
  }
  has(ch: string):boolean{
    return this.texture_map.has(ch);
  }
  addTexture(key: string, glyph: FontGlyph){
    this.texture_map.set(key, glyph);
  }
  active(key: string, id: Int32): boolean{
    if(this.texture_map.has(key)){
      const tex = this.texture_map.get(key)!;
      if(!tex.isLoaded()) return false;
      tex.active(id);
      return true;
    }
    return false;
  }
  getDimensions(key: string): TextureDimensions | undefined{
    if(!this.texture_map.has(key)) return undefined;
    return this.texture_map.get(key)!.getDimensions();
  }
  getCharWidth(ch: string): Int32 | undefined{
    return this.texture_map.get(ch)!.font_width;
  }
}

export class Canvas2DFont{
  font_style: string;
  font_size: Int32;
  collection: GlyphCollection;
  
  private loaded: boolean;
  static canvas = new OffscreenCanvas(500, 500);
  static canvas_loaded = false;
  static alphabet = "abcdefghijklmnopqrstuvwxyz";
  constructor(style: string, size: Int32){
    this.font_style = style;
    this.font_size = size;
    this.collection = new GlyphCollection();
    this.loaded = false;
    Canvas2DFont.load();
  }
  static load(){
    //maybe not needed
    if(!Canvas2DFont.canvas_loaded){
      
      Canvas2DFont.canvas_loaded = true;
    }
  }
  loadTextures(){
    if(this.loaded){
      return;
    }
    const canvas = Canvas2DFont.canvas;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.font = `${this.font_size.toString()}px ${this.font_style}`;
    ctx.textBaseline = "top"; // to draw from y at top

    //try adding all the alphabet
    for(const ch of Canvas2DFont.alphabet){
      ctx.fillText(ch, 0, 0);
      const metrics = ctx.measureText(ch);
      //console.log(metrics);
      const char_width = Math.ceil(metrics.width);
      const w = Math.max(metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft, char_width);
      const h = this.font_size;
      const img = ctx.getImageData(0, 0, w, h);
      const tex = new FontGlyph(char_width, ch, img);
      tex.setImageData(img);
      tex.load(() => {});
      this.collection.addTexture(ch, tex);
      ctx.clearRect(0, 0, w+1, h+1);
    }


    this.loaded = true;
  }

  drawExample(
    vp: WebGL.Matrix.TransformationMatrix3x3, 
    texture_shader: WebGL.Shader.MVPTextureProgram
  ){
    this.loadTextures();
    WebGL.WebGL.enableBlend();
    let x = 0;
    for(const ch of Canvas2DFont.alphabet){
      this.collection.active(ch, 1);
      const dims = this.collection.getDimensions(ch)!;

      const model = WebGL.WebGL.rectangleModel(x, 0, dims.width, dims.height);

      texture_shader.use();
      texture_shader.setTextureId(1);
      texture_shader.setMvp(vp.multiplyCopy(model));
      x += this.collection.getCharWidth(ch)!;
      WebGL.Shapes.Quad.drawRelative();
    }

    WebGL.WebGL.disableBlend();
  }

  drawText(vp: WebGL.Matrix.TransformationMatrix3x3,
    texture_shader: WebGL.Shader.MVPTextureColourProgram,
    x: Int32, y: Int32,
    text: string,
    colour: WebGL.Colour.ColourRGB=WebGL.Colour.ColourUtils.white()
  ){
    texture_shader.use();
    texture_shader.setTextureId(0);
    texture_shader.setColourFromColourRGB(colour);
    WebGL.WebGL.enableBlend();
    let dx = x;
    for(const ch of text){
      if(!this.collection.has(ch)){
        continue;
      }
      this.collection.active(ch, 0);
      const dims = this.collection.getDimensions(ch)!;
      const model = WebGL.WebGL.rectangleModel(dx, y, dims.width, dims.height);
      texture_shader.setMvp(vp.multiplyCopy(model));
      WebGL.Shapes.Quad.drawRelative();
      dx += this.collection.getCharWidth(ch)!;
    }
    WebGL.WebGL.disableBlend();
  }


}

//export class Texture