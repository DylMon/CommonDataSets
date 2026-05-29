// Supabase client — imported by school.html and index.html
// Replace the placeholder values below with your actual project credentials
// (Project Settings → API in the Supabase dashboard).
//
// IMPORTANT: Only ever expose the anon/public key here, never the service_role key.

const SUPABASE_URL  = 'https://wakqidqrkqyplobtlzpn.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Wl0t3iYbEMPci_Vn3dPg3A_QmWrIjBJ';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
