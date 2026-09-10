import { httpGet } from "@/_lib/server/query-api";
import { IUserOptions } from "./model";
import SettingsTabs from "@/_components/SettingsTabs";
import { PageHeader } from "@/_components/ui/PageHeader";
import { ButtonLink } from "@/_components/ui/Button";
import { Section } from "@/_components/ui/Section";
import { DescriptionItem } from "@/_components/DescriptionItem";
import { PencilSquareIcon } from "@heroicons/react/16/solid";
import { labels } from "@/_lib/labels";

export default async function Page() {
    const data = await httpGet('options');
    const options = await data.json() as IUserOptions;

    return (
        <main className="lg:pl-60 pb-8">
            <div className="px-4 py-6 sm:px-8">
                <PageHeader
                    breadcrumb={[{ label: labels.nav.settings }]}
                    title={labels.nav.settings}
                    actions={
                        <ButtonLink href="/home/settings/edit" tone="primary">
                            <PencilSquareIcon aria-hidden="true" className="-ml-0.5 size-4" />
                            {labels.actions.edit}
                        </ButtonLink>
                    }
                />

                <SettingsTabs />

                {/* Three groups, each in its own light section, so a long settings page reads as a
                    list of subjects rather than one continuous form. */}
                <div className="mt-5 grid gap-4">
                    <Section title={labels.settings.companyInformation} bodyClassName="px-4 py-1">
                        <dl className="divide-y divide-line">
                            <DescriptionItem label={labels.settings.name} value={options.requisites.name}></DescriptionItem>
                            <DescriptionItem label={labels.settings.phone} value={options.requisites.phone}></DescriptionItem>
                            <DescriptionItem label={labels.settings.address} value={options.requisites.address}></DescriptionItem>
                            <DescriptionItem label={labels.settings.email} value={options.requisites.email}></DescriptionItem>
                            <DescriptionItem label={labels.settings.bankAccount} value={options.requisites.bankAccount}></DescriptionItem>
                            <DescriptionItem label={labels.settings.regNr} value={options.requisites.regNr}></DescriptionItem>
                            <DescriptionItem label={labels.settings.taxId} value={options.requisites.kmkr}></DescriptionItem>
                        </dl>
                    </Section>

                    <Section title={labels.settings.invoiceOptions} bodyClassName="px-4 py-1">
                        <dl className="divide-y divide-line">
                            <DescriptionItem label={labels.settings.vatRate} value={options.pricing.invoice.vatRate}></DescriptionItem>
                            <DescriptionItem label={labels.settings.surcharge} value={options.pricing.invoice.surCharge}></DescriptionItem>
                            <DescriptionItem label={labels.settings.disclaimer} className="whitespace-pre-line" value={options.pricing.invoice.disclaimer}></DescriptionItem>
                            <DescriptionItem label={labels.settings.signatureLine} value={options.pricing.invoice.signatureLine ? labels.common.yes : labels.common.no}></DescriptionItem>
                            <DescriptionItem label={labels.settings.emailContent} className="whitespace-pre-line" value={options.pricing.invoice.emailContent}></DescriptionItem>
                        </dl>
                    </Section>

                    <Section title={labels.settings.offerOptions} bodyClassName="px-4 py-1">
                        <dl className="divide-y divide-line">
                            <DescriptionItem label={labels.settings.emailContent} className="whitespace-pre-line" value={options.pricing.estimate.emailContent}></DescriptionItem>
                        </dl>
                    </Section>
                </div>
            </div>
        </main>
    )
}
