'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet, httpGetResponse } from '@/_lib/server/query-api'
import Main from '../../_components/Main'; 
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import { IVehicleData } from '../model';
import { CardHeader } from '@/_components/Card';
import ServiceHistory from '../../_components/service-history/ServiceHistory';
import { IServiceHistoryPage } from '../../_components/service-history/model';
import { labels } from "@/_lib/labels";



export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ historyOffset?: string }>
}) {
    const id = (await params).id;
    const historyOffset = pageOffset((await searchParams).historyOffset);
    const [data, historyResponse] = await Promise.all([
        httpGet('vehicles/' + id),
        httpGetResponse(`servicehistory/vehicles/${id}?offset=${historyOffset}&limit=10`),
    ]);
    const vehicle = await data.json() as IVehicleData;
    const history = historyResponse.ok
        ? await historyResponse.json() as IServiceHistoryPage
        : null;
  
    return (

        <Main header={
            <CardHeader  >
                 <h3 className="px-1 text-base font-semibold text-gray-900">{labels.vehicles.information}</h3>
                <DisplayOptionsMenu id={id} pageName='vehicles'></DisplayOptionsMenu>
            </CardHeader>} narrow={false}>
            <dl className="divide-y divide-gray-100"> 
                <DescriptionItem label={labels.vehicles.makeAndModel} value={[vehicle.producer, vehicle.model].join(' ')}></DescriptionItem>
                <DescriptionItem label={labels.vehicles.vin} value={vehicle.vin}></DescriptionItem>
                <DescriptionItem label={labels.vehicles.regNr} value={vehicle.regNr}></DescriptionItem>
                <DescriptionItem label={labels.vehicles.odometer} value={vehicle.odo}></DescriptionItem>
                <DescriptionItem label={labels.vehicles.owner} value={vehicle.ownerName}></DescriptionItem>
                <DescriptionItem label={labels.vehicles.about} value={vehicle.description}></DescriptionItem>
            </dl>
            <ServiceHistory
                scope="vehicle"
                history={history}
                error={!historyResponse.ok}
                basePath={`/home/vehicles/${id}`}
            />
        </Main>
    )

}

function pageOffset(value?: string) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
