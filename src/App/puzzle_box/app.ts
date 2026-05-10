import * as WebGL from "./../../WebGL/globals";
import { PuzzleEngine } from "./engine";
import { PuzzleRenderer } from "./renderer";

type Int32 = number;
export function newPuzzleApp(w: Int32, h:Int32): WebGL.App.App<PuzzleEngine>{
  const engine = new PuzzleEngine();
  const renderer = new PuzzleRenderer(w, h);
  return new WebGL.App.App(engine, renderer);
}