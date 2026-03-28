type Equals = 0;
type LessThan = -1;
type GreaterThan = 1;

type Comparator = LessThan | Equals | GreaterThan;

type Int32 = number;
type Float = number;

export function flatten<T>(arr: T[][]): T[]{
  const flat = [];
  for(const a of arr){
    for(const e of a){
      flat.push(e);
    }
  }
  return flat;
}

export function reverse<T>(arr: T[]){
  const h = Math.floor(arr.length/2);
  for(let i = 0; i < h; i++){
    [arr[i], arr[arr.length-i-1]] = [arr[arr.length-i-1], arr[i]];
  }
  return arr;
}

export function binarySearch<T>(arr: T[], compare: (t:T) => Float): Int32{
  let i = 0;
  let j = arr.length-1;
  while(i <= j){
    const m = Math.trunc((i+j)/2);
    const comp = compare(arr[m]);
    if(comp == 0){
      return m;
    }else if(comp > 0){
      i = m+1;
    }else{ // less
      j = m-1;
    }
  }
  return -1;
}



export function binarySearchUpperBound<T>(arr: T[], compare: (t:T) => Float): Int32{
  let i = 0;
  let j = arr.length-1;
  while(i <= j){
    const m = Math.trunc((i+j)/2);
    const comp = compare(arr[m]);
    if(comp <= 0){
      j = m - 1;
    }else{
      i = m + 1;
    }
  }
  return i;
}

export function binarySearchLowerBound<T>(arr: T[], compare: (t:T) => Float): Int32{
  let i = 0;
  let j = arr.length-1;
  while(i <= j){
    const m = Math.trunc((i+j)/2);
    const comp = compare(arr[m]);
    if(comp >= 0){
      i = m + 1;
    }else{
      j = m - 1;
    }
  }
  return j;
}

export function random0ToN(size: Int32): Int32[]{
  const arr = Array.from({length: size}, (_, i) => i);
  for(let i = arr.length-1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    //new_cards[n] = this.cards[j];

    [arr[j], arr[i]] = [arr[i], arr[j]];
  }
  return arr;
}

function testBinarySearch(){

}