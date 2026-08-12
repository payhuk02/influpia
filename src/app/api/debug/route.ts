import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: brands } = await supabase.from('brands').select('*');
  const { data: influencers } = await supabase.from('influencers').select('*');

  return NextResponse.json({
    users: users?.users?.map(u => ({ id: u.id, email: u.email, meta: u.user_metadata })),
    profiles,
    brands,
    influencers
  });
}
