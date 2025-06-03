import { createClient } from "@supabase/supabase-js";
import { Database, Tables } from "./database";
import { v4 } from "uuid";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/*
  syntax:
    queries.profile.get(id)
    queries.post.new(data)
    queries.
*/

const queries = {
  /**
   * @throws {Error}
   */

  profiles: {
    get: async function (id: string): Promise<Tables<"profiles">> {
      const req = await supabase.from("profiles").select("*").eq("id", id).limit(1).single();

      if (req.error) {
        throw new Error(req.error.message);
      } else {
        return req.data;
      }
    },

    updateBio: async function (bio: string) {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("profiles").update({ bio: bio }).eq("id", user.id);
      if (req.error) {
        throw new Error(req.error.message);
      }
    },

    getByHandle: async function (handle: string): Promise<Tables<"profiles">> {
      const req = await supabase.from("profiles").select("*").eq("handle", handle).limit(1).single();
      if (req.error) {
        throw new Error(req.error.message);
      } else {
        return req.data;
      }
    },

    isNameAvailable: async function (name: string): Promise<boolean> {
      try {
        await queries.profiles.getByHandle(name);
        return false;
      } catch {
        return true;
      }
    },
  },

  posts: {
    get: async function (id: string): Promise<Tables<"posts">> {
      const req = await supabase.from("posts").select("*").eq("id", id).single();

      if (req.error) {
        throw new Error(req.error.message);
      } else {
        return req.data;
      }
    },

    new: async function (body: string, media: File[]): Promise<string> {
      let id: string | undefined = undefined;
      if (media.length != 0) {
        do {
          id = v4();
        } while (
          // in the comedically rare case of a collision, regenerate it
          // OR, if we feel spicy, put an easter egg here!
          (await supabase.storage.from("posts-media").list(id)).data?.length !== 0
        );
        for (let i = 0; i < media.length; i++) {
          console.log("uploading");
          await supabase.storage.from("post-media").upload(id + "/" + i.toString(), media[i]);
        }
      }
      const { data, error } = await supabase
        .from("posts")
        .insert({
          body: body,
          media: media.length == 0 ? null : id,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }
      if (!data.id) {
        throw new Error("id wasn’t returned");
      }
      return data.id;
    },
  },

  authors: {
    ofPost: async function (id: string): Promise<Tables<"profiles">[]> {
      const req = await supabase.from("authors").select("profiles(*)").eq("post", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    postsOf: async function (id: string): Promise<Tables<"posts">[]> {
      const req = await supabase.from("authors").select("posts(*)").eq("profile", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.posts);
    },
  },

  pendingAuthors: {
    get: async function (): Promise<{ from: Tables<"profiles">; post: Tables<"posts"> }[]> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const { data, error } = await supabase
        .from("pendingAuthors")
        .select(
          `
          from:profiles!from_profile(*),
          post:posts!post(*)
        `,
        )
        .eq("to_profile", user.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },

    invite: async function (profile: string, post: string): Promise<boolean> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("pendingAuthors").insert({
        from_profile: user.id,
        to_profile: profile,
        post: post,
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    accept: async function (id: string): Promise<boolean> {
      const req = await supabase.rpc("accept_co_authoring", { post_id: id });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
  },

  categories: {
    get: async function (id: string): Promise<Tables<"categories">> {
      const req = await supabase.from("categories").select("*").eq("id", id).single();

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data;
    },

    match: async function (like: string): Promise<Tables<"categories">[]> {
      const req = await supabase
        .from("categories")
        .select("*")
        .ilike("name", "%" + like + "%");
      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data;
    },

    getEnsuredId: async function (name: string): Promise<string> {
      const req = await supabase.rpc("id_of_ensured_category", { request: name });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data;
    },
  },

  postsCategories: {
    get: async function (id: string): Promise<Tables<"categories">[]> {
      const req = await supabase.from("postsCategories").select("categories(*)").eq("post", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.categories);
    },

    add: async function (post_id: string, name: string): Promise<boolean> {
      const req = await supabase.from("postsCategories").insert({
        post: post_id,
        category: await queries.categories.getEnsuredId(name),
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (post_id: string, name: string): Promise<boolean> {
      const req = await supabase.from("postsCategories").delete().eq("post", post_id).eq("category", name);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
  },

  profilesCategories: {
    get: async function (id: string): Promise<Tables<"categories">[]> {
      const req = await supabase.from("profilesCategories").select("categories(*)").eq("profile", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.categories);
    },

    add: async function (post_id: string, name: string): Promise<boolean> {
      const req = await supabase.from("profilesCategories").insert({
        profile: post_id,
        category: await queries.categories.getEnsuredId(name),
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (post_id: string, name: string): Promise<boolean> {
      const req = await supabase.from("profilesCategories").delete().eq("post", post_id).eq("category", name);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
  },

  follows: {
    get: async function (): Promise<Tables<"profiles">[]> {
      // gets follows of the current user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("follows").select("profiles!followee(*)").eq("follower", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    add: async function (id: string): Promise<boolean> {
      // follows provided user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("follows").insert({
        followee: id,
        follower: user.id,
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (id: string): Promise<boolean> {
      // unfollows provided user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("follows").delete().eq("followee", id).eq("follower", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    doesXFollowY: async function (X: string, Y: string): Promise<boolean> {
      const req = await supabase.from("follows").select("*").eq("follower", X).eq("followee", Y);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length != 0;
    },
  },

  featuredUsers: {
    byUser: async function (id: string): Promise<Tables<"profiles">[]> {
      const req = await supabase.from("features").select("profiles!featuree(*)").eq("featurer", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    /**
     * Get the count of users who have been featured by the specified user. Approximative value for huge numbers.
     */
    byUserCount: async function (id: string): Promise<number> {
      const req = await supabase.from("features").select("*", { count: "estimated" }).eq("featurer", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.count ?? 0;
    },

    byWho: async function (id: string): Promise<Tables<"profiles">[]> {
      const req = await supabase.from("features").select("profiles!featurer(*)").eq("featuree", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    doesXfeatureY: async function (X: string, Y: string): Promise<boolean> {
      const req = await supabase.from("features").select("*").eq("featurer", X).eq("featuree", Y);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length != 0;
    },

    add: async function (id: string): Promise<boolean> {
      // features provided user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("features").insert({
        featuree: id,
        featurer: user.id,
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (id: string): Promise<boolean> {
      // unfeatures provided user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("features").delete().eq("featuree", id).eq("featurer", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
  },

  like: {
    byUser: async function (id: string): Promise<Tables<"posts">[]> {
      // posts a user liked
      const req = await supabase.from("likes").select("posts(*)").eq("profile", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.posts);
    },

    byWho: async function (id: string): Promise<Tables<"profiles">[]> {
      // profiles who liked the provided post id
      const req = await supabase.from("likes").select("profiles!profile(*)").eq("post", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    doesUserLikePost: async function (user: string, post: string): Promise<boolean> {
      const req = await supabase.from("likes").select("1").eq("profile", user).eq("post", post);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length != 0;
    },

    add: async function (id: string): Promise<boolean> {
      // likes provided post
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("likes").insert({
        post: id,
        profile: user.id,
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (id: string): Promise<boolean> {
      // removes like on provided post
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("likes").delete().eq("post", id).eq("profile", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
  },
};

export { supabase, queries };
