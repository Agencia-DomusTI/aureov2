import { verifyAdminRequest } from '../_shared/adminAuth.ts';
import { createServiceClient, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createServiceClient();
    const user = await verifyAdminRequest(req, supabase);
    return json({ authenticated: true, user });
  } catch {
    return json({ authenticated: false }, 401);
  }
});
