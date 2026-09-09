'use server'
 
import { CardHeader } from '@/_components/Card'; 
import { httpGet } from '@/_lib/server/query-api'; 
 
import WorkInput from '../../_components/WorkInput';
import { createOrUpdate } from '../../actions/createOrUpdate';
import { IMechanic, IWorkData } from '../../model';
import Main from '@/app/home/_components/Main';
import { labels } from "@/_lib/labels";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>
}) {
 
    
     const id = (await params).id;
     const path = 'work/'+id; 
    const data = await httpGet(path);
    const work = await data.json() as IWorkData;
    const response  = await httpGet('employees');
    const employees = await response.json() as IMechanic[];
  

    return (
        <Main header={<CardHeader title={labels.work.information} description='Edit details' ></CardHeader>}>
            <form action={createOrUpdate}>
                <input type="hidden" name='id' value={id} ></input>
                <WorkInput work={work} mechanics={employees}  ></WorkInput>
            </form>
        </Main>
    )
}
