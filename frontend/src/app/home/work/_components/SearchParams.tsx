import FormInput from "@/_components/FormInput";
import FormLabel from "@/_components/FormLabel";
import { controlClasses } from "@/_components/ui/Input";
import { ClientsCombobox, VehiclesCombobox } from "../../_components/SearchCombobox";
import { labels } from "@/_lib/labels";

// These fields are emitted as bare cells rather than in a grid of their own: they belong to the
// single filter grid on the page. Nested in their own two column grid they made one cell of the
// outer grid twice as tall as its neighbours, which is where the empty band under the left hand
// filters came from.
export default function SearchParams({
    options
}:{
    options: any // eslint-disable-line @typescript-eslint/no-explicit-any
}){
    const clientValue = options['clientId[value]'] ?? options['clientiId[value]'];
    const clientText = options['clientId[text]'] ?? options['clientiId[text]'];

    return (
        <>
            {options.issued === 'on' && <>
                  <div>
                    <FormInput name="invoiceFrom" label={labels.work.invoiceFrom} defaultValue={options.invoiceFrom} type="date" ></FormInput>
                  </div>

                  <div>
                    <FormInput name="invoiceTo" label={labels.work.invoiceTo} defaultValue={options.invoiceTo} type="date" ></FormInput>
                  </div>
            </>  }

            <div>
              <FormInput name="workFrom" label={labels.work.workFrom} defaultValue={options.workFrom} type="date" ></FormInput>
            </div>

            <div>
              <FormInput name="workTo" label={labels.work.workTo} defaultValue={options.workTo} type="date" ></FormInput>
            </div>

            <div>
              <FormLabel name='clientId' label={labels.work.client}></FormLabel>
              <ClientsCombobox
                name='clientId'
                className={controlClasses}
                defaultValue={clientValue ? {
                  text: clientText,
                  value: clientValue,
                } : null}>
              </ClientsCombobox>
            </div>

            <div>
              <FormLabel name='vehicleId' label={labels.work.vehicle}></FormLabel>
              <VehiclesCombobox name='vehicleId'
                className={controlClasses}
                defaultValue={options['vehicleId[value]'] ? {
                  text: options['vehicleId[text]'],
                  value: options['vehicleId[value]'],
                } : null}>
              </VehiclesCombobox>
            </div>
        </>
    )
}
