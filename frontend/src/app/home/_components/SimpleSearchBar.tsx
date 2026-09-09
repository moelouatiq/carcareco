import PrimaryButton from "@/_components/PrimaryButton";
import SearchInput from "./SearchInput";
import { labels } from "@/_lib/labels";

export default async function SimpleSearchBar({ searchParams,placeholder }: { searchParams: Promise<Record<string, string>>,placeholder:string }) {

  return (
    <div className=" sm:px-0 space-y-12 gap-x-2">
      <div className="  grid grid-cols-1 sm:grid-flow-col gap-x-6 gap-y-2 sm:gap-y-8  ">
        <div>
          <SearchInput searchParams={searchParams} placeholder={placeholder} ></SearchInput>
        </div>
        <div >
          <PrimaryButton className="float-right" id="btnSubmit">{labels.search.search}</PrimaryButton>
        </div>
      </div>
    </div>
  )

}