import WebGL from "./../globals";

type Int32 = number;
export class Texture{
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
    load(){
        if(!this.is_loaded){
            Texture.textures_requested++;
            const gl = WebGL.gl;
            if(gl != undefined){
                const img = new Image();
                img.src = this.url;
                img.onload = () => {
                    console.log(`Loaded ${this.url}`);
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
                }
            }
        }
    }
    active(id: Int32){
        const gl = WebGL.gl;
        if(this.texture && gl != undefined){
            gl.activeTexture(gl.TEXTURE0+id);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
    }
}

export class TextureCollection{

}

export class CustomFont{
    
}

//export class Texture