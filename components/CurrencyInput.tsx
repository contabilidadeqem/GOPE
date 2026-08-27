'use client';

function paraCentavos(valor: number): string {
  return Math.round(valor * 100).toString();
}

function formatarDeCentavos(digitos: string): string {
  const numero = parseInt(digitos || '0', 10) / 100;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CurrencyInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const digitos = paraCentavos(value || 0);
  const exibicao = formatarDeCentavos(digitos);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const novoValor = parseInt(apenasDigitos || '0', 10) / 100;
    onChange(novoValor);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value ? exibicao : ''}
      placeholder="R$ 0,00"
      disabled={disabled}
      onChange={handleChange}
    />
  );
}
