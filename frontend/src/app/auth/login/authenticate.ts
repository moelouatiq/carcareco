
'use server'
import { createSession } from '@/_lib/server/session'
import { redirect } from 'next/navigation';
import { httpPost } from '@/_lib/server/query-api';

export async function authenticate(prevState: { error: string }, formData: FormData)
  : Promise<{ error: string }> {

  const res = await httpPost(
    {
      url: 'users/authenticate',
      body: {
        username: formData.get('username'),
        password: formData.get('password'),
        serverSecret: process.env.SERVER_SECRET
      },
      authorize: false,
    }
  )

  const jsonResponse = await res.json();

  if (jsonResponse.jwt && jsonResponse.fullName && jsonResponse.timeout) {
    await createSession(
      jsonResponse.jwt,
      jsonResponse.fullName,
      jsonResponse.timeout,
    );
    // 5. Redirect user
    redirect('/home/work');
  }
  return { error: "Login failed", }
}
