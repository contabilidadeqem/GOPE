import './globals.css';

export const metadata = {
  title: 'GOPE - Balancete Orçamentário',
  description: 'Sistema de controle orçamentário do Grande Oriente de Pernambuco',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <h1>GRANDE ORIENTE DE PERNAMBUCO</h1>
            <div className="sub">Balancete Orçamentário</div>
            <a className="nav-link" href="/">Dashboard</a>
            <a className="nav-link" href="/sumario">Sumário</a>
            <a className="nav-link" href="/despesas/upload">Lançar Despesas</a>
            <a className="nav-link" href="/receita">Lançar Receita</a>
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
