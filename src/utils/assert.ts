const is_dev = process.env.NODE_ENV === "development";
export function assertNotNull<T>(v: T): asserts v is NonNullable<T>{
  if(is_dev){
    if (v === null || v === undefined) {
      throw Error("Not Null");
    }
  }
}