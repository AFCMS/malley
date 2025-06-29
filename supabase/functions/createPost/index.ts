import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  // Parse form data
  const form = await req.formData();
  const body = form.get("body");
  const parent_post = form.get("parent");
  const rt_of = form.get("rtOf");
  const files = form.getAll("media") as File[];

  // Insert post
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .insert({ body, parent_post, rt_of })
    .select("id")
    .single();
  if (postErr) {
    return new Response(postErr.message, { status: 500, headers: corsHeaders });
  }

  // Upload files
  if (files.length > 0) {
    const postId = post.id;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let ext = "";
      const match = file.name?.match(/\.([a-zA-Z0-9]+)$/);
      if (match) ext = match[1];
      const path = `${postId}/${i}${ext ? `.${ext}` : ""}`;
      const { error: upErr } = await supabase.storage.from("post-media").upload(
        path,
        file,
      );
      if (upErr) {
        return new Response(upErr.message, {
          status: 500,
          headers: corsHeaders,
        });
      }
    }
  }

  // Attribute authorship
  const { error } = await supabase.from("authors").insert({
    profile: user.id,
    post: post.id,
  });
  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ id: post.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
