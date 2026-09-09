'use client'

import FormInput from '@/_components/FormInput'
import FormLabel from '@/_components/FormLabel'  
import { useState } from 'react'
import { IAddressData } from '../model'
import TypeAheadCombobox  from '../../_components/TypeAheadCombobox'
import Select from '@/_components/Select'
import { labels } from "@/_lib/labels";


interface IEhakDto {
  aadresstekst: string,
  kort_nr: string,
  asustusyksus: string,
  omavalitus: string,
  maakond: string,
  sihtnumber: string,
}

interface ICountry{
  id:string,
  name:string
}

const DEFAULT_COUNTRY = 'Maroc';
const ESTONIA = 'Estonie';

/**
 * countries-and-timezones ships English names; Intl.DisplayNames turns each ISO code into its
 * French name so the picker matches the rest of the interface. Falls back to the English name
 * for any code the runtime cannot translate.
 */
function countryNames(countries: Record<string, ICountry>) {
  const french = new Intl.DisplayNames(['fr'], { type: 'region' });
  return Object.values(countries)
    .map((country) => {
      try {
        return french.of(country.id) ?? country.name;
      } catch {
        return country.name;
      }
    })
    .sort((a, b) => a.localeCompare(b, 'fr'));
}
export default function ClientAddress({
  name,
  address
}: {
  name: string,
  address?:IAddressData |undefined
}) {
  
  const ct = require("countries-and-timezones");  // eslint-disable-line  @typescript-eslint/no-require-imports
  const countries = countryNames(ct.getAllCountries() as Record<string, ICountry>);
  const [selectedAddress, setSelectedAddress] = useState<IAddressData | null>(!address?null:address);
  //const [addressData, setAddressData] = useState<IAddressData[]>([]);
  // New addresses default to Morocco. An existing address keeps whatever it was saved with,
  // including values from before the switch ("Estonia", or an ISO code) -- nothing is migrated.
  const [country, setCountry] = useState(!address?DEFAULT_COUNTRY:address.country);
  // The Estonian address lookup stays available, but only for an address explicitly set to Estonia.
  const useEhak = country===ESTONIA;
  // Keep a stored country selectable even when it is not in the French list (legacy English name,
  // ISO code, ...), so editing a client never silently drops their address.
  const countryOptions = country && !countries.includes(country) ? [country, ...countries] : countries;

    
  const queryRemoteAddressData = (inputValue: string) =>
    new Promise<IAddressData[]>((resolve) => {
      if (!inputValue || inputValue.length < 3) {
        resolve([]);
        return;
      }
      const url =
        "https://inaadress.maaamet.ee/inaadress/gazetteer?" +
        new URLSearchParams({
          results: '20',
          appartment: '1',
          unik: '0',
          address: inputValue,
        }).toString();

      fetch(url)
        .then((response) => response.json())
        .then((json) => {
          if (!json.addresses) return [];
          const options = json.addresses.map((addr: IEhakDto) => {
            const address = {
              street: addr.aadresstekst + (!addr.kort_nr ? "" : "-" + addr.kort_nr).trim(),
              city: addr.asustusyksus,
              region: [
                addr.omavalitus,
                addr.maakond,
              ]
                .filter((item) => item)
                .join(", "),
              postalCode: addr.sihtnumber
            } 

            return address;
          });
          resolve(options);
        })
        .catch(() => {});
    });

  
  return (
    <> 
      <div className="sm:col-span-3  sm:col-start-1"> 
        <FormLabel name='country' label={labels.address.country}></FormLabel>
        <div className="mt-2 grid grid-cols-1">
          <Select  
            id="country"
            name="country"
            defaultValue={country}
            onChange={(e)=>{
              setCountry(e.currentTarget.value);
            }}>
              <option value=''>-</option>
            {countryOptions.map((country) => {
              
              return (
                <option key={country} value={country}>{country}</option>
              )
            })}
          </Select>  
        </div>
      </div>
      <div className="col-span-full"> 
      <FormLabel name='street' label={labels.address.street}></FormLabel>
      <TypeAheadCombobox
         name={name}
          
         placeholder={(useEhak?'Adresse estonienne…':'')}
         defaultValue={selectedAddress} 
         onSearch={(event,datasourceTarget) => {

          if (!useEhak) return; 
          queryRemoteAddressData(event.currentTarget.value)
            .then((result) => {
              datasourceTarget(result);
          }) 

         }}
         onItemChange={(item)=>{
            setSelectedAddress(item);
         }}
         displayFormatter={(address) => {
          const ehak = address as IAddressData 
          return ehak?.street; 
         }}
         optionFormatter={(address)=>{
            return [
              address.street,
              address.city,
              address.region,
              address.postalCode,
            ]
              .filter((item) => item)
              .join(", ")
         }}
        >
        
      </TypeAheadCombobox>
      </div>
    
      <div className="sm:col-span-2 sm:col-start-1">
        <FormInput name='city' label={labels.address.city} defaultValue={selectedAddress?.city} ></FormInput>
      </div>

      <div className="sm:col-span-2">
        <FormInput name='region' label={labels.address.region} defaultValue={selectedAddress?.region} ></FormInput>
      </div>

      <div className="sm:col-span-2">
      <FormInput name='postal-code' label={labels.address.postalCode} defaultValue={selectedAddress?.postalCode} ></FormInput>
      </div></>
  )
}
