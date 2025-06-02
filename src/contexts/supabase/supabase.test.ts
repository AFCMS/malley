import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { Tables } from "./database";
import { queries, supabase } from "./supabase";
import { flushAllTables, randomName, registerAndLoginNewUser } from "./supabase.test-utils";

let ifTest;
if (process.env.TEST_SUPABASE || process.env.TEST_ALL) {
  ifTest = test; // this is much more convenient than test.runIf. i mean, cmon
  if (!process.env.DESTRUCTIVE_SUPABASE && !process.env.DESTRUCTIVE_ALL) {
    throw new Error("Testing the supabase necessitates wiping it. Set DESTRUCTIVE_SUPABASE environment to allow it.");
  }
} else {
  ifTest = test.skip;
}

beforeAll(async () => {
  // clean the db
  await flushAllTables();
});

afterAll(async () => {
  // clean the db again
  await flushAllTables();
});

async function createRandomPost() {
  const dummyFile = new File(["filedata"], "myfile.txt", { type: "text/plain" });
  const body = randomName(64);
  const id = await queries.posts.new(body, [dummyFile]);
  return { id, body };
}

describe.sequential("supabase", () => {
  describe("posts", () => {
    ifTest("logged in creation", async () => {
      await registerAndLoginNewUser();
      const { id, body } = await createRandomPost();
      const post = await queries.posts.get(id);
      expect(post.body).toBe(body);
      expect((await supabase.storage.from("posts-media").list(id)).data?.length !== 1);
    });
  });

  describe("authors", () => {
    ifTest("get", async () => {
      const { user } = await registerAndLoginNewUser();
      const { id, body } = await createRandomPost();
      await supabase.auth.signOut();
      const posters = await queries.authors.ofPost(id);
      expect(posters.length).toBe(1);
      expect(posters[0]).toStrictEqual(user);
      const posts = await queries.authors.postsOf(user.id);
      expect(posts.length).toBe(1);
      expect(posts[0].body).toStrictEqual(body);
    });
  });

  describe("pending authors", () => {
    ifTest("invite/cancel invite to user to author", async () => {
      const { user } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      await registerAndLoginNewUser();
      const { id } = await createRandomPost();
      await queries.pendingAuthors.invite(user.id, id);
      expect((await queries.pendingAuthors.sent()).length).toBe(1);
      await queries.pendingAuthors.cancel(id); // test cancelling
      expect((await queries.pendingAuthors.sent()).length).toBe(0);
      await queries.pendingAuthors.invite(user.id, id); // resend
      expect((await queries.pendingAuthors.sent()).length).toBe(1);
    });

    ifTest("get and accept author invites", async () => {
      const { user, creds } = await registerAndLoginNewUser();
      const { email, password } = creds;
      await supabase.auth.signOut();
      const user2 = (await registerAndLoginNewUser()).user;
      const { id } = await createRandomPost();
      await queries.pendingAuthors.invite(user.id, id);
      await supabase.auth.signOut();
      await supabase.auth.signInWithPassword({ email, password });
      const invites = await queries.pendingAuthors.get();
      expect(invites.length).toBe(1);
      expect(invites[0].from_profile).toBe(user2.id);
      expect(invites[0].post).toBe(id);
      await queries.pendingAuthors.accept(id);
      expect((await queries.authors.postsOf(user.id)).length).toBe(1);
    });
  });

  describe("categories", () => {
    ifTest("ensure category exists", async () => {
      await registerAndLoginNewUser();
      const name = randomName(8);
      const category = await queries.categories.get(await queries.categories.getEnsuredId(name));
      expect(category.name).toBe(name);
    });

    ifTest("pattern matching", async () => {
      await registerAndLoginNewUser();
      const name = "very_precise_pattern_to_match";
      await queries.categories.getEnsuredId(name);
      expect((await queries.categories.match("_precise_pattern_to_match")).length).toBe(1);
      expect((await queries.categories.match("_precise_pattern_to_")).length).toBe(1);
      expect((await queries.categories.match("very_precise_pattern_to_")).length).toBe(1);
    });
  });

  describe("posts categories", () => {
    ifTest("add category to post", async () => {
      await registerAndLoginNewUser();
      const { id } = await createRandomPost();
      const name = randomName(8);
      await queries.postsCategories.add(id, name);
      const categories = await queries.postsCategories.get(id);
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe(name);
    });

    ifTest("remove post category", async () => {
      await registerAndLoginNewUser();
      const { id } = await createRandomPost();
      const name = randomName(8);
      await queries.postsCategories.add(id, name);
      await queries.postsCategories.remove(id, name);
      const categories = await queries.postsCategories.get(id);
      expect(categories.length).toBe(0);
    });
  });

  describe("profile categories", () => {
    ifTest("add for self", async () => {
      const { user } = await registerAndLoginNewUser();
      const name1 = randomName(8);
      const name2 = randomName(8);
      await queries.profilesCategories.add(name1);
      await queries.profilesCategories.add(name2);
      const categories = await queries.profilesCategories.get(user.id);
      expect(categories.length).toBe(2);
      expect(categories.some((cat) => cat.name === name1)).toBe(true);
      expect(categories.some((cat) => cat.name === name2)).toBe(true);
    });

    ifTest("remove for self", async () => {
      const { user } = await registerAndLoginNewUser();
      const name1 = randomName(8);
      const name2 = randomName(8);
      await queries.profilesCategories.add(name1);
      await queries.profilesCategories.add(name2);
      await queries.profilesCategories.remove(name1);
      await queries.profilesCategories.remove(name2);
      expect((await queries.profilesCategories.get(user.id)).length).toBe(0);
    });
  });

  describe("follows", () => {
    ifTest("add for self", async () => {
      // Setup: create 3 users
      const { user: user1 } = await registerAndLoginNewUser();
      const { user: user2 } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      await registerAndLoginNewUser();

      // Act: userA follows userB and userC
      await queries.follows.add(user1.id);
      await queries.follows.add(user2.id);

      // Assert
      const follows = await queries.follows.get();
      expect(follows.length).toBe(2);
      const followedIds = follows.map((u) => u.id);
      expect(followedIds).toContain(user1.id);
      expect(followedIds).toContain(user2.id);
    });

    ifTest("remove for self", async () => {
      // Setup: create 3 users and set up follows
      const { user: user1 } = await registerAndLoginNewUser();
      const { user: user2 } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      await registerAndLoginNewUser();
      await queries.follows.add(user1.id);
      await queries.follows.add(user2.id);

      // Act: remove userC from follows
      await queries.follows.remove(user2.id);

      // Assert
      const follows = await queries.follows.get();
      expect(follows.length).toBe(1);
      const followedIds = follows.map((u) => u.id);
      expect(followedIds).toContain(user1.id);
      expect(followedIds).not.toContain(user2.id);
    });
  });

  describe("features", () => {
    ifTest("add for self", async () => {
      // Setup: create 3 users
      const { user: user1 } = await registerAndLoginNewUser();
      const { user: user2 } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      const { user: user3 } = await registerAndLoginNewUser();

      // Act: userA follows userB and userC
      await queries.features.add(user1.id);
      await queries.features.add(user2.id);

      // Assert
      const features = await queries.features.byUser(user3.id);
      expect(features.length).toBe(2);
      const featuredIds = features.map((u) => u.id);
      expect(featuredIds).toContain(user1.id);
      expect(featuredIds).toContain(user2.id);
    });

    ifTest("queries", async () => {
      // 3 users with some follows
      const { user: user1 } = await registerAndLoginNewUser();
      const { user: user2, session: session2 } = await registerAndLoginNewUser();
      const { user: user3 } = await registerAndLoginNewUser();
      await queries.features.add(user1.id);
      await queries.features.add(user2.id);
      await supabase.auth.setSession(session2);
      await queries.features.add(user1.id);
      await supabase.auth.signOut();

      // check it works :')
      expect((await queries.features.byUser(user3.id)).length).toBe(2);
      expect((await queries.features.byWho(user3.id)).length).toBe(0);
      expect((await queries.features.byUser(user2.id)).length).toBe(1);
      expect((await queries.features.byWho(user2.id)).length).toBe(1);
      expect((await queries.features.byUser(user1.id)).length).toBe(0);
      expect((await queries.features.byWho(user1.id)).length).toBe(2);
      expect(await queries.features.doesXfeatureY(user2.id, user1.id)).toBe(true);
      expect(await queries.features.doesXfeatureY(user2.id, user3.id)).toBe(false);
    });

    ifTest("remove for self", async () => {
      // Setup: create 3 users and set up features
      const { user: user1 } = await registerAndLoginNewUser();
      const { user: user2 } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      const { user: user3 } = await registerAndLoginNewUser();
      await queries.features.add(user1.id);
      await queries.features.add(user2.id);

      // Act: remove user2 from follows
      await queries.features.remove(user2.id);

      // Assert
      const features = await queries.features.byUser(user3.id);
      expect(features.length).toBe(1);
      const featuredIds = features.map((u) => u.id);
      expect(featuredIds).toContain(user1.id);
      expect(featuredIds).not.toContain(user2.id);
    });
  });
});
