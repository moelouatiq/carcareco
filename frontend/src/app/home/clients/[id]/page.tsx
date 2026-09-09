'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet, httpGetResponse } from '@/_lib/server/query-api'
import Main from '../../_components/Main'; 
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import FormList from '@/_components/FormList';
import FormListEmailItem from '../_components/FormListEmailItem';
import { IClientData } from '../model';
import BlueBadge from '@/_components/BlueBadge';
import YellowBadge from '@/_components/YellowBadge'; 
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
        httpGet('clients/' + id),
        httpGetResponse(`servicehistory/clients/${id}?offset=${historyOffset}&limit=10`),
    ]);
    const client = await data.json() as IClientData;
    const history = historyResponse.ok
        ? await historyResponse.json() as IServiceHistoryPage
        : null;
    return (

        <Main header={
        <CardHeader  > 
              <h3 className="px-1 lg:px-0 text-base font-semibold text-gray-900">{labels.clients.information}{' '}
                        <BlueBadge text={!client.isPrivate ? labels.clients.company : labels.clients.privatePerson}  ></BlueBadge>{' '}
                        {client.isAsshole && <YellowBadge text={labels.clients.complicated} ></YellowBadge>}</h3> 
          
                <DisplayOptionsMenu id={id} pageName='clients'></DisplayOptionsMenu>
        </CardHeader>} narrow={false}>
                    <div className="  border-gray-100">
                        <dl className="divide-y divide-gray-100">

                            {!client.isPrivate ?
                                <DescriptionItem label={labels.clients.companyName} value={client.name}></DescriptionItem>
                                : <DescriptionItem label={labels.clients.fullName} value={client.firstName + ' ' + client.lastName}></DescriptionItem>}
                            <DescriptionItem label={labels.clients.phone} value={client.phone}></DescriptionItem>
                            {client.emailAddresses.length < 2 ?
                                <DescriptionItem label={labels.clients.emailAddress} value={client.currentEmail}></DescriptionItem>
                                : <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm/6 font-medium text-gray-900">{labels.clients.emailAddresses}</dt>
                                    <FormList
                                        items={client.emailAddresses}
                                        renderItem={(item) => {
                                            return <FormListEmailItem mail={item} isPrimary={item === client.currentEmail}></FormListEmailItem>
                                        }}>
                                    </FormList>
                                </div>
                            }
                            {!client.isPrivate ?
                                <DescriptionItem label={labels.clients.registryCode} value={client.regNr}></DescriptionItem>
                                : <DescriptionItem label={labels.clients.personalCode} value={client.personalCode}></DescriptionItem>}

                            <DescriptionItem label={labels.clients.address} value={[client.address.country, client.address.region, client.address.city, client.address.street, client.address.postalCode].filter(item => item).join(', ')}></DescriptionItem>
                            <DescriptionItem label={labels.clients.about} value={client.description}></DescriptionItem>
                            <DescriptionItem label={labels.clients.added} value={client.introducedAt}></DescriptionItem>
                        </dl>
                    </div>

                    <ServiceHistory
                        scope="client"
                        history={history}
                        error={!historyResponse.ok}
                        basePath={`/home/clients/${id}`}
                    />

        </Main>
    )
}

function pageOffset(value?: string) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
