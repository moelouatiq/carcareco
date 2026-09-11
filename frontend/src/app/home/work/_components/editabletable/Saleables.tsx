'use client'

import { IPriceSummary, IProduct } from "../../model";
import React, { useRef } from "react";
import { DataItemRow, DataItemRowHandle, cellPadding } from "./DataIItemRow";
import { useDragAndDrop } from "../activity/dragAndDrop";
import { TableFrame } from "@/_components/ui/Table";
import { formatMoney } from "@/_lib/money";
import { labels } from "@/_lib/labels";

// The header uses the same horizontal padding as the body cells so the columns line up. The row
// component owns its own cells because they carry the editing refs, so the padding is shared as a
// constant rather than through the Th and Td primitives.
const headerCell = `${cellPadding} border-b border-line bg-app text-[11px] font-semibold tracking-wide text-muted uppercase whitespace-nowrap`;

export default function Saleables({
    edit,
    data,
    priceSummary,
    tableRef,
    removeItem,
    refreshData
}: {
    edit: boolean,
    data: IProduct[],
    priceSummary: IPriceSummary,
    tableRef: React.RefObject<DataItemRowHandle<IProduct>[] | null[]>,
    removeItem: (id: string) => void,
    refreshData: (data: IProduct[]) => void
}) {

    const dragItem = useRef<string | undefined>(null);
    const dragOverItem = useRef<string | undefined>(null);

    const dnd = useDragAndDrop(refreshData, tableRef, dragItem, dragOverItem);

    return (
        <TableFrame>
            <table id="items" className="min-w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {edit && <th className={`${headerCell} w-10`}><span className="sr-only">{labels.work.reorderRow}</span></th>}
                        <th scope="col" className={`${headerCell} text-left`}>{labels.common.code}</th>
                        <th scope="col" className={`${headerCell} text-left`}>{labels.common.name}</th>
                        <th scope="col" className={`${headerCell} text-right`}>{labels.common.price}</th>
                        <th scope="col" className={`${headerCell} text-right`}>{labels.common.quantity}</th>
                        <th scope="col" className={`${headerCell} text-right`}>{labels.common.unit}</th>
                        <th scope="col" className={`${headerCell} text-right`}>{labels.common.discount}</th>
                        {edit && <th className={`${headerCell} w-10`}><span className="sr-only">{labels.actions.delete}</span></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.filter(x => x).map((product, index) => (
                        <DataItemRow key={'dr' + product.id}
                            isEditing={edit}
                            index={index}
                            ref={el => {
                                if (tableRef?.current) tableRef.current[index] = el;
                            }}
                            item={product}
                            onDragStart={e => dnd.handleDragStart(e)}
                            onDragEnter={e => dnd.handleDragEnter(e)}
                            removeWorkItem={(id) => {
                                removeItem(id);
                            }}>
                        </DataItemRow>
                    ))}
                </tbody>
                {!edit && priceSummary && <tfoot>
                    {/* The totals come from the record. Nothing is added up in the browser. */}
                    <tr>
                        <td colSpan={5} className={`${cellPadding} pt-3 text-right text-[13px] text-muted`}>{labels.common.subtotal}</td>
                        <td className={`${cellPadding} pt-3 text-right text-[13px] text-muted whitespace-nowrap`}>{formatMoney(priceSummary.totalWithoutVat)}</td>
                    </tr>
                    <tr>
                        <td colSpan={5} className={`${cellPadding} text-right text-[13px] text-muted`}>{labels.common.tax}</td>
                        <td className={`${cellPadding} text-right text-[13px] text-muted whitespace-nowrap`}>{formatMoney(priceSummary.totalWithVat - priceSummary.totalWithoutVat)}</td>
                    </tr>
                    <tr>
                        <td colSpan={5} className={`${cellPadding} border-t border-line text-right text-sm font-semibold text-ink`}>{labels.common.total}</td>
                        <td className={`${cellPadding} border-t border-line text-right text-sm font-semibold text-ink whitespace-nowrap`}>{formatMoney(priceSummary.totalWithVat)}</td>
                    </tr>
                </tfoot>}
            </table>
        </TableFrame>
    )
}
