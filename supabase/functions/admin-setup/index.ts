import {
  createAdminToken,
  getSetupSecret,
  hashPassword,
  verifyPassword,
} from '../_shared/adminAuth.ts';
import { createServiceClient, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; password?: string; name?: string; setupSecret?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const { email, password, name, setupSecret } = body;
  if (!email || !password || password.length < 8) {
    return json({ error: 'Email y contraseña requeridos (mínimo 8 caracteres)' }, 400);
  }

  const supabase = createServiceClient();
  const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });

  const expectedSecret = getSetupSecret();
  if (!expectedSecret) {
    return json({ error: 'ADMIN_SETUP_SECRET no configurado en Supabase Secrets' }, 503);
  }

  if ((count ?? 0) > 0 && setupSecret !== expectedSecret) {
    return json({ error: 'Clave de configuración incorrecta' }, 403);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return json({ error: 'Ese email ya está registrado' }, 409);
  }

  const { data: user, error } = await supabase
    .from('admin_users')
    .insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      name: name?.trim() || null,
    })
    .select('id, email, name')
    .single();

  if (error || !user) {
    return json({ error: error?.message ?? 'No se pudo crear el usuario' }, 500);
  }

  const token = await createAdminToken(user);
  return json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
    message: 'Administrador creado correctamente',
  });
});
