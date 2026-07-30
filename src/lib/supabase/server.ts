import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client pentru Server Components / Route Handlers (respectă sesiunea userului)
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options?: object }[]) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // apelat dintr-un Server Component — ignorăm
          }
        },
      },
    }
  );
}
