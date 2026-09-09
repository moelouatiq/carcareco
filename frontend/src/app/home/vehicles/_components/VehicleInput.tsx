'use client'

import FormInput from '@/_components/FormInput';
import { useRouter } from 'next/navigation';
import FormTextArea from '@/_components/FormTextArea';
import PrimaryButton from '@/_components/PrimaryButton';
import SecondaryButton from '@/_components/SecondaryButton'; 
import { IVehicleData } from '../model'; 
import FormLabel from '@/_components/FormLabel';
import TypeAheadCombobox from '../../_components/TypeAheadCombobox';
import  { ClientsCombobox } from '../../_components/SearchCombobox';
import data from './car_brands.json'; 
import { useState } from 'react';
import { labels } from "@/_lib/labels";

interface ICarProducer
{
    name:string
}

export default function VehicleInput({
    vehicle
}: {
    vehicle?: IVehicleData | undefined
}) {



    const router = useRouter()
     
    const [producer,setProducer] = useState<ICarProducer |null>(!vehicle?null:{name:vehicle.producer})
    return (
        <>
            <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12">
                    
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <FormLabel name='producer' label={labels.vehicles.producer}></FormLabel>
                        <TypeAheadCombobox 
                          name="producer" 
                          defaultValue={producer} 
                          displayFormatter={(item)=>!item?'':item?.name} 
                          optionFormatter={(item)=>!item?'':item?.name} 
                          placeholder={labels.vehicles.producerPlaceholder} 
                          onItemChange={(item)=>{
                              
                            setProducer(item);
                          }} 
                          onSearch={(e,dataTarget)=>{
                             const inputValue = e.currentTarget.value;
                             if(inputValue){
                                //dataTarget()
                                const makesFound = data.filter((make)=>{
                                    return make.name.toLowerCase().startsWith(inputValue.toLowerCase());
                                }) as ICarProducer[];
                                dataTarget(makesFound);
                             }
                             
                          }}
                          ></TypeAheadCombobox> 
                       </div> 
                        <div className="sm:col-span-2">  <FormInput name='model' defaultValue={vehicle?.model} label={labels.vehicles.model}></FormInput></div>
                        <div className="sm:col-span-2">  <FormInput name='vin' defaultValue={vehicle?.vin} label={labels.vehicles.vinCode}></FormInput></div>
                        <div className="sm:col-span-2">  <FormInput name='regNr' defaultValue={vehicle?.regNr} label={labels.vehicles.registrationNr}></FormInput></div>
                        <div className="sm:col-span-2">  <FormInput name='odo' defaultValue={vehicle?.odo} label={labels.vehicles.odometer}></FormInput> </div>
                        <div className="col-span-full">
                            <FormLabel name='ownerId' label={labels.vehicles.owner}></FormLabel>
                            <ClientsCombobox  
                               name='ownerId'
                                defaultValue={{
                                    text: vehicle?.ownerName??'',
                                    value: vehicle?.ownerId??'',
                                }}>
                            </ClientsCombobox>
                        </div>

                    </div>
                </div>
            </div>
            <div className="border-b border-gray-900/10 pb-12">
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                    <div className="col-span-full">
                        <FormTextArea name='about' label={labels.vehicles.about} defaultValue={vehicle?.description}>
                        </FormTextArea>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-6">
                <SecondaryButton onClick={() => router.back()}>{labels.common.cancel}</SecondaryButton>
                <PrimaryButton onClick={() => { }}>{labels.common.save}</PrimaryButton>
            </div>
        </>
    )
}
