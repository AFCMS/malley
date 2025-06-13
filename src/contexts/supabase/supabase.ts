import { createClient } from "@supabase/supabase-js";
import { Database, Tables } from "./database";

import profilePicturePlaceholder from "../../assets/profile.png";
import profileBannerPlaceholder from "../../assets/background-6228032_1280.jpg";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface postWithCategories {
  post: Tables<"posts">;
  categories: Tables<"categories">[];
}

interface stdPostInfo {
  post: Tables<"posts">;
  categories: Tables<"categories">[];
  profiles: Tables<"profiles">[];
}

interface PostSearchQuery {
  has_text?: string[];
  has_authors?: string[];
  has_categories?: string[];
  liked_by?: string[];
  from_date?: string;
  to_date?: string;
  sort_by?: "created_at" | "likes";
  sort_order?: "asc" | "desc";
  paging_limit?: number;
  paging_offset?: number;
}

interface ProfileSearchQuery {
  has_handle?: string[];
  has_bio?: string[];
  has_categories?: string[];
  featured_by?: string[];
  features_user?: string[];
  likes_posts?: string[];
  from_date?: string;
  to_date?: string;
  sort_by?: "created_at" | "features_count";
  sort_order?: "asc" | "desc";
  paging_limit?: number;
  paging_offset?: number;
}

const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

