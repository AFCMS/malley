import { supabase } from "./supabase";

// List all relevant tables (in dependency order for truncation)
const TABLES = [
  "likes",
  "features",
  "follows",
  "postsCategories",
  "profilesCategories",
  "pendingAuthors",
  "authors",
  "posts",
  "profiles",
  "categories",
];

// Flush all data (CASCADE)
export async function flushAllTables() {
  for (const table of TABLES) {
    // Use RPC or raw SQL if permitted
    await supabase.rpc("exec_sql", {
      sql: `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`,
    });
    // If no exec_sql RPC, you may need to use admin API or expose a test-only function
  }
}

// Register and login a new user, returns { user, session, creds }
export async function registerAndLoginNewUser() {
  const rand = Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/gi, "")
    .slice(0, 8);
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
