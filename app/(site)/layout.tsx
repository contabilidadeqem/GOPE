import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySession } from '@/lib/auth';
import NavLinks from './NavLinks';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const role = await verifySession(token);

  if (!role) redirect('/login');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>GRANDE ORIENTE DE PERNAMBUCO</h1>
        <div className="sub">Balancete Orçamentário</div>
        <NavLinks role={role} />
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
