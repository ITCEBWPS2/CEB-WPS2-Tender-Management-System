const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://qkbnnlnyanysiokegdpo.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'your-supabase-service-role-key-here') {
  console.warn('[Supabase] Warning: SUPABASE_SERVICE_ROLE_KEY is not configured yet in environment.');
}

// Service role key is used to bypass RLS at the Express application layer
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
