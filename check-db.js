const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim().replace(/["']/g, '');
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  console.log("Users:", JSON.stringify(users.users.map(u => ({ id: u.id, email: u.email, meta: u.user_metadata })), null, 2));
  
  const { data: profiles, error: err2 } = await supabase.from('profiles').select('*');
  console.log("Profiles:", profiles);
  
  const { data: brands } = await supabase.from('brands').select('*');
  console.log("Brands:", brands);
  
  const { data: influencers } = await supabase.from('influencers').select('*');
  console.log("Influencers:", influencers);
}
check();
