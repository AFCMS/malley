const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = import.meta.env.DANGER_SUPABASE_SERVICE_KEY;

import { queries, supabase } from "../supabase";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export async function flushAllTables(): Promise<number> {
  // try calling it as anon and a regular user. refer to warning in supabase.tests.ts for details.
  const anonClient: SupabaseClient = createClient(supabaseUrl, anonKey);

  const { error: errorAnon } = await anonClient.rpc("extreme_danger_truncate_all_tables_yes_i_am_sure");
  if (!errorAnon) {
    return 2;
  }

  await registerAndLoginNewUser();
  const { error: errorUser } = await supabase.rpc("extreme_danger_truncate_all_tables_yes_i_am_sure");
  if (!errorUser) {
    return 1;
  }
  await supabase.auth.signOut();

  // good, this is not horribly messed up. Now, destroy everything
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { error } = await serviceClient.rpc("extreme_danger_truncate_all_tables_yes_i_am_sure");

  if (error) {
    console.error("Error during wiping:", error);
  } else {
    console.log("Done wiping. Begin testing.");
  }
  return 0;
}

export function randomName(length: number) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

export async function createRandomPost() {
  const dummyFile = new File(["filedata"], "myfile.png", { type: "image/png" });
  const body = randomName(64);
  const id = await queries.posts.new(body, [dummyFile]);
  return { id, body };
}

// Register and login a new user, returns { user, session, creds }
export async function registerAndLoginNewUser() {
  const rand = randomName(8);
  const handle = `user${rand}`;
  const email = `test${rand}@test.com`;
  const password = `TestPass!${rand}`;

  // Register: add handle to user data
  const { error: regError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { handle } },
  });
  if (regError) throw new Error("Registration failed: " + regError.message);

  // Login
  const {
    data: { session },
    error: loginError,
  } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError || !session) throw new Error("Login failed: " + (loginError?.message ?? "No session"));

  // Set session for global supabase client
  await supabase.auth.setSession(session);

  // Get user profile from table
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("*").eq("handle", handle);
  if (profErr || !profiles.length) throw new Error("No profile found for new user");
  const userProfile = profiles[0];

  return { user: userProfile, session, creds: { handle, email, password } };
}
