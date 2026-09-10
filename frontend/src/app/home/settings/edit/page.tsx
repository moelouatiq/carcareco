  
 'use server'
 
import SettingsTabs from '@/_components/SettingsTabs'
import Main from '../../_components/Main'
import { httpGet } from '@/_lib/server/query-api';
import { IUserOptions } from '../model';
import FormInput from '@/_components/FormInput'; 
import FormLabel from '@/_components/FormLabel';
import FormTextArea from '@/_components/FormTextArea';
import FormSwitch from '@/_components/FormSwitch';
import { createOrUpdate } from '../createOrUpdate'; 
import { labels } from "@/_lib/labels";

 

export default async function Page( ) {

    const data = await httpGet('options'); 
    const options = await data.json() as IUserOptions; 
   
  return (
 
      <Main  header={
        <SettingsTabs> 
        </SettingsTabs>
      } narrow={true}>
        <form action={createOrUpdate}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900  my-4">{labels.settings.companyInformation}</h2>
          

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
                <FormInput name='name' label={labels.settings.name}  defaultValue={options.requisites.name}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='phone' label={labels.settings.phone} defaultValue={options.requisites.phone}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='address' label={labels.settings.address} defaultValue={options.requisites.address}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='email' label={labels.settings.email} defaultValue={options.requisites.email}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='bankAccount' label={labels.settings.bankAccount} defaultValue={options.requisites.bankAccount}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='regNr' label={labels.settings.regNr} defaultValue={options.requisites.regNr}></FormInput> 
              </div>
              <div className="sm:col-span-3">
                <FormInput name='kmkr' label={labels.settings.taxId} defaultValue={options.requisites.kmkr}></FormInput> 
              </div>
            </div> 
          </div>
         
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">{labels.settings.invoiceOptions}</h2> 

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
             <div className="sm:col-span-2">
                <FormInput name='vatRate' label={labels.settings.vatRate} defaultValue={options.pricing.invoice.vatRate}></FormInput> 
              </div>
              <div className="sm:col-span-2">
                <FormInput name='surCharge' label={labels.settings.surcharge} defaultValue={options.pricing.invoice.surCharge}></FormInput> 
              </div> 
              <div className="sm:col-span-2">
                <FormLabel name="signatureLine" label={labels.settings.signatureLine}></FormLabel>
                 <div className='mt-3'>
                 <FormSwitch name='signatureLine' defaultChecked={options.pricing.invoice.signatureLine}></FormSwitch>
                 </div>
               
              </div>
              <div className="sm:col-span-full">
                <FormTextArea name='disclaimer' label={labels.settings.disclaimer} defaultValue={options.pricing.invoice.disclaimer}></FormTextArea> 
              </div>
              <div className="sm:col-span-full">
                <FormTextArea name='emailContent' rows={10} label={labels.settings.emailContent} defaultValue={options.pricing.invoice.emailContent}></FormTextArea> 
              </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">{labels.settings.offerOptions}</h2> 
          <div className="mt-10 space-y-10">
          <div className="sm:col-span-full">
                <FormTextArea name='estimateEmailContent' rows={10} label={labels.settings.emailContent} defaultValue={options.pricing.estimate.emailContent}></FormTextArea> 
              </div> 
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        
        <button
          type="submit"
          className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink border border-accent hover:bg-accent-hover"
        >
          Save
        </button>
      </div>
    </form>
      </Main> 
  )

}



