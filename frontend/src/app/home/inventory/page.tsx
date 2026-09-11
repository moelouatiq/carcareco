import { Fragment } from "react";
import Search from "../_components/Search";
import Main from "../_components/Main";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SimpleSearchBar from "../_components/SimpleSearchBar";
import { formatMoney } from "@/_lib/money";
import { formatPercent } from "@/_lib/percent";
import { labels } from "@/_lib/labels";
import Link from "next/link";


export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const columns = [
    {
      dataField: 'code',
      headerText: labels.inventory.productCode,
      dataFormatter: ({ code, id }: { code: string, id: string }) => {
        return (
          <Link prefetch={false} href={'/home/inventory/' + id} >
            <h5 className="mb-0 fs--1">{code} </h5>
          </Link>
        );
      }
    },
    {
      dataField: 'name',
      headerText: labels.inventory.productName,
      dataFormatter: ({ name }: { name: string }) => {
        return <p title={name} className="truncate" style={{ maxWidth: '500px', marginBottom: "-5px" }} >
          {name}
        </p>
      }
    },
    {
      dataField: 'price',
      headerText: labels.inventory.price,
      dataFormatter: ({ price }: { price?: number }) => {
        return (
          <Fragment>
            {formatMoney(price)}
          </Fragment>
        )
      },
    },
    {
      dataField: 'quantity',
      headerText: labels.inventory.quantity,
    },
    {
      dataField: 'discount',
      headerText: labels.inventory.discount,
      dataFormatter: ({ discount }: { discount?: number }) => {
        return (
          <Fragment>
            {formatPercent(discount)}
          </Fragment>
        )
      },
    },
    {
      dataField: 'storageName',
      headerText: labels.inventory.location
    }
  ];

  return (
 
      <Main  header={
        <SearchCardHeader title={labels.nav.inventory} pageName="inventory">
      </SearchCardHeader>
      } narrow={false}>
        <form method="GET" > <Search searchParams={searchParams} pageName="inventory" resourceName="spareparts" columns={columns}>
          <SimpleSearchBar searchParams={searchParams} placeholder={labels.inventory.searchPlaceholder}></SimpleSearchBar>
          </Search></form>
      </Main> 
  )
}
