import { httpGet } from "@/_lib/server/query-api";
import { IUserOptions } from "./model";
import SettingsTabs from "@/_components/SettingsTabs";
import Main from "../_components/Main";
import Link from "next/link";
import { DescriptionItem } from "@/_components/DescriptionItem";
import { labels } from "@/_lib/labels";

export default async function Page() {

    const data = await httpGet('options');
    const options = await data.json() as IUserOptions;
 
    return (

        <Main header={
            <SettingsTabs>
            </SettingsTabs>
        } narrow={true}>
              
            <div className="  px-0">
                <h3 className="text-base/7 font-semibold text-gray-900  my-4">{labels.settings.companyInformation}</h3> 
            </div>
            <div className="mt-6 border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                    <DescriptionItem label={labels.settings.name} value={options.requisites.name}></DescriptionItem>
                    <DescriptionItem label={labels.settings.phone} value={options.requisites.phone}></DescriptionItem>
                    <DescriptionItem label={labels.settings.address} value={options.requisites.address}></DescriptionItem>
                    <DescriptionItem label={labels.settings.email} value={options.requisites.email}></DescriptionItem>
                    <DescriptionItem label={labels.settings.bankAccount} value={options.requisites.bankAccount}></DescriptionItem>
                    <DescriptionItem label={labels.settings.regNr} value={options.requisites.regNr}></DescriptionItem>
                    <DescriptionItem label={labels.settings.taxId} value={options.requisites.kmkr}></DescriptionItem>
                </dl>
            </div>
            <div className=" pt-8   px-0">
                <h3 className="text-base/7 font-semibold text-gray-900">{labels.settings.invoiceOptions}</h3> 
            </div>
            <div className="mt-6 border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                    <DescriptionItem label={labels.settings.vatRate} value={options.pricing.invoice.vatRate}></DescriptionItem>
                    <DescriptionItem label={labels.settings.surcharge} value={options.pricing.invoice.surCharge}></DescriptionItem>
                    <DescriptionItem label={labels.settings.disclaimer} className="whitespace-pre-line" value={options.pricing.invoice.disclaimer}></DescriptionItem>
                    <DescriptionItem label={labels.settings.signatureLine} value={(options.pricing.invoice.signatureLine?'Yes':'No')}></DescriptionItem>
                    <DescriptionItem label={labels.settings.emailContent}  className="whitespace-pre-line" value={options.pricing.invoice.emailContent}></DescriptionItem> 
                </dl>
            </div>
            <div className=" pt-8   px-0">
                <h3 className="text-base/7 font-semibold text-gray-900">{labels.settings.offerOptions}</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">{labels.settings.offerOptions}</p>
            </div>
            <div className="mt-6 border-t border-gray-100">
                <dl className="divide-y divide-gray-100"> 
                    <DescriptionItem label={labels.settings.emailContent} className="whitespace-pre-line" value={options.pricing.estimate.emailContent}></DescriptionItem> 
                </dl>
            </div>
             <div className="mt-6 flex items-center justify-end gap-x-6">
                <Link href={`/home/settings/edit`}
                    type="button"
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink border border-accent hover:bg-accent-hover"
                >
                    Edit
                </Link>
            </div>
        </Main>
    )

}
