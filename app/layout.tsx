import './globals.css';

export const metadata = {
  title: 'GOPE - Balancete Orçamentário',
  description: 'Sistema de controle orçamentário do Grande Oriente de Pernambuco',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
