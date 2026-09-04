const { createClient } = require('@supabase/supabase-js');

if (typeof __dirname !== 'undefined') {
  const path = require('path');
  try {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
  } catch (err) {
    // Ignore dotenv error in environments where .env is pre-loaded or unneeded
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://qkbnnlnyanysiokegdpo.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'your-supabase-service-role-key-here') {
  console.warn('[Supabase] Warning: SUPABASE_SERVICE_ROLE_KEY is not configured yet in environment.');
}

// Service role key is used to bypass RLS at the application layer
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
