'use client'

import GreenBadge from "@/_components/GreenBadge"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelopeCircleCheck } from '@fortawesome/free-solid-svg-icons'
 
import RedBadge from "@/_components/RedBadge"
import BlueBadge from "@/_components/BlueBadge"
import { IIssuance, IOfferIssuance, IWorkIssuance } from "../../../model"
import { useHasHydrated, useLocalDateTime } from "@/_components/LocalDateTime"

const isOverDue = (issuance: IWorkIssuance) => { 
    const dueDate = new Date(issuance.issuedOn);
    dueDate.setDate(dueDate.getDate() + issuance.dueDays);
    return !issuance.isPaid && dueDate <= new Date();
}

export function IssuanceBadges({
    issueance 

}: {
    issueance: IIssuance 
}) {

    const offerIssuance = issueance as IOfferIssuance;
    const workIssuance = issueance as IWorkIssuance;
    const issuedOn = useLocalDateTime(issueance.issuedOn);
    const acceptedOn = useLocalDateTime(offerIssuance.acceptedOn);
    const hasHydrated = useHasHydrated();
    const overdue = hasHydrated && isOverDue(workIssuance);
   
    if(!issueance) throw new Error('issuance null');

    return (
        <> 
           <GreenBadge text='Issued' title={'Issued on ' + issuedOn + ' by ' + issueance.issuedBy} ></GreenBadge>
           {offerIssuance.acceptedOn && <>{' '}<GreenBadge text='Accepted' title={'Accepted on ' + acceptedOn + ' by ' + offerIssuance.acceptedBy} ></GreenBadge></>}
           <EmailSentBadge issueance={issueance}></EmailSentBadge>
           <OverdueBadge issueance={workIssuance}></OverdueBadge>
           {workIssuance.invoiceNumber && workIssuance.isPaid && !overdue && <> <GreenBadge text="Paid"></GreenBadge></>}
           {workIssuance.invoiceNumber && !workIssuance.isPaid && !overdue && <> <BlueBadge text="Unpaid"></BlueBadge></>}
        </>
    )
}


export function OverdueBadge({
    issueance 

}: {
    issueance: IWorkIssuance 
})
{ 
    const hasHydrated = useHasHydrated();

    return (
        <>{hasHydrated && issueance?.invoiceNumber && isOverDue(issueance) && <> <RedBadge text="Overdue" ></RedBadge></>}</>
    )
}

export function EmailSentBadge({
    issueance 

}: {
    issueance: IIssuance 
})
{
    const sentOn = useLocalDateTime(issueance?.sentOn);

    return (
        <>{issueance?.sentOn && <span title={'Email sent to ' + issueance.receiverEmail + ' on ' + sentOn}><FontAwesomeIcon icon={faEnvelopeCircleCheck}  size="lg" color='Green' /></span>}</>
    )
}
