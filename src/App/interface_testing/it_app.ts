import * as WebGL from "./../../WebGL/globals";
import { ITEngine } from "./it_engine";
import { ITRenderer } from "./it_renderer";

type Int32 = number;

export function newITApp(w: Int32, h: Int32): WebGL.App.App<ITEngine>{
  const engine = new ITEngine();
  const renderer = new ITRenderer(w, h);
  return new WebGL.App.App<ITEngine>(engine, renderer);
}