'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json();
      setErro(data.error || 'Não foi possível entrar');
    }
    setEntrando(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bege-claro), var(--bege-medio))',
      padding: 20,
    }}>
      <form onSubmit={entrar} className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>GRANDE ORIENTE DE PERNAMBUCO</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Balancete Orçamentário</div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Usuário</label>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus style={{ width: '100%' }} />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ width: '100%' }} />
        </div>

        {erro && <div style={{ color: 'var(--vermelho-institucional)', fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        <button className="btn-primary" type="submit" disabled={entrando} style={{ width: '100%' }}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
