export type Role = 'contador' | 'cliente';

const COOKIE_NAME = 'gope_session';

function getSecret() {
  return process.env.AUTH_SECRET || 'gope-dev-secret-troque-em-producao';
}

async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Buffer.from(sig).toString('hex');
}

export async function signSession(role: Role): Promise<string> {
  const sig = await hmac(role);
  return `${role}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<Role | null> {
  if (!token) return null;
  const [role, sig] = token.split('.');
  if (!role || !sig) return null;
  const expected = await hmac(role);
  if (expected !== sig) return null;
  if (role !== 'contador' && role !== 'cliente') return null;
  return role;
}

export function checarCredenciais(usuario: string, senha: string): Role | null {
  const contadorUser = process.env.CONTADOR_USUARIO || 'contador';
  const contadorPass = process.env.CONTADOR_SENHA || 'gope-admin-2026';
  const clienteUser = process.env.CLIENTE_USUARIO || 'grande_oriente';
  const clientePass = process.env.CLIENTE_SENHA || 'GOPE@2026';

  if (usuario === contadorUser && senha === contadorPass) return 'contador';
  if (usuario === clienteUser && senha === clientePass) return 'cliente';
  return null;
}

export { COOKIE_NAME };
