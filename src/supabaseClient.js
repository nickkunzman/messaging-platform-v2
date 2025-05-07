import { createClient } from "@supabase/supabase-js";

// CRA uses process.env.REACT_APP_*
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are not set.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
