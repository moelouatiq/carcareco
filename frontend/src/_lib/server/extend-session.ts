'use server'

import { httpPost } from "./query-api"; 

 
export async function extendSession() {
    //TODO fix
    const response = await httpPost(
        {
          url:'users/extendsession' , 
          body : {},  
        }
      )
    if(response.ok){
      //const jwt = await response.text();
      //return createSession(jwt);
    }
    return null 
  }
