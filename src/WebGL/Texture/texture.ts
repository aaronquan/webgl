import WebGL from "./../globals";

type Int32 = number;
class Texture{
    static setup(){
        if(WebGL.gl){
            const gl = WebGL.gl;
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
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


    texture: WebGLTexture | undefined;
    is_loaded: boolean;
    url: string
    constructor(url: string){
        const gl = WebGL.gl;
        this.url = url;
        this.is_loaded = false;
    }
    load(){
        const gl = WebGL.gl;
        if(gl != undefined){
            const img = new Image();
            img.src = this.url;

            this.texture = gl.createTexture();
        }
    }
}

class TexureCollection{

}

//export class Texture