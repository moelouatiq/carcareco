import clsx from "clsx";
import Search from "../_components/Search";
import 'car-makes-icons/dist/style.css';
import { SearchCardHeader } from "../_components/SearchCardHeader";
import Main from "../_components/Main";
import SimpleSearchBar from "../_components/SimpleSearchBar";
import { labels } from "@/_lib/labels";
import Link from "next/link";


export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {

  return <Main header={
    <SearchCardHeader title={labels.nav.vehicles} pageName="vehicles">
    </SearchCardHeader>
  } narrow={false}>
     <form method="GET" > <Search
      searchParams={searchParams}
      resourceName="vehicles"
      columns={[

        {
          dataField: 'producer',
          headerText: labels.vehicles.producer,
          dataClasses: () => {
            return "pl-4 font-medium gray-900 whitespace-nowrap";
          },
          dataFormatter: ({ producer }) => {
            const producerName = producer.trim().replace(" ", "-").toLowerCase();
            return (
              <div className="flex items-center " >
                <i className={clsx("pr-2 text-2xl", "car-" + producerName)}>  </i>
                <span className="text-sm">{producer}</span>
              </div>
            );
          }
        },
        {
          dataField: 'model',
          headerText: labels.vehicles.model,
        },
        {
          dataField: 'regNr',
          headerText: labels.vehicles.regNr,
          dataFormatter: ({ regNr, id }) => {
            return (
              <Link prefetch={false} href={'/home/vehicles/' + id} >
                <h5 className="font-semibold"> {regNr}</h5>
              </Link>
            );
          }
        },
        {
          dataField: 'ownerName',
          headerText: labels.vehicles.owner,
          dataFormatter: ({ ownerName, ownerId }) => {
            if (!ownerName) return <p className="font-italic text-gray-400">{labels.vehicles.noOwner}</p>;
            return (
              <Link prefetch={false} href={'/home/clients/' + ownerId} >
                <h5 >{ownerName}</h5>
              </Link>
            );
          }
        },
        {
          dataField: 'vin',
          headerText: labels.vehicles.vin,
          dataFormatter: ({ vin, id }) => {
            return (
              <Link prefetch={false} href={'/home/vehicles/' + id} >
                <h5  >{vin}</h5>
              </Link>
            );
          }
        }
      ]}>
        <SimpleSearchBar searchParams={searchParams} placeholder={labels.vehicles.searchPlaceholder}></SimpleSearchBar> 
        </Search></form>
   
  </Main>
}
