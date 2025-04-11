import { createClient } from "@supabase/supabase-js";
import { Database, Tables } from "./database";
import { v4 } from "uuid";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

<<<<<<< HEAD
const {
  data: { user },
} = await supabase.auth.getUser();

/*
  syntax :
=======
const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/*
  syntax:
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
      const req = await supabase.from("profiles").select("*").eq("id", id).single();

      if (req.error) {
        throw new Error(req.error.message);
      } else {
        return req.data;
      }
    },

    isNameAvailable: async function (name: string): Promise<boolean> {
      const req = await supabase.from("profiles").select("*").eq("handle", name).single();
      alert("req");
      if (req.error) {
        return true;
      } else {
        return false;
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

    new: async function (body: string, media: File[]): Promise<boolean> {
      let id: string;
      do {
        id = v4();
      } while (
        // in the comedically rare case of a collision, regenerate it
<<<<<<< HEAD
        // OR, if we feel spicy, put an easter egg here !
=======
        // OR, if we feel spicy, put an easter egg here!
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
        (await supabase.storage.from("posts_media").list(id)).data != null
      );
      for (let i = 0; i < media.length; i++) {
        await supabase.storage.from("post_media").upload(id.toString() + "/" + i.toString(), media[i]);
      }
      const req = await supabase.from("posts").insert({
        body: body,
        media: id,
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
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
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
      const req = await supabase.from("categories").select("*").like("name", like);

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
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("follows").select("profiles(*)").eq("follower", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    add: async function (id: string): Promise<boolean> {
      // follows provided user
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("follows").delete().eq("followee", id).eq("follower", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
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

    byWho: async function (id: string): Promise<Tables<"profiles">[]> {
      const req = await supabase.from("features").select("profiles!featurer(*)").eq("featuree", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profiles);
    },

    doesXfeatureY: async function (X: string, Y: string): Promise<boolean> {
      const req = await supabase.from("features").select("1").eq("featurer", X).eq("featuree", Y);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length != 0;
    },

    add: async function (id: string): Promise<boolean> {
      // features provided user
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
<<<<<<< HEAD
=======
      const user = await getUser();
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
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
};

export { supabase, queries };
