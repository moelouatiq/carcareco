'use server'

import WorkInput from '../_components/WorkInput';
import { createOrUpdate } from '../actions/createOrUpdate';
import Main from '../../_components/Main';
import { CardHeader } from '@/_components/Card'; 
import { httpGet } from '@/_lib/server/query-api';
import { IMechanic } from '../model';
import { labels } from "@/_lib/labels";

export default async function Page() {
 
    const response  = await httpGet('employees');
    const employees = await response.json() as IMechanic[];
    
    return (
        <Main header={<CardHeader title={labels.work.newWork} description='Enter details' ></CardHeader>}>
            <form action={createOrUpdate}>
                <input type="hidden" name='id'  ></input>
                <WorkInput mechanics={employees}  ></WorkInput>
            </form>
        </Main>
    )
}
