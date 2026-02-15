

export function fetchPublicFile(fn: string){
  fetch(`/letters_Sheet.txt`).then((res) => {
      console.log(res);
      return res.text();
    }).then((text) => {
      console.log(text);
    }).catch((error) => {
      console.log(error);
    });
}