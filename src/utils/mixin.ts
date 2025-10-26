export type Constructor = new (...args: any[]) => {};
export type GConstructor<T = {}> = new (...args: any[]) => T;

class V{
  protected val: number;
  constructor(){
    this.val = 0;
  }
  get v(){
    return this.val;
  }
}

type Vable = GConstructor<V>;

function Add1<TBase extends Vable>(Base: TBase){
  return class Add extends Base{
    add1(){
      this.val += 1;
    }
  }
}



const Inc = Add1(V);

const i = new Inc();
console.log(i.v);
i.add1();
console.log(i.v);