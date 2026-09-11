'use server'

import { httpGet } from '@/_lib/server/query-api'
import { IWorkData, IActivities, IOfferIssuance } from '../model'
import { PageHeader } from '@/_components/ui/PageHeader'
import { Section } from '@/_components/ui/Section'
import NoProducts from '../_components/NoProducts'
import { createOrUpdateProducts } from '../actions/createOrUpdateProducts'
import Activity from '../_components/Activity'
import { ActivityTimeline } from '../_components/ActivityTimeline'
import { WorkSummary } from '../_components/WorkSummary'
import { WorkActions } from '../_components/WorkActions'
import { WorkProgressToggle } from '../_components/WorkProgressToggle'
import { InvoiceSection } from '../_components/InvoiceSection'
import { EstimateSummary } from '../_components/EstimateSummary'
import PricingDownloadLink from '../_components/activity/PricingDownloadLink'
import PrintPricingLink from '../_components/activity/PrintPricingLink'
import { getActivityDisplayName } from '../_components/activity/getActivityDisplayName'
import { ActivityCreatedBy } from '../_components/activity/ActivityCreatedBy'
import WorkStatusBadge from '../_components/activity/badges/WorkStatusBadge'
import { labels } from '@/_lib/labels'

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string[] }>
}) {

    const [id, activityId, action, startfresh] = (await params).slug;

    let data = await httpGet('work/' + id);
    const work = await data.json() as IWorkData;

    data = await httpGet(!activityId ? 'work/' + id + '/activities' : 'work/' + id + '/activities/' + activityId);
    const activities = await data.json() as IActivities;

    const isEditing = action == 'edit';
    const current = activities.current;

    const activity = activities?.items?.find(x => x.id == current.id);
    if (!activity) throw new Error('Activity expected');
    const activityName = activity.name;
    const activityNumber = activity.number;

    data = await httpGet('pricings/offers/' + work.id);
    const issueances = await data.json() as IOfferIssuance[];
    const issuance = issueances.find(x => x.id === activity?.id)

    const activityDisplayName = getActivityDisplayName(activityName, activityNumber, issuance?.number);
    const hasRepairJobWithProductsOrServices = activities.items.findIndex(x => !x.isEmpty && x.name == 'repairjob') > -1;
    const workTitle = `${labels.work.workNumber} ${work.number}`;
    const isEmpty = current.products.length === 0 && !current?.notes && !isEditing;

    return (
        <main className="lg:pl-60 pb-8">
            <div className="min-w-0 px-4 py-6 sm:px-8">
                <PageHeader
                    breadcrumb={[{ label: labels.nav.work, href: '/home/work' }, { label: workTitle }]}
                    title={workTitle}
                    meta={
                        <>
                            <WorkStatusBadge status={work.status}></WorkStatusBadge>
                            <WorkProgressToggle work={work}></WorkProgressToggle>
                        </>
                    }
                    actions={
                        <WorkActions
                            work={work}
                            hasRepairJobWithProductsOrServices={hasRepairJobWithProductsOrServices}
                        ></WorkActions>
                    }
                />

                {/* One column of sections, in the order the shop reads them: who and what, then what
                    was done, then what it is billed as. The record used to put all of this in a
                    432px panel that only existed above 1536px. */}
                <div className="grid gap-4">
                    <WorkSummary work={work}></WorkSummary>

                    <ActivityTimeline work={work} activities={activities} issueances={issueances}></ActivityTimeline>

                    <Section
                        title={activityDisplayName}
                        actions={issuance && (
                            <div className="flex items-center gap-x-3">
                                <PricingDownloadLink name="Offer" hideLabel={true} id={issuance.id} number={issuance.number}></PricingDownloadLink>
                                <PrintPricingLink pricingName="Offer" id={issuance.id}></PrintPricingLink>
                            </div>
                        )}
                    >
                        <div className="mb-4">
                            <ActivityCreatedBy activity={activity}></ActivityCreatedBy>
                        </div>

                        {issuance && <EstimateSummary issuance={issuance} priceSummary={current.priceSummary}></EstimateSummary>}

                        {isEmpty ? <NoProducts work={work} activityId={current.id}></NoProducts>
                            : <form action={createOrUpdateProducts}>
                                <input type="hidden" name="workId" value={work.id}></input>
                                <input type="hidden" name="activityId" value={current.id}></input>
                                <input type="hidden" name="activityName" value={activityName}></input>
                                <input type="hidden" name="activityNumber" value={activityNumber}></input>
                                <Activity issuance={issuance} edit={isEditing} work={work} activities={activities} startfresh={startfresh === 'startfresh'}></Activity>
                            </form>
                        }
                    </Section>

                    <InvoiceSection work={work}></InvoiceSection>
                </div>
            </div>
        </main>
    )
}
