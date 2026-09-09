'use server';
import { httpGet } from "@/_lib/server/query-api";
import { parseContentDispositionFileName } from "@/_lib/content-disposition";


export async function downloadPricingHtml({
    pricingId,
    pricingName,
}:{
    pricingId:string,
    pricingName:string,
}) {
    const response = await httpGet(`pricings/${pricingName}/${pricingId}/html`);

    return await response.text();
}

export async function downloadPricingPdf({
    pricingId,
    pricingName,
}:{
    pricingId:string,
    pricingName:string,
}) {
    const response = await httpGet(`pricings/${pricingName}/${pricingId}/pdf`);

    // The backend names the document (Invoice/Estimate.GetFileName), so the browser saves it
    // under the same name it carries in email and everywhere else.
    return {
        blob: await response.blob(),
        fileName: parseContentDispositionFileName(response.headers.get("content-disposition")),
    };
}
