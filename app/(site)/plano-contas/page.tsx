import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySession } from '@/lib/auth';
import PlanoContasEditor from './PlanoContasEditor';

export default async function PlanoContasPage() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const role = await verifySession(token);

  if (role !== 'contador') redirect('/');

  return <PlanoContasEditor />;
}
