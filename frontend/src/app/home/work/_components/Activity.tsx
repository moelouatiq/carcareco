'use client'

import ButtonGroup, { IButtonOption } from "@/_components/ButtonGroup"
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
        { name: 'Add row', onClick: () =>{
            addEmptyRow(1);
            scrollToBottom();
        } },
        { name: 'Cancel ', href: pathCancel },
        { name: 'Save', isPrimary: true },
        { name: 'Apply discount', inMenu: true, onClick: () => applyDiscountsRef.current?.open() },
        { name: 'Add more rows', inMenu: true, onClick: () =>{
            addEmptyRow(5);
            scrollToBottom();
        } }
    ] as IButtonOption[]

    const issued = !!issuance?.issuedOn;

    const accepted = !!issuance?.acceptedOn;
    const sent = !!issuance?.sentOn;
    const readOptions = work.issuance ? [] : [
        { name: 'Edit ', isPrimary: !activityIsOffer, inMenu: issued, href: pathEdit },
        ...(activityIsOffer && data.length > 0 ? [{
                name:  (issued?'Reissue offer':'Issue offer'),
                inMenu: issued,
                isPrimary: !issued,
                onClick: () => { issueOfferRef.current?.open() },
        }] : []),
        ...(activityIsOffer && issued ? [{
            name: (sent?'Resend offer':'Send offer'),
            inMenu: sent,
            isPrimary: false,
            onClick: () => { sendOfferRef.current?.open() },
        }] : []),
        ...(activityIsOffer && issued && !accepted ? [{
            name: 'Client accepted',
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
        <div className="">
            {activityIsOffer&&<OfferAcceptedDialog  dialogRef={offerAcceptedRef} work={work}  activities={activities}></OfferAcceptedDialog>}
            <ApplyDiscountsDialog dialogRef={applyDiscountsRef} tableRef={tableRef} ></ApplyDiscountsDialog>
            {activityIsOffer&& <IssueOfferDialog dialogRef={issueOfferRef} work={work}   activities={activities} ></IssueOfferDialog>}
            {activityIsOffer&&issuance&& <SendPricingDialog work={work} offerId={issuance.id}  dialogRef={sendOfferRef}></SendPricingDialog>}
            <div className="xl:flex xl:items-end">
                <div className="xl:flex-auto xl:px-4  ">
                    <ActivityNotes notes={activities.current.notes} edit={edit} ></ActivityNotes>
                </div>
            </div>
            <Saleables
                edit={edit} data={data} priceSummary={activities.current.priceSummary} tableRef={tableRef} removeItem={removeItem} refreshData={setData} >
            </Saleables>
            <div className="xl:flex inline-flex float-right xl:items-center">
                <div className="xl:flex-auto mt-8 inline-flex">

                </div>
                <div className="inline-flex   mt-8 mb-8 rounded-md shadow-xs">
                    {edit ? <ButtonGroup  options={editOptions} ></ButtonGroup> : <ButtonGroup options={readOptions} ></ButtonGroup>}
                </div>
            </div>
        </div>
    )
}
