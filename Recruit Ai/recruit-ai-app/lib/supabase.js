import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import https from 'https';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not set');
}

// Use node-fetch with fresh connections to bypass Node.js v22 undici pool bug
const agent = new https.Agent({ keepAlive: false });
const customFetch = (url, opts = {}) => fetch(url, { ...opts, agent });

// Server-side client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: { fetch: customFetch },
    db: { schema: 'public' },
});

export default supabase;
