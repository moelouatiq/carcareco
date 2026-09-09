'use client'

import FormInput from '@/_components/FormInput';
import FormTextArea from '@/_components/FormTextArea';
import PrimaryButton from '@/_components/PrimaryButton';
import SecondaryButton from '@/_components/SecondaryButton'; 
import { ILocation, ISparepartData } from '../model';
import FormLabel from '@/_components/FormLabel'; 
import { useRouter } from 'next/navigation'; 
import React from 'react';import NamedLocation from './NamedLocation';
import { labels } from "@/_lib/labels";
 ; 

 
export default function InventoryInput({
    allLocations,
    sparepart
}: {
    allLocations: ILocation[] ,
    sparepart?: ISparepartData | undefined
}) {

    const router = useRouter();
    
     
    return (
        <>   
            <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12">
                   
                    <div className=" grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <div className="sm:col-span-2"> <FormInput name='code' defaultValue={sparepart?.code} label={labels.inventory.productCode}></FormInput></div>
                        <div className="sm:col-span-2"> <FormInput name='name' defaultValue={sparepart?.name} label={labels.inventory.productName}></FormInput></div> 
                        <div className="sm:col-span-2"> <FormInput name='price' type='number' step='any'   defaultValue={sparepart?.price} label={labels.inventory.price}></FormInput></div>
                        <div className="sm:col-span-2"> <FormInput name='quantity' type='number' step='any'  defaultValue={sparepart?.quantity} label={labels.inventory.quantity}></FormInput></div>
                        <div className="lg:col-span-4 sm:col-span-full">
                            <FormLabel name='location' label={labels.inventory.location}></FormLabel>
                            <NamedLocation sparepartLocationId={sparepart?.storageId} allLocations={allLocations}></NamedLocation>
                        </div>
                    </div> 
                </div>
            </div>
            <div className="border-b border-gray-900/10 pb-12">
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                    <div className="col-span-full">
                        <FormTextArea name='about' label={labels.inventory.about} defaultValue={sparepart?.description}>
                        </FormTextArea>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-6">
                <SecondaryButton onClick={() => router.back()}>{labels.common.cancel}</SecondaryButton>
                <PrimaryButton   onClick={() => { }}>{labels.common.save}</PrimaryButton>
            </div>
        </>
    )
}
