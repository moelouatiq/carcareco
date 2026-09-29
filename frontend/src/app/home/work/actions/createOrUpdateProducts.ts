'use server'

import { httpPut  } from "@/_lib/server/query-api";
import {  pushToast } from "@/_lib/server/pushToast";
import { redirect } from "next/navigation"; 
import { productsFromFormData } from "./productsFromFormData";

export async function createOrUpdateProducts(formData: FormData) {
       
    const workId = formData.get('workId');
   
    const activityId = formData.get('activityId');
    const activityNumber= formData.get('activityNumber');
    const activityName = formData.get('activityName');
    const redirectUrl = `/home/work/${workId}/${activityId}` ;
    const apiUrl = `work/${activityName}/${activityId}/productsorservices`;
    
    const body = productsFromFormData(formData);

     //isVehicelLinesOnPricing
    // const notes = formData.get('notes');
    //{id}/offer/{offerNumber}

    await httpPut({
        url:`work/${workId}/${activityName}/${activityNumber}`,
        body:{
            isVehicelLinesOnPricing:formData.get('isVehicelLinesOnPricing') == 'on',
            notes:formData.get('notes')
        }
    })

    const response =await httpPut({url:apiUrl,body});

    await response.text();
       
    pushToast(`Pièces et prestations mises à jour avec succès.`)

    redirect(redirectUrl)  
}