async function updatePersonalFile(
  media: File | null,
  mediaField: "profile_pic" | "banner",
  bucket: "profile-pics" | "banners",
): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("not logged in");
  const id = user.id;
  const profile = await queries.profiles.get(id);

  if (media) {
    if (profile[mediaField]) {
      await supabase.storage.from(bucket).remove([profile[mediaField]]);
    }
    const extension = media.type.split("/")[1] || "png";
    const fileName = id + "_" + Math.floor(Date.now() / 1000).toString() + "." + extension;
    const req = await supabase.storage.from(bucket).upload(fileName, media, {
      cacheControl: "3600",
      upsert: false,
    });
    if (req.error) throw new Error(req.error.message);

    const updateReq = await supabase
      .from("profiles")
      .update({ [mediaField]: fileName })
      .eq("id", id);
    if (updateReq.error) throw new Error(updateReq.error.message);
  } else if (profile[mediaField]) {
    await supabase.storage.from(bucket).remove([profile[mediaField]]);
    const updateReq = await supabase
      .from("profiles")
      .update({ [mediaField]: null })
      .eq("id", id);
    if (updateReq.error) throw new Error(updateReq.error.message);
  }
}

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

    getAll: async function (): Promise<Tables<"profiles">[]> {
      const req = await supabase.from("profiles").select("*");
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

    setPinnedPost: async function (postId: string | null): Promise<void> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const pinnedPosts = postId ? [postId] : null;
      const req = await supabase.from("profiles").update({ pinned_posts: pinnedPosts }).eq("id", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
    },

    updateAvatar: (media: File | null) => updatePersonalFile(media, "profile_pic", "profile-pics"),

    updateBanner: (media: File | null) => updatePersonalFile(media, "banner", "banners"),

    getByHandle: async function (handle: string): Promise<Tables<"profiles">> {
      const req = await supabase.from("profiles").select("*").eq("handle", handle).limit(1).single();
      if (req.error) {
        throw new Error(req.error.message);
      } else {
        return req.data;
      }
    },
    getByHandleFuzzy: async function (handle: string): Promise<Tables<"profiles">[]> {
      const req = await supabase
        .from("profiles")
        .select("*")
        .ilike("handle", "%" + handle + "%");
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

    getParentChain: async function (id: string, limit = 0): Promise<Tables<"posts">[]> {
      // limit = 0 means it will go back as far as possible
      const chain: Tables<"posts">[] = [];
      let currentId: string | null = id;
      let count = 0;

      while (currentId) {
        const post = await queries.posts.get(currentId);
        chain.push(post);
        count++;
        if (limit > 0 && count >= limit) break;
        currentId = post.parent_post ?? null;
      }

      return chain;
    },

    getChildren: async function (id: string): Promise<Tables<"posts">[]> {
      const req = await supabase.from("posts").select("*").eq("parent_post", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data;
    },
    new: async function (
      body: string,
      media: File[] = [],
      parent: string | null = null,
      rtOf: string | null = null,
    ): Promise<string> {
      const formData = new FormData();
      formData.append("body", body);
      if (parent != null) formData.append("parent", parent);
      if (rtOf != null) formData.append("rtOf", rtOf);
      media.forEach((file) => {
        formData.append(`media`, file);
      });

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("Invalid session while trying to upload");
      }

      const req = await supabase.functions.invoke("createPost", { body: formData });
      if (req.error) {
        throw new Error("Something went wrong");
      }
      const result = req.data as { id: string };
      return result.id;
    },
    retweet: async function (postId: string, body = ""): Promise<string> {
      // Vérifier d'abord si l'utilisateur a déjà retweeté ce post
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const hasAlreadyRetweeted = await queries.posts.hasUserRetweeted(postId, user.id);
      if (hasAlreadyRetweeted) {
        throw new Error("Vous avez déjà retweeté ce post");
      }

      // Retweet avec ou sans contenu
      return await queries.posts.new(body, [], null, postId);
    },

    edit: async function (id: string, newBody: string): Promise<boolean> {
      const req = await supabase.from("posts").update({ body: newBody }).eq("id", id).select();

      if (req.error) {
        throw new Error(req.error.message);
      }

      if (req.data.length === 0) {
        return false;
      }
      return true;
    },

    getRetweetsOf: async function (postId: string): Promise<Tables<"posts">[]> {
      // Récupère tous les retweets d'un post donné
      const req = await supabase.from("posts").select("*").eq("rt_of", postId);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data;
    },

    isRetweet: function (post: Tables<"posts">): boolean {
      // Vérifie si un post est un retweet
      return post.rt_of !== null;
    },

    isQuoteRetweet: function (post: Tables<"posts">): boolean {
      // Vérifie si un post est un retweet avec commentaire (quote retweet)
      return post.rt_of !== null && post.body !== null && post.body.trim() !== "";
    },

    isSimpleRetweet: function (post: Tables<"posts">): boolean {
      // Vérifie si un post est un retweet simple (sans commentaire)
      return post.rt_of !== null && (post.body === null || post.body.trim() === "");
    },
    getOriginalPost: async function (post: Tables<"posts">): Promise<Tables<"posts"> | null> {
      // Récupère le post original d'un retweet
      if (!post.rt_of) return null;

      try {
        return await queries.posts.get(post.rt_of);
      } catch {
        return null;
      }
    },

    hasUserRetweeted: async function (postId: string, userId: string): Promise<boolean> {
      // Vérifie si un utilisateur a déjà retweeté ce post
      const req = await supabase
        .from("posts")
        .select("authors!inner(*)")
        .eq("rt_of", postId)
        .eq("authors.profile", userId);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length > 0;
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

      // Filtrer les retweets simples (sans message) et trier par date
      const posts = req.data.map((e) => e.posts);
      const filteredPosts = posts.filter((post) => {
        return !queries.posts.isSimpleRetweet(post);
      });

      // Trier par date de création (plus récent en premier)
      return filteredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    simpleRetweetsOf: async function (id: string): Promise<Tables<"posts">[]> {
      // Récupère uniquement les retweets simples (sans message) d'un utilisateur
      const req = await supabase.from("authors").select("posts(*)").eq("profile", id);

      if (req.error) {
        throw new Error(req.error.message);
      }

      // Filtrer pour ne garder que les retweets simples et trier par date
      const posts = req.data.map((e) => e.posts);
      const simpleRetweets = posts.filter((post) => {
        return queries.posts.isSimpleRetweet(post);
      });

      // Trier par date de création (plus récent en premier)
      return simpleRetweets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    remove: async function (postId: string): Promise<boolean> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("authors").delete().eq("post", postId).eq("profile", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    countAuthors: async function (postId: string): Promise<number> {
      const req = await supabase.from("authors").select("*", { count: "exact" }).eq("post", postId);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.count ?? 0;
    },
  },

  pendingAuthors: {
    get: async function (): Promise<Tables<"pendingAuthors">[]> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const { data, error } = await supabase.from("pendingAuthors").select("*").eq("to_profile", user.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },

    sent: async function (): Promise<Tables<"pendingAuthors">[]> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }
      const { data, error } = await supabase.from("pendingAuthors").select("*").eq("from_profile", user.id);

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
      if (req.data) {
        return true;
      }
      return false;
    },

    cancel: async function (id: string): Promise<boolean> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }
      const req = await supabase.from("pendingAuthors").delete().eq("post", id).eq("from_profile", user.id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },
    refuse: async function (id: string): Promise<boolean> {
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }
      const req = await supabase.from("pendingAuthors").delete().eq("post", id).eq("to_profile", user.id);

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

    getAproximateRankings: async function (limit: number): Promise<{ name: string; estimated_total: number }[]> {
      const req = await supabase.from("estimated_categories_usage").select("name, estimated_total").limit(limit);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return (req.data as { name: string | null; estimated_total: number | null }[]).map((item) => ({
        name: item.name ?? "",
        estimated_total: item.estimated_total ?? 0,
      }));
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
      const req = await supabase
        .from("postsCategories")
        .delete()
        .eq("post", post_id)
        .eq("category", await queries.categories.getEnsuredId(name));

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

    add: async function (name: string): Promise<boolean> {
      // add to the logged in user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }

      const req = await supabase.from("profilesCategories").insert({
        profile: user.id,
        category: await queries.categories.getEnsuredId(name),
      });

      if (req.error) {
        throw new Error(req.error.message);
      }
      return true;
    },

    remove: async function (name: string): Promise<boolean> {
      // remove to the logged in user
      const user = await getUser();
      if (!user) {
        throw new Error("not logged in");
      }
      const req = await supabase
        .from("profilesCategories")
        .delete()
        .eq("profile", user.id)
        .eq("category", await queries.categories.getEnsuredId(name));

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

  features: {
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
      const req = await supabase.from("likes").select("post:posts(*)").eq("profile", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.post);
    },

    byWho: async function (id: string): Promise<Tables<"profiles">[]> {
      // profiles who liked the provided post id
      const req = await supabase.from("likes").select("profile:profiles(*)").eq("post", id);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.map((e) => e.profile);
    },

    doesUserLikePost: async function (user: string, post: string): Promise<boolean> {
      const req = await supabase.from("likes").select("*").eq("profile", user).eq("post", post).limit(1);

      if (req.error) {
        throw new Error(req.error.message);
      }
      return req.data.length > 0;
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

      console.log(`[DEBUG SUPABASE] Remove like - Post: ${id}, User: ${user.id}`);

      // Vérifier d'abord que le like existe
      const checkReq = await supabase.from("likes").select("*").eq("post", id).eq("profile", user.id);
      console.log(`[DEBUG SUPABASE] Check before delete:`, checkReq.data);

      const req = await supabase.from("likes").delete().eq("post", id).eq("profile", user.id);

      console.log(`[DEBUG SUPABASE] Delete request result:`, req);
      if (req.error) {
        console.error(`[DEBUG SUPABASE] Delete error:`, req.error);
        throw new Error(req.error.message);
      }

      // Vérifier après suppression
      const afterReq = await supabase.from("likes").select("*").eq("post", id).eq("profile", user.id);
      console.log(`[DEBUG SUPABASE] Check after delete:`, afterReq.data);

      return true;
    },
  },

  views: {
    getPostWithCategories: async function (id: string): Promise<postWithCategories> {
      // mostly intended for the profile viewer
      const req = await supabase
        .from("posts")
        .select(
          `
          *,
          postsCategories:postsCategories(
            categories:categories(*)
          )
        `,
        )
        .eq("id", id)
        .single();

      if (req.error) throw new Error(req.error.message);

      const categories = req.data.postsCategories.map((pc) => pc.categories as Tables<"categories">);

      return {
        post: req.data as Tables<"posts">,
        categories,
      };
    },

    standardPostInfo: async function (id: string): Promise<stdPostInfo> {
      // mostly intended for the classic feed
      const req = await supabase
        .from("posts")
        .select(
          `
          *,
          postsCategories:postsCategories(
            categories:categories(*)
          ),
          authors:authors(
            profiles:profiles(*)
          )
        `,
        )
        .eq("id", id)
        .single();

      if (req.error) throw new Error(req.error.message);

      const categories = req.data.postsCategories.map((pc) => pc.categories as Tables<"categories">);

      const profiles = req.data.authors.map((pc) => pc.profiles as Tables<"profiles">);

      return {
        post: req.data as Tables<"posts">,
        categories,
        profiles,
      };
    },
  },

  feed: {
    posts: {
      generateParams: async function (): Promise<PostSearchQuery> {
        // Generates personalised query parameters for the user
        // for now, this only matches the profile’s tags. A better algorithm could be implemented later on
        const user = await getUser();
        if (!user) {
          throw new Error("not logged in");
        }

        return {
          has_categories: (await queries.profilesCategories.get(user.id)).map((cat) => cat.id),
        };
      },

      get: async function (params: PostSearchQuery): Promise<Tables<"posts">[]> {
        const { data, error } = await supabase.rpc("get_posts_feed", {
          ...params,
        });
        if (error) throw error;
        return data;
      },
    },

    profiles: {
      generateParams: async function (): Promise<ProfileSearchQuery> {
        // Generates personalised query parameters for the user
        // for now, this only matches the profile’s tags. A better algorithm could be implemented later on
        const user = await getUser();
        if (!user) {
          throw new Error("not logged in");
        }

        return {
          has_categories: (await queries.profilesCategories.get(user.id)).map((cat) => cat.id),
        };
      },

      get: async function (params: ProfileSearchQuery): Promise<Tables<"profiles">[]> {
        const { data, error } = await supabase.rpc("get_profiles_feed", {
          ...params,
        });
        if (error) throw error;
        return data;
      },
    },
  },
};

const utils = {
  getAvatarUrl: (profile: Tables<"profiles"> | undefined | null): string => {
    if (!profile) {
      return profilePicturePlaceholder;
    }

    if (profile.profile_pic) {
      return supabase.storage.from("profile-pics").getPublicUrl(profile.profile_pic).data.publicUrl;
    }
    return profilePicturePlaceholder;
  },
  getBannerUrl: (profile: Tables<"profiles">): string => {
    if (profile.banner) {
      return supabase.storage.from("banners").getPublicUrl(profile.banner).data.publicUrl;
    }
    return profileBannerPlaceholder;
  },
};

export { supabase, queries, utils };
export type { PostSearchQuery, ProfileSearchQuery, postWithCategories, stdPostInfo };
