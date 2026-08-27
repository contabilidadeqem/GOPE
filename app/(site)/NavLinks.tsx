'use client';

import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/auth';

export default function NavLinks({ role }: { role: Role }) {
  const router = useRouter();

  async function sair() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="nav-links">
      <a className="nav-link" href="/">Dashboard</a>
      <a className="nav-link" href="/sumario">Sumário</a>
      <a className="nav-link" href="/transparencia">Relatório de Transparência</a>
      {role === 'contador' && (
        <>
          <div className="nav-divider" />
          <a className="nav-link" href="/despesas/upload">Lançar Despesas</a>
          <a className="nav-link" href="/receita">Lançar Receita</a>
          <a className="nav-link" href="/plano-contas">Plano de Contas</a>
        </>
      )}
      <div className="nav-divider" />
      <button className="nav-link nav-logout" onClick={sair}>Sair</button>
    </nav>
  );
}
