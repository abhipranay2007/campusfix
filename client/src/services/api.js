const BASE='/api/v1';
export async function api(path,options={}){
 const response=await fetch(`${BASE}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok){const error=new Error(data.error?.message||'Something went wrong. Please try again.');error.status=response.status;error.code=data.error?.code;throw error}
 return data;
}
