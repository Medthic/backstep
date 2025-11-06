import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

// Create the real Supabase client. Ensure you set VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY in a `.env.local` (or environment) before starting Vite.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
