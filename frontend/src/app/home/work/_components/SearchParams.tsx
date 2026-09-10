import FormInput from "@/_components/FormInput";
import FormLabel from "@/_components/FormLabel"; 
import { ClientsCombobox, VehiclesCombobox } from "../../_components/SearchCombobox";
import { labels } from "@/_lib/labels";

export default function SearchParams({
    options
}:{
    options: any // eslint-disable-line @typescript-eslint/no-explicit-any
}){
    const clientValue = options['clientId[value]'] ?? options['clientiId[value]'];
    const clientText = options['clientId[text]'] ?? options['clientiId[text]'];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        
            {options.issued === 'on' && <>
                <div className="col-span-1  ">
                        <FormInput name="invoiceFrom" label={labels.work.invoiceFrom} defaultValue={options.invoiceFrom} type="date" ></FormInput>
                      </div>

                      <div className="col-span-1 ">
                        <FormInput name="invoiceTo" label={labels.work.invoiceTo} defaultValue={options.invoiceTo} type="date" ></FormInput>
                      </div>
                  </>  }
                  <div className="col-span-1  ">
                    <FormInput name="workFrom" label={labels.work.workFrom} defaultValue={options.workFrom} type="date" ></FormInput>
                  </div>

                  <div className="col-span-1  ">
                    <FormInput name="workTo" label={labels.work.workTo} defaultValue={options.workTo} type="date" ></FormInput>
                  </div>

                  <div className="col-span-1  ">
                    <FormLabel name='clientId' label={labels.work.client}></FormLabel>
                    <ClientsCombobox
                      name='clientId'
                      defaultValue={clientValue ? {
                        text: clientText,
                        value: clientValue,
                      } : null}>
                    </ClientsCombobox>
                  </div>
                  <div className="col-span-1 ">
                    <FormLabel name='vehicleId' label={labels.work.vehicle}></FormLabel>
                    <VehiclesCombobox name='vehicleId'
                      defaultValue={options['vehicleId[value]'] ? {
                        text: options['vehicleId[text]'],
                        value: options['vehicleId[value]'],
                      } : null}>
                    </VehiclesCombobox>
                  </div>  
        </div>
    )
}
