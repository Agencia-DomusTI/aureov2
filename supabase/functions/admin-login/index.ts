import { assertJwtSecretConfigured, createAdminToken, verifyPassword } from '../_shared/adminAuth.ts';
import { createServiceClient, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    assertJwtSecretConfigured();

    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'JSON inválido' }, 400);
    }

    const { email, password } = body;
    if (!email || !password) {
      return json({ error: 'Email y contraseña requeridos' }, 400);
    }

    const supabase = createServiceClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, name, password_hash, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      return json(
        { error: 'Tabla admin_users no encontrada. Ejecuta la migración SQL en Supabase.' },
        503,
      );
    }

    if (!user || !user.is_active) {
      return json({ error: 'Credenciales incorrectas' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return json({ error: 'Credenciales incorrectas' }, 401);
    }

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = await createAdminToken({ id: user.id, email: user.email });
    return json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return json({ error: message }, 500);
  }
});
