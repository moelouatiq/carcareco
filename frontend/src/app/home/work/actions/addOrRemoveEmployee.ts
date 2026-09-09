'use server'

import {  httpPost, httpDelete } from "@/_lib/server/query-api";
import {  pushToast } from "@/_lib/server/pushToast"; 


export async function removeEmployee(
    id : string,
    ) {
        
      const body = [id]; 
      await httpDelete({
        url:"employees",
        body:body
      })
      pushToast(`Mécanicien retiré.`) 
}


export async function addEmployee(
  newName : string,
  ) {
     
    const locationResponse = await httpPost({
      url:"employees",
      body:{
        firstName:newName,
        lastName:''
      }
    })

    const newLocationId = await locationResponse.json();

    pushToast(`Nouveau mécanicien ajouté avec succès.`) 

    return newLocationId;
}
