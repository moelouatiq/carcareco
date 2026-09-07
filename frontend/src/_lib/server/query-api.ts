'server-only'
import { redirect } from "next/navigation";
import { getJwt } from "./session"; 
import { headers } from "next/headers";
import { pushToast } from "./pushToast";

interface IAPICall
{
  url:string,
  authorize? : boolean,
  body?: any | null, // eslint-disable-line @typescript-eslint/no-explicit-any
  method: string
}

async function apiCall({
  url,
  authorize=true,
  method,
  body =null
}:IAPICall) { 
  const  requestHeaders:HeadersInit =   {
   "Content-Type": "application/json",
  };
  if(authorize) { 
    const jwt = await getJwt(); 
    if (!jwt) redirect('/auth/login');
    requestHeaders["Authorization"] =  'Bearer ' + jwt;
  } 
  const fullUrl = process.env.API_URL +`/api/${url}`;
  const request = {
    method,
    headers: requestHeaders,
    body : body? JSON.stringify(body):null
  };
   
  const response = await fetch(fullUrl,request);
  if (!response.ok) {
    const responseText = await response.text();
    const hasContentType = response.headers.has('Content-Type');
    let message = 'API Error occurred server side';
    let isUserError = false;
    if(hasContentType){
      const contentType = response.headers.get('Content-Type');
      if(contentType?.startsWith('application/json'))
      {
        const responseJson = JSON.parse(responseText);
        if (responseJson.exceptionMessage) {
            message = responseJson.exceptionMessage;
        }
        if(responseJson.isUserError)
          {
            isUserError = true;
          }
      } 
    }
  
    if(isUserError)
      {
        const headersList = await headers()
        const currentPath = headersList.get('currentPath')
  
        if(currentPath){
          pushToast(message,true);
          redirect(currentPath)  
        }
      }

     redirect(`/error?code=${response.status}`)
  }
  return response;
}

export async function httpGet(url: string) {
    return apiCall({
      url,
      method:"GET"
    }); 
}

export async function httpDelete({
  url,
  body
}:{
  url:string,
  body:any,// eslint-disable-line @typescript-eslint/no-explicit-any 
}) {
  return apiCall({
    url,
    method:"DELETE", 
    body, 
  }); 
}

export async function httpPost({
  url,
  body, 
  authorize=true, 
}:{
  url:string,
  body:any,// eslint-disable-line @typescript-eslint/no-explicit-any
  authorize?: boolean | undefined 
}) {
  return apiCall({
    url,
    method:"POST",
    authorize,
    body, 
  }); 
}

export async function httpPut({
  url,
  body, 
  authorize=true, 
}:{
  url:string,
  body:any,// eslint-disable-line @typescript-eslint/no-explicit-any
  authorize?: boolean | undefined
  verboseLog?: boolean | undefined
}) {
  return apiCall({
    url,
    method:"PUT",
    authorize,
    body, 
  }); 
}
