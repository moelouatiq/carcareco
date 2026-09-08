import FormInput from "@/_components/FormInput";
import FormLabel from "@/_components/FormLabel"; 
import { ClientsCombobox, VehiclesCombobox } from "../../_components/SearchCombobox";

export default function SearchParams({
    options
}:{
    options: any // eslint-disable-line @typescript-eslint/no-explicit-any
}){
    const clientValue = options['clientId[value]'] ?? options['clientiId[value]'];
    const clientText = options['clientId[text]'] ?? options['clientiId[text]'];

    return (
        <div className="grid sm:grid-flow-col gap-2">
        
            {options.issued === 'on' && <>
                <div className="col-span-1  ">
                        <FormInput name="invoiceFrom" label="Invoice from" defaultValue={options.invoiceFrom} type="date" ></FormInput>
                      </div>

                      <div className="col-span-1 ">
                        <FormInput name="invoiceTo" label="Invoice to" defaultValue={options.invoiceTo} type="date" ></FormInput>
                      </div>
                  </>  }
                  <div className="col-span-1  ">
                    <FormInput name="workFrom" label="Work from" defaultValue={options.workFrom} type="date" ></FormInput>
                  </div>

                  <div className="col-span-1  ">
                    <FormInput name="workTo" label="Work to" defaultValue={options.workTo} type="date" ></FormInput>
                  </div>

                  <div className="col-span-1  ">
                    <FormLabel name='clientId' label='Client'></FormLabel>
                    <ClientsCombobox
                      name='clientId'
                      defaultValue={clientValue ? {
                        text: clientText,
                        value: clientValue,
                      } : null}>
                    </ClientsCombobox>
                  </div>
                  <div className="col-span-1 ">
                    <FormLabel name='vehicleId' label='Vehicle'></FormLabel>
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
