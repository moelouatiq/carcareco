'use client'

import { IButtonOption } from "@/_components/ButtonGroup"
import { ActionBar } from "@/_components/ui/ActionBar"
import ApplyDiscountsDialog from "./activity/ApplyDiscountDialog"
import IssueOfferDialog from "./activity/IssueOfferDialog"
import ActivityNotes from "./activity/Notes"
import Saleables from "./editabletable/Saleables"
import React, { useCallback, useRef } from "react"
import { BaseDialogHandle } from "@/_components/BaseDialog"
import { DataItemRowHandle } from "./editabletable/DataIItemRow"
import { IActivities, IOfferIssuance, IProduct, IWorkData } from "../model"
import OfferAcceptedDialog from "./activity/OfferAcceptedDialog" 
import SendPricingDialog from "./activity/SendPricingDialog"
import { labels } from "@/_lib/labels"

export default function Activity({
    edit,
    work,
    activities,
    startfresh,
    issuance,
}: {
    edit: boolean,
    issuance?: IOfferIssuance,
    work: IWorkData,
    activities: IActivities,
    startfresh: boolean
}) {
    const scrollToBottom = () => {
        window.requestAnimationFrame(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollTo(0, scrollHeight);
        });
    };

    const applyDiscountsRef = React.useRef<BaseDialogHandle>(null);
    const issueOfferRef = React.useRef<BaseDialogHandle>(null);
    const offerAcceptedRef = React.useRef<BaseDialogHandle>(null);
     const sendOfferRef = React.useRef<BaseDialogHandle>(null);
    const [data, setData] = React.useState<IProduct[]>(() => {
        if (startfresh && activities.current.products.length === 0) {
            return [{ id: '-1', code: '', discount: null, name: '', price: null, quantity: 1, unit: 'tk' }];
        }

        return activities.current.products;
    });
    const tableRef = useRef<DataItemRowHandle<IProduct>[] | null[]>([]);
    const pathCancel = `/home/work/${work.id}/${activities.current.id}`
    const pathEdit = pathCancel + '/edit#items'
    const activityIsOffer = activities.items.find(x => x.id === activities.current.id)?.name == 'offer';
    const editOptions =work.issuance?[]: [
        { name: labels.work.addRow, onClick: () =>{
            addEmptyRow(1);
            scrollToBottom();
        } },
        { name: labels.actions.cancel, href: pathCancel },
        { name: labels.actions.save, isPrimary: true },
        { name: labels.work.applyDiscount, inMenu: true, onClick: () => applyDiscountsRef.current?.open() },
        { name: labels.work.addRows, inMenu: true, onClick: () =>{
            addEmptyRow(5);
            scrollToBottom();
        } }
    ] as IButtonOption[]

    const issued = !!issuance?.issuedOn;

    const accepted = !!issuance?.acceptedOn;
    const sent = !!issuance?.sentOn;
    const readOptions = work.issuance ? [] : [
        { name: labels.actions.edit, isPrimary: !activityIsOffer, inMenu: issued, href: pathEdit },
        ...(activityIsOffer && data.length > 0 ? [{
                name: (issued ? labels.work.reissueOffer : labels.work.issueOffer),
                inMenu: issued,
                isPrimary: !issued,
                onClick: () => { issueOfferRef.current?.open() },
        }] : []),
        ...(activityIsOffer && issued ? [{
            name: (sent ? labels.work.resendOffer : labels.work.sendOffer),
            inMenu: sent,
            isPrimary: false,
            onClick: () => { sendOfferRef.current?.open() },
        }] : []),
        ...(activityIsOffer && issued && !accepted ? [{
            name: labels.work.clientAccepted,
            isPrimary: true,
            onClick: () => { offerAcceptedRef.current?.open() },
        }] : []),
    ] as IButtonOption[];
    const addEmptyRow = useCallback((count: number) => {
        setData(current => {
            const negativeIds = current.filter(item => item.id.startsWith('-')).map(item => Number(item.id));
            const nextId = (negativeIds.length > 0 ? Math.min(...negativeIds) : 0) - 1;
            const newRows = Array.from({ length: count }, (_, index) => ({
                id: (nextId - index).toString(),
                code: '',
                discount: null,
                name: '',
                price: null,
                quantity: 1,
                unit: 'tk',
            }));
            return [...current, ...newRows];
        });
      }, []);

    
    const removeItem = (id: string) => {
        setData(current => current.filter(item => item.id !== id));
    }
    return (
        <div>
            {activityIsOffer&&<OfferAcceptedDialog  dialogRef={offerAcceptedRef} work={work}  activities={activities}></OfferAcceptedDialog>}
            <ApplyDiscountsDialog dialogRef={applyDiscountsRef} tableRef={tableRef} ></ApplyDiscountsDialog>
            {activityIsOffer&& <IssueOfferDialog dialogRef={issueOfferRef} work={work}   activities={activities} ></IssueOfferDialog>}
            {activityIsOffer&&issuance&& <SendPricingDialog work={work} offerId={issuance.id}  dialogRef={sendOfferRef}></SendPricingDialog>}
            <ActivityNotes notes={activities.current.notes} edit={edit} ></ActivityNotes>

            <Saleables
                edit={edit} data={data} priceSummary={activities.current.priceSummary} tableRef={tableRef} removeItem={removeItem} refreshData={setData} >
            </Saleables>

            <ActionBar className="mt-4 justify-end" options={edit ? editOptions : readOptions} />
        </div>
    )
}
