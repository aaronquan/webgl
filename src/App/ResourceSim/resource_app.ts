
import * as WebGL from "./../../WebGL/globals";
import { ResourceSimEngine } from "./resource_engine";
import { ResourceSimRenderer } from "./resource_renderer";

type Int32 = number;

export function newApp(w: Int32, h: Int32): WebGL.App.App<ResourceSimEngine>{
  const engine = new ResourceSimEngine(w, h);
  const renderer = new ResourceSimRenderer(w, h);

  return new WebGL.App.App(engine, renderer);
}