import { SignJWT, jwtVerify } from 'npm:jose@5';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOKEN_TTL = '7d';

function getJwtSecret() {
  const secret = Deno.env.get('ADMIN_JWT_SECRET');
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET no configurado (mínimo 32 caracteres)');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(user: { id: string; email: string }) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (!payload.sub || !payload.email) throw new Error('Token inválido');
  return { id: payload.sub as string, email: payload.email as string };
}

export async function verifyAdminRequest(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado');

  const token = authHeader.slice(7);
  if (token.startsWith('eyJ') === false && token.length < 40) {
    throw new Error('No autorizado');
  }

  const admin = await verifyAdminToken(token);
  const { data: user } = await supabase
    .from('admin_users')
    .select('id, email, name, is_active')
    .eq('id', admin.id)
    .eq('is_active', true)
    .single();

  if (!user) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

export function assertJwtSecretConfigured() {
  const secret = Deno.env.get('ADMIN_JWT_SECRET');
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET no configurado (mínimo 32 caracteres)');
  }
}
