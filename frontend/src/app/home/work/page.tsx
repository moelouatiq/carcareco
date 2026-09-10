import Search from "../_components/Search";
import moment from "moment";
import "moment/locale/fr";
import { IOfferIssuance, IWorkIssuance } from "./model";
import PricingDownloadLink from "./_components/activity/PricingDownloadLink";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import Spinner from "@/_components/Spinner";
import BlueBadge from "@/_components/BlueBadge";
import WorkStatusBadge from "./_components/activity/badges/WorkStatusBadge";
import { EmailSentBadge, OverdueBadge } from "./_components/activity/badges/IssuanceBadges";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchStatusFilter from "./_components/SearchStatusFilter";
import SearchParams from "./_components/SearchParams";
import PrimaryButton from "@/_components/PrimaryButton";
import SearchInput from "../_components/SearchInput";
import FormInput from "@/_components/FormInput";
import { labels } from "@/_lib/labels";
import Link from "next/link";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = (await searchParams);

  const isInvoiceView = options.issued == 'on';

  const secondColumn = isInvoiceView ? {
    dataField: 'issuance',
    headerText: labels.work.invoice,

    dataFormatter: ({ issuance, id }: { issuance: IWorkIssuance, id: string }) => {
      return (
        issuance ?
          <div className="flex gap-x-2 ">
            <div>  <PricingDownloadLink
              name='Invoice'
              id={id}
              number={issuance.invoiceNumber}
              downloadingElement={<Spinner></Spinner>}
              hidePaperClip={true}
              clickableElement={<ArrowDownTrayIcon aria-hidden="true" className="h-6 w-5 text-gray-400" ></ArrowDownTrayIcon>} >
            </PricingDownloadLink> </div>
            <div>
              <EmailSentBadge issueance={issuance}></EmailSentBadge>
              <OverdueBadge issueance={issuance}></OverdueBadge></div>
          </div> :
          <></>
      );
    }
  } : {
    dataField: 'offerissuance',
    headerText: labels.work.activities,

    dataFormatter: ({ offerIssuance, hasRepairs, numberOfOffers }: { hasRepairs: boolean, offerIssuance: IOfferIssuance, numberOfOffers: number }) => {

      return (
        <div className="flex gap-x-2">
          {hasRepairs && <BlueBadge text={labels.work.repairJob}></BlueBadge>}
          {numberOfOffers > 1 ?
            <BlueBadge text={labels.work.manyOffers}></BlueBadge> :
            <>
              {offerIssuance &&
                <>
                  <div>  <PricingDownloadLink
                    name='Offer'
                    id={offerIssuance.id}
                    number={offerIssuance.number}
                    downloadingElement={<Spinner></Spinner>}
                    hidePaperClip={true}
                    hideLabel={false}
                    clickableElement={<ArrowDownTrayIcon aria-hidden="true" className="h-6 w-5 text-gray-400" ></ArrowDownTrayIcon>} >
                  </PricingDownloadLink> </div>
                  <div> <h5><EmailSentBadge issueance={offerIssuance}></EmailSentBadge></h5></div>
                </>
              }
            </>
          }</div>

      );
    }
  };

  const columns = [
    {
      dataField: 'workNr',
      headerText: labels.work.number,

      dataFormatter: ({ id, workNr, status }: { id: string, status: string, workNr: string }) => {

        return (
          <Link prefetch={false} href={'/home/work/' + id}>
            <h5>{labels.work.workNumber} {workNr}
              {' '} {!isInvoiceView && <WorkStatusBadge status={status} ></WorkStatusBadge>}
            </h5>
          </Link>
        );
      }
    },
    secondColumn,
    {
      dataField: 'startedOn',
      headerText: labels.work.startedOn,//  {moment(activity?.startedOn, true).format('LLL')}
      dataFormatter: ({ startedOn }: { startedOn: Date }) => {
        return (
          moment(startedOn, true).locale('fr').format('LL')
        );
      }
    },

    {
      dataField: 'clientId',
      headerText: labels.work.client,
      dataFormatter: ({ clientName, clientId }: { clientName: string, clientId: string }) => {
        return (
          <Link prefetch={false} href={'/home/clients/' + clientId} >
            <h5 >{clientName}</h5>
          </Link>
        );
      }
    },
    {
      dataField: 'vehicleId',
      headerText: labels.work.vehicle,
      dataFormatter: ({ regNr, vehicleId }: { regNr: string, vehicleId: string }) => {
        return (
          <Link prefetch={false} href={'/home/vehicles/' + vehicleId} >
            <h5 className="mb-0 fs--1">{regNr}</h5>
          </Link>
        );
      }
    },

    {
      dataField: 'mechanicNames',
      headerText: labels.work.mechanics,
    },
    {
      dataField: 'notes',
      headerText: labels.common.description,
      dataFormatter: ({ notes }: { notes: string }) => {
        return (
          <p title={notes} className="truncate" style={{ maxWidth: '300px', marginBottom: "-5px" }} >
            {notes}
          </p>
        );
      }
    }
  ]


  // The filters sit in a compact bar above a full width table rather than inside a form card: the
  // list is the page, and the controls are how it is narrowed.
  return <main className="lg:pl-60">
    <div className="min-w-0 px-4 py-6 sm:px-8">
      <SearchCardHeader title={labels.nav.work} pageName="work"></SearchCardHeader>

      <form method="GET">
        <Search
          searchParams={searchParams}
          resourceName="work"
          idField="id"
          rowClass={(item) => {
            return (item['status'] === 'closed' ? 'text-muted' : '')
          }}
          columns={columns}>
          <div className="mb-4 rounded-lg border border-line bg-surface px-3 py-3">
            <SearchStatusFilter issued={options.issued === 'on'} status={options.status}></SearchStatusFilter>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <SearchInput searchParams={searchParams} placeholder={labels.work.searchPlaceholder}></SearchInput>
              </div>
              <div className="md:col-span-3">
                <FormInput name="saleable" label={labels.work.productOrService} placeholder={labels.work.productPlaceholder} defaultValue={options.saleable}></FormInput>
              </div>
              <div className="md:col-span-5">
                <SearchParams options={options}></SearchParams>
              </div>
            </div>
            <div className="mt-3 flex justify-end border-t border-line pt-3">
              <PrimaryButton id="btnSubmit">{labels.search.search}</PrimaryButton>
            </div>
          </div>
        </Search>
      </form>
    </div>
  </main>
}
