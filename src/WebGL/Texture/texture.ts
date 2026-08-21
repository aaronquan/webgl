import WebGL from "./../globals";
import * as File from "./../Util/file"
import * as Shader from "./../Shaders/custom"

type Int32 = number;

type VoidFunction = () => void;
type ErrorFunction = (e: any) => void;
const EmptyErrorFunction = (e: any) => {};

const EmptyFunction = () => {};


interface GenericTexture{
  load: (onLoad: VoidFunction, onError: ErrorFunction) => void;
  active: (id: Int32) => boolean;
  isLoaded: () => boolean;
}

//canvas texture
export class CanvasTexture implements GenericTexture{
  texture: WebGLTexture | undefined;
  img_data: ImageData | undefined;
  private is_loaded: boolean;
  constructor(){
    this.is_loaded = false;
  }
  setImageData(data: ImageData){
    this.img_data = data;
  }
  load(onLoad: VoidFunction){
    const gl = WebGL.gl;
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
    const gl = WebGL.gl;
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
    const gl = WebGL.gl;
    if(gl){
      img.onload = () => {
        if(WebGL.gl){
          const gl = WebGL.gl;
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          this.textures_loaded++;
        }
      }
    }
    return new Texture(url);
  }

  static textures_loaded: Int32 = 0;
  static textures_requested: Int32 = 0;
  static textures_failed: Set<string> = new Set();
  static path = "/";


  texture: WebGLTexture | undefined;
  is_loaded: boolean;
  url: string
  constructor(fn: string){
    //const gl = WebGL.gl;
    this.url = Texture.path+fn;
    this.is_loaded = false;
  }
  load(onLoad:VoidFunction=EmptyFunction, onError:ErrorFunction=EmptyErrorFunction){
    console.log(this.url);
    if(!this.is_loaded){
      Texture.textures_requested++;
      const gl = WebGL.gl;
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
    const gl = WebGL.gl;
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
}

export class TextureCollection{
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
    function finishLoading(fl: TextureCollection){
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


//export class Texture