'use client'

import { FormRadio } from "@/_components/FormInput"
import FormSwitch from "@/_components/FormSwitch";
import { labels } from "@/_lib/labels";

export default function SearchStatusFilter({
  status,
  issued,
}: {
  status?: string | undefined
  issued: boolean
}) {
  function submitFormOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    event.currentTarget.form?.submit();
  }

  return (
    <div className=" flex gap-x-2 mb-2">
      <div className="flex  items-center gap-x-2 ">
        <input type="hidden" id="issued" name="issued" value={(issued ? "on" : "off")}></input>
        <FormSwitch
          defaultChecked={issued}
          small={true}
          onChange={() => {
            const issuedHidden = document.getElementById("issued");
            if (issuedHidden) (issuedHidden as HTMLInputElement).value = issued ? "off" : "on";
            //reset radio
            const radioAll = document.getElementById('all') as HTMLInputElement;
            if (radioAll.checked) document.getElementById('btnSubmit')?.click()
            else radioAll?.click();
          }} >
        </FormSwitch>
        <label className="block text-sm/6 font-medium text-gray-900">{(issued ? labels.workStatus.completed : labels.workStatus.work)}</label>
      </div>
      <div className="flex   items-center  gap-x-2 ">
        <FormRadio id="all" label={labels.workStatus.all} name="status" onChange={submitFormOnChange} defaultChecked={(!status || status === 'all')} value="all" ></FormRadio>
      </div>
      {!issued && <div className="flex items-center gap-x-2">
        <FormRadio id="unfinished" label={labels.workStatus.unfinished} name="status" onChange={submitFormOnChange} defaultChecked={(status === 'unfinished')} value="unfinished" ></FormRadio>
      </div>}
      {!issued && <div className="flex  items-center  gap-x-2 ">
        <FormRadio id="inprogress" label={labels.workStatus.inProgress} name="status" onChange={submitFormOnChange} defaultChecked={(status === 'inprogress')} value="inprogress" ></FormRadio>
      </div>}
      {!issued && <div className="flex   items-center  gap-x-2 ">
        <FormRadio id="closed" label={labels.workStatus.closed} name="status" onChange={submitFormOnChange} defaultChecked={(status === 'closed')} value="closed" ></FormRadio>
      </div>}
      {issued && <div className="flex   items-center  gap-x-2 ">
        <FormRadio id="overdue" label={labels.workStatus.overdue} name="status" onChange={submitFormOnChange} defaultChecked={(status === 'overdue')} value="overdue" ></FormRadio>
      </div>}
    </div>
  )
}
