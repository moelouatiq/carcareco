'use client'

import {IActivities, IActivity, IOfferIssuance,IWorkData } from '../model'
import clsx from 'clsx'
import Link from 'next/link'
import { WorkInformation } from './WorkInformation'
import { deleteAnActivity } from "../actions/deleteAnActivity"
import ConfirmDialog, { ConfirmDialogHandle } from '@/_components/ConfirmDialog'
import React  from 'react'
import { IButtonOption } from '@/_components/ButtonGroup' 
import HamburgerMenu from '@/_components/HamburgerMenu'  
import { ActivityCreatedBy } from './activity/ActivityCreatedBy' 
import { getActivityDisplayName } from './activity/getActivityDisplayName' 
import { IssuanceBadges } from './activity/badges/IssuanceBadges' 
import PricingDownloadLink from './activity/PricingDownloadLink' 

function ActivityListItem({
  workId,
  activity,
  issuance,
  isSelected,
  canEdit,
}: {
  workId: string,
  activity: IActivity,
  issuance?: IOfferIssuance,
  isSelected: boolean,
  canEdit: boolean,
}) {
  const confirmRemoveActivityRef = React.useRef<ConfirmDialogHandle>(null);
  const name = getActivityDisplayName(activity.name, activity.number, issuance?.number);
  const href = `/home/work/${workId}/${activity.id}`;
  const options = canEdit ? [
    { name: 'Edit', href: `${href}/edit` },
    {
      name: 'Delete',
      onClick: () => confirmRemoveActivityRef.current?.open({
        title: name,
        description: 'Are you sure you want to delete it?',
        confirmObj: activity,
      }),
    },
  ] as IButtonOption[] : [];

  return (
    <li className={clsx(isSelected ? "border border-gray-900/5 rounded-xl bg-gray-50" : "",
      "px-4 xl:px-8 flex m-4 items-center justify-between gap-x-6")}>
      <div className="min-w-0 py-5">
        <div className="flex gap-x-1 xl:gap-x-2">
          <p className={clsx(isSelected && "font-semibold", "truncate text-sm/6 text-gray-900")}>
            <Link href={href}>{name}</Link>
          </p>
          {issuance && <PricingDownloadLink name="Offer" hideLabel={true} id={issuance.id} number={issuance.number} />}
          {issuance && <IssuanceBadges issueance={issuance} />}
        </div>
        <ActivityCreatedBy activity={activity} />
      </div>
      {canEdit &&
        <div className="flex flex-none items-center gap-x-4">
          <HamburgerMenu options={options} />
        </div>}
      <ConfirmDialog ref={confirmRemoveActivityRef} onConfirm={async (item: IActivity) => {
        await deleteAnActivity(workId, item.number, item.name);
      }} />
    </li>
  );
}

export default function Activities({
  work,
  activities,
  issueances,
}: {
  work: IWorkData,
  activities: IActivities,
  issueances: IOfferIssuance[]
}) {
 
  const containsRepairJobWithProductsOrServices = activities.items.findIndex(x=>!x.isEmpty && x.name == 'repairjob')>-1;
  const items = activities.items??[];
  //todo fix bordering 
  return (
    <aside className="2xl:fixed  pl-0 lg:pl-60 2xl:pl-0    bg-white  border-l-1  border-l-gray-200  overflow-y-auto overflow-x-hidden  inset-y-0 right-0    2xl:w-108    ">
      <ul role="list" className="  mb-0 pb-0   inset-y-0   2xl:w-108">
        <li className='  '>
          <div className="p-5 pb-10">
            <WorkInformation hasRepairJobWithProductsOrServices={containsRepairJobWithProductsOrServices} work={ work} ></WorkInformation>
          </div>
        </li>
      </ul>
      
      <ul role="list" className="hidden 2xl:block border-b border-gray-900/5 inset-y-0  2xl:w-108">

        {items.length > 1 && items.map(item =>
          <ActivityListItem
            key={item.id}
            workId={work.id}
            activity={item}
            issuance={issueances.find(issuance => issuance.id === item.id)}
            isSelected={item.id === activities.current.id}
            canEdit={!work.issuance}
          />)}
      </ul> 
 
    </aside>
  )
}
