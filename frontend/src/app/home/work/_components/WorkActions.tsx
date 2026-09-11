'use client'

import React from 'react'
import { IWorkData } from '../model'
import { ActionBar } from '@/_components/ui/ActionBar'
import { IButtonOption } from '@/_components/ButtonGroup'
import { BaseDialogHandle } from '@/_components/BaseDialog'
import ConfirmDialog, { ConfirmDialogHandle } from '@/_components/ConfirmDialog'
import IssueInvoiceDialog from './activity/IssueInvoiceDialog'
import DeleteInvoiceDialog from './activity/DeleteInvoiceDialog'
import SendPricingDialog from './activity/SendPricingDialog'
import { startAnActivity } from '../actions/startAnActivity'
import { changeWorkStatus } from '../actions/changeWorkStatus'
import { createACopy } from '../actions/createACopy'
import { deleteWork } from '../actions/deleteAnActivity'
import { togglePaid } from '../actions/togglePaid'
import { labels } from '@/_lib/labels'

/**
 * Every action the record offers, in one bar. Which actions exist is decided exactly as before:
 * an invoiced intervention gets the payment actions, an open one gets the activity and invoicing
 * actions. Only where they are shown changed -- the destructive and rarely used ones moved into
 * the overflow menu instead of sharing a segmented strip with the primary action.
 */
export function WorkActions({
  work,
  hasRepairJobWithProductsOrServices,
}: {
  work: IWorkData
  hasRepairJobWithProductsOrServices: boolean
}) {
  const editPath = '/home/work/edit/' + work.id

  const deleteInvoiceRef = React.useRef<BaseDialogHandle>(null)
  const createInvoiceRef = React.useRef<BaseDialogHandle>(null)
  const sendInvoiceRef = React.useRef<BaseDialogHandle>(null)
  const deleteWorkRef = React.useRef<ConfirmDialogHandle>(null)

  const options: IButtonOption[] = work.issuance
    ? [
        {
          name: work.issuance.isPaid ? labels.work.markUnpaid : labels.work.paymentReceived,
          isPrimary: !work.issuance.isPaid,
          onClick: async () => { await togglePaid(work.id, !work.issuance.isPaid) },
        },
        {
          name: work.issuance.sentOn ? labels.work.resendInvoice : labels.work.sendInvoice,
          onClick: () => { sendInvoiceRef.current?.open() },
        },
        { name: labels.work.createACopy, inMenu: true, onClick: async () => { await createACopy(work.id) } },
        { name: labels.work.deleteInvoice, inMenu: true, redText: true, onClick: () => { deleteInvoiceRef.current?.open() } },
      ]
    : [
        { name: labels.work.makeAnOffer, onClick: async () => { await startAnActivity(work.id, 'offer') } },
        { name: labels.work.startRepairJob, onClick: async () => { await startAnActivity(work.id, 'repairjob') } },
        { name: labels.actions.edit, href: editPath },
        ...(hasRepairJobWithProductsOrServices && work.status !== 'closed'
          ? [{ name: labels.work.issueInvoice, isPrimary: true, onClick: () => { createInvoiceRef.current?.open() } }]
          : []),
        ...(work.status === 'closed'
          ? [{ name: labels.work.reopenWork, isPrimary: true, onClick: async () => { await changeWorkStatus(work.id, 'Default') } }]
          : [{ name: labels.work.closeWork, inMenu: true, onClick: async () => { await changeWorkStatus(work.id, 'Closed') } }]),
        { name: labels.work.createACopy, inMenu: true, onClick: async () => { await createACopy(work.id) } },
        {
          name: labels.work.deleteWork,
          inMenu: true,
          redText: true,
          onClick: () => {
            deleteWorkRef.current?.open({
              title: labels.work.deleteWork,
              description: labels.work.deleteWorkConfirm,
              confirmObj: work.id,
            })
          },
        },
      ]

  return (
    <>
      <IssueInvoiceDialog work={work} dialogRef={createInvoiceRef}></IssueInvoiceDialog>
      <DeleteInvoiceDialog work={work} dialogRef={deleteInvoiceRef}></DeleteInvoiceDialog>
      <SendPricingDialog work={work} dialogRef={sendInvoiceRef}></SendPricingDialog>
      <ConfirmDialog ref={deleteWorkRef} onConfirm={async () => { await deleteWork(work.id) }}></ConfirmDialog>
      <ActionBar options={options} menuLabel={labels.work.workActions} />
    </>
  )
}
