'use client';

import FormTextArea from "@/_components/FormTextArea";
import { labels } from "@/_lib/labels";

export default function ActivityNotes({
  notes,
  edit
}: {
  notes: string,
  edit: boolean
}) {
  if (!edit) {
    if (!notes) return null;
    return (
      <div className="mb-4">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{labels.common.notes}</p>
        <p className="mt-0.5 text-sm whitespace-pre-line text-ink">{notes}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <FormTextArea placeholder={labels.work.notesPlaceholder} defaultValue={notes} name="notes"></FormTextArea>
    </div>
  );
}
