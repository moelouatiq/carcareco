'use client'

import GreenBadge from "@/_components/GreenBadge"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelopeCircleCheck } from '@fortawesome/free-solid-svg-icons'
 
import RedBadge from "@/_components/RedBadge"
import BlueBadge from "@/_components/BlueBadge"
import { IIssuance, IOfferIssuance, IWorkIssuance } from "../../../model"
import { useHasHydrated, useLocalDateTime } from "@/_components/LocalDateTime"
import { labels } from "@/_lib/labels";

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
           <GreenBadge text={labels.badges.issued} title={'Émis le ' + issuedOn + ' par ' + issueance.issuedBy} ></GreenBadge>
           {offerIssuance.acceptedOn && <>{' '}<GreenBadge text={labels.badges.accepted} title={'Accepté le ' + acceptedOn + ' par ' + offerIssuance.acceptedBy} ></GreenBadge></>}
           <EmailSentBadge issueance={issueance}></EmailSentBadge>
           <OverdueBadge issueance={workIssuance}></OverdueBadge>
           {workIssuance.invoiceNumber && workIssuance.isPaid && !overdue && <> <GreenBadge text={labels.badges.paid}></GreenBadge></>}
           {workIssuance.invoiceNumber && !workIssuance.isPaid && !overdue && <> <BlueBadge text={labels.badges.unpaid}></BlueBadge></>}
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
        <>{hasHydrated && issueance?.invoiceNumber && isOverDue(issueance) && <> <RedBadge text={labels.badges.overdue} ></RedBadge></>}</>
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
        <>{issueance?.sentOn && <span title={'E-mail envoyé à ' + issueance.receiverEmail + ' le ' + sentOn}><FontAwesomeIcon icon={faEnvelopeCircleCheck}  size="lg" color='Green' /></span>}</>
    )
}
