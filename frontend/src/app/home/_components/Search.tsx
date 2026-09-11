import clsx from "clsx";
import Link from "next/link";
import { Table, TableFrame, Td, Th, Tr } from "@/_components/ui/Table";
import { EmptyState } from "@/_components/ui/EmptyState";
import React  from "react";
import { httpGet } from "@/_lib/server/query-api"; 
import { resourceEditPath, resolveResourcePageName } from "@/_lib/resource-path";
import { labels } from "@/_lib/labels";
interface DataResult {
  hasMore: boolean,
  items: Record<string, string>[]
}

interface DataRowModel {
  dataField: string,
  headerText?: string | undefined,
  headerClasses?(index: number): string | undefined,
  dataClasses?(item: Record<string, any>, index: number): string | undefined,// eslint-disable-line @typescript-eslint/no-explicit-any
  sort?: boolean | undefined,
  dataFormatter?(item: Record<string, any>, colIndex: number): React.ReactNode | undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default async function Search(
  {
    searchParams,
    resourceName,
    pageName,
    columns = [],
    rowClass,
    idField = 'id',
    children,
  }: {
    searchParams: Promise<Record<string, string>>
    resourceName: string,
    pageName?: string | undefined | null,
    idField?: string | undefined,
    columns?: DataRowModel[],
    rowClass? (item:any):string // eslint-disable-line @typescript-eslint/no-explicit-any
    children?: React.ReactNode
  }) {

  const resolvedPageName = resolveResourcePageName(resourceName, pageName);
  let options = (await searchParams);
  const offset = pageNumber(options.offset, 0, 0);
  const limit = pageNumber(options.limit, 30, 1);
  options = {
    ...options,
    offset: offset.toString(),
    limit: limit.toString()
  };
  const queryString = new URLSearchParams(options).toString();
  const page = '/home/' + resolvedPageName + '?';
  const nextPage = page + new URLSearchParams({ ...options, offset: (offset + limit).toString() }).toString();
  const prevPage = page + new URLSearchParams({ ...options, offset: Math.max(0, offset - limit).toString() }).toString();

  const response = await httpGet(`${resourceName}/page?${queryString}`);
  const data = (await response.json() as DataResult);
  
  if (data.items.length > 0) {
    //if no columns defined show all what data has
    if (!columns || columns.length === 0) {
      columns = Object.getOwnPropertyNames(data.items[0]).map((item) => {
        return {
          dataField: item,
        } as DataRowModel
      })
    }
    //populate defaults
    columns.forEach((col) => {
      if (col.headerText === undefined) col.headerText = String(col.dataField).charAt(0).toUpperCase() + String(col.dataField).slice(1);
      if (!col.dataFormatter) {
        col.dataFormatter = (item) => {
          return item[col.dataField];
        }
      }
      // No padding here: Th and Td own the horizontal grid, so the first and last columns line up
      // with the rest. These defaults used to add pl-4 sm:pl-0 to the first column, which is why
      // the leading header and cell sat almost against the panel edge.
      if (!col.headerClasses) {
        col.headerClasses = () => undefined
      }
      if (!col.dataClasses) {
        col.dataClasses = (item, index) => {
          return clsx(index === 0 ?
            "font-medium whitespace-nowrap text-gray-900" :
            "whitespace-nowrap text-gray-500");
        }
      }
    })
  }

  /* useEffect(() => {
    if (typeof window !== "undefined") {
      const searchPath = localStorage.getItem("searchPath");
      if (searchPath) {
        
      }
    }
  }, []); */
  return (

    <> 
    
    {children}

    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        
        {/* <h1 className="text-base font-semibold text-gray-900">{displayName}</h1>
                            <p className="mt-2 text-sm text-gray-700">
                               
                            </p> */}
          
      </div>
      
      <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">

      </div>
    </div>
   
      {data.items.length === 0 ? (
        <TableFrame>
          <EmptyState title={labels.search.empty} description={labels.search.emptyHint} />
        </TableFrame>
      ) : (
        <TableFrame>
          <Table>
            <thead>
              <tr>
                {columns?.map((val, index) => (
                  <Th key={"th" + index} className={val.headerClasses && val.headerClasses(index)}>
                    {val.headerText}
                  </Th>
                ))}
                <Th align="right">
                  <span className="sr-only">{labels.actions.edit}</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, rowindex) => (
                <Tr key={"tr" + item[idField]} className={rowClass && rowClass(item)}>
                  {columns?.map((col, colindex) => (
                    <Td key={"td" + colindex + item[idField] + rowindex}
                      className={col.dataClasses && col.dataClasses(item, colindex)}>
                      {col.dataFormatter && col.dataFormatter(item, colindex)}
                    </Td>
                  ))}
                  <Td align="right" className="whitespace-nowrap">
                    {/* One of these per row: prefetching every edit page of a full table would
                        server-render up to a page-size worth of them for the at most one the
                        user opens. Pagination below keeps its prefetch, where it pays off. */}
                    <Link prefetch={false}
                      href={resourceEditPath(resourceName, item[idField], pageName)}
                      className="font-medium text-accent-ink hover:underline">
                      {labels.actions.edit}
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <nav aria-label={labels.search.pagination}
            className="flex items-center justify-between gap-3 px-3 py-2.5">
            <p className="hidden text-[13px] text-muted sm:block">
              {labels.search.showing} <span className="font-medium text-ink">{offset + 1}</span>{" "}
              {labels.search.to} <span className="font-medium text-ink">{offset + limit}</span>
            </p>
            <div className="flex flex-1 justify-between gap-2 sm:flex-none sm:justify-end">
              <Link href={prevPage}
                aria-disabled={offset <= 0}
                className={clsx(
                  offset <= 0 ? "pointer-events-none border-line text-muted opacity-60" : "border-line text-ink hover:bg-neutral-soft",
                  "inline-flex items-center rounded-md border bg-surface px-3 py-1.5 text-[13px] font-medium")}>
                {labels.search.previous}
              </Link>
              <Link href={nextPage}
                aria-disabled={!data.hasMore}
                className={clsx(
                  !data.hasMore ? "pointer-events-none border-line text-muted opacity-60" : "border-line text-ink hover:bg-neutral-soft",
                  "inline-flex items-center rounded-md border bg-surface px-3 py-1.5 text-[13px] font-medium")}>
                {labels.search.next}
              </Link>
            </div>
          </nav>
        </TableFrame>
      )}

       </>

  )
}

function pageNumber(value: string | undefined, fallback: number, minimum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}
