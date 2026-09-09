'use server'

import VehicleInput from '../_components/VehicleInput';
import { createOrUpdate } from '../createOrUpdate';
import Main from '../../_components/Main';
import { CardHeader } from '@/_components/Card';
import { labels } from "@/_lib/labels";

export default async function Page() {
  
    return (
        <Main header={<CardHeader title={labels.vehicles.newVehicle} description={labels.clients.enterDetails} ></CardHeader>}>
                <form action={createOrUpdate}>
                    <input type="hidden" name='id'  ></input>
                    <VehicleInput  ></VehicleInput>
                </form> 
        </Main> 
    )
}
