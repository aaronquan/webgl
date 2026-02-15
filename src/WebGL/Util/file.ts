export function fetchPublicFile(fn: string, success:(text: string) => void, 
error:(reason: any) => void=(e)=>{console.log(e)}){
  fetch(`/${fn}`).then((res) => {
    //console.log(res);
    return res.text();
  }).then((text) => {
    success(text);
  }).catch((e) => {
    error(e);
  });
}