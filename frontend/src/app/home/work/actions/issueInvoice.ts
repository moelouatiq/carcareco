'use server';
import { pushToast } from "@/_lib/server/pushToast";
import { httpPut } from "@/_lib/server/query-api";
import { redirect } from "next/navigation";


export async function issueInvoice({
    workId,
    dueDays,
    paymentType,
    sendClientEmail,
    clientEmail,
    showVehicleOnInvoice
}:{
    workId:string,
    dueDays:number,
    paymentType:number,
    sendClientEmail:boolean,
    clientEmail:string, 
    showVehicleOnInvoice:boolean,
}) {

    const response = await httpPut({
        url: `work/${workId}/invoice/issue`,
        body: {
            dueDays,
            paymentType,
            sendClientEmail,
            clientEmail,
            // Decides what this invoice captures as it is issued; documents already sent are
            // untouched, because the lines are stored on the document, not read back later.
            showVehicleOnInvoice
        }
    });
    await response.text();
    pushToast('Intervention terminée et facture émise avec succès.')
    redirect(`/home/work/${workId}`);
}
