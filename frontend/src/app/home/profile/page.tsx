import { httpGet } from "@/_lib/server/query-api";
import { IUserProfile } from "./model";
import SettingsTabs from "@/_components/SettingsTabs";
import { PageHeader } from "@/_components/ui/PageHeader";
import { ButtonLink } from "@/_components/ui/Button";
import { Section } from "@/_components/ui/Section";
import { DescriptionItem } from "@/_components/DescriptionItem";
import { PencilSquareIcon } from "@heroicons/react/16/solid";
import Image from 'next/image';
import { labels } from "@/_lib/labels";

export default async function Page() {
    const data = await httpGet('profile');
    const options = await data.json() as IUserProfile;
    const fullName = [options.firstName, options.lastName].filter(Boolean).join(' ');

    return (
        <main className="lg:pl-60 pb-8">
            <div className="px-4 py-6 sm:px-8">
                <PageHeader
                    breadcrumb={[{ label: labels.nav.account }]}
                    title={labels.nav.profile}
                    actions={
                        <ButtonLink href="/home/profile/edit" tone="primary">
                            <PencilSquareIcon aria-hidden="true" className="-ml-0.5 size-4" />
                            {labels.actions.edit}
                        </ButtonLink>
                    }
                />

                <SettingsTabs />

                <div className="mt-5">
                    <Section title={labels.profile.myInformation} bodyClassName="px-4 py-4">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                            {options.profileImageBase64 && (
                                <Image
                                    alt=""
                                    src={"data:image/png;base64," + options.profileImageBase64}
                                    width={128}
                                    height={128}
                                    unoptimized
                                    className="size-20 shrink-0 rounded-full border border-line bg-neutral-soft object-cover"
                                />
                            )}
                            <dl className="min-w-0 flex-1 divide-y divide-line">
                                <DescriptionItem label={labels.profile.fullName} value={fullName}></DescriptionItem>
                                <DescriptionItem label={labels.profile.userName} value={options.userName}></DescriptionItem>
                                <DescriptionItem label={labels.profile.email} value={options.email}></DescriptionItem>
                            </dl>
                        </div>
                    </Section>
                </div>
            </div>
        </main>
    )
}
