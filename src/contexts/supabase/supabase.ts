import { createClient } from "@supabase/supabase-js";
import { Database } from "./database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * @throws {Error}
 */
async function getProfile(id: string) {
  const req = await supabase.from("profiles").select("*").eq("id", id).single();

  if (req.error) {
    throw new Error(req.error.message);
  } else {
    return req.data;
  }
}

async function profileNameAvaillable(name: string): Promise<boolean> {
  alert("profileNameAvaillable");
  const req = await supabase.from("profiles").select("*").eq("handle", name).single();
  alert("req");
  if (req.error) {
    return true;
  } else {
    return false;
  }
}

export { supabase, getProfile, profileNameAvaillable };
