import { describe, expect, test } from "vitest";

import { queries, supabase } from "../supabase";
import { randomName, registerAndLoginNewUser, createRandomPost } from "./supabase.test-utils";

export function minimal_function() {
  describe("minimal function goes through", () => {
    describe("posts", () => {
      test("logged in creation", async () => {
        await registerAndLoginNewUser();
        const { id, body } = await createRandomPost();
        const post = await queries.posts.get(id);
        expect(post.body).toBe(body);
        expect((await supabase.storage.from("posts-media").list(id)).data?.length !== 1).toBe(true);
      });

      test("edit post body", async () => {
        await registerAndLoginNewUser();
        const { id } = await createRandomPost();
        const newBody = "This is the new content";
        const result = await queries.posts.edit(id, newBody);
        expect(result).toBe(true);
        const post = await queries.posts.get(id);
        expect(post.body).toBe(newBody);
      });

      test("edit non-existent post returns false or throws", async () => {
        await registerAndLoginNewUser();
        // statistacally, not in db
        const fakeId = "00000000-0000-4000-8000-000000000000";
        expect(await queries.posts.edit(fakeId, "irrelevant")).toBe(false);
      });

      describe("getParentChain", () => {
        test("returns the correct parent chain, no limit", async () => {
          await registerAndLoginNewUser();
          const { id: rootId } = await createRandomPost();
          const { data: data1, error: error1 } = await supabase
            .from("posts")
            .insert({ body: "reply1", parent_post: rootId })
            .select("id")
            .single();
          const { data: data2, error: error2 } = await supabase
            .from("posts")
            .insert({ body: "reply2", parent_post: data1?.id })
            .select("id")
            .single();

          if (error1 || error2) {
            console.error(error1);
            console.error(error2);
            throw new Error();
          }

          const chain = await queries.posts.getParentChain(data2.id);
          expect(chain.length).toBe(3);
          expect(chain[0].id).toBe(data2.id);
          expect(chain[1].id).toBe(data1.id);
          expect(chain[2].id).toBe(rootId);
          expect(chain[2].parent_post).toBeNull();
        });

        test("respects limit", async () => {
          await registerAndLoginNewUser();
          const { id: rootId } = await createRandomPost();

          const { data: data1, error: error1 } = await supabase
            .from("posts")
            .insert({ body: "reply1", parent_post: rootId })
            .select("id")
            .single();
          // Create a reply to reply1
          const { data: data2, error: error2 } = await supabase
            .from("posts")
            .insert({ body: "reply2", parent_post: data1?.id })
            .select("id")
            .single();

          if (error1 || error2) {
            console.error(error1);
            console.error(error2);
            throw new Error();
          }

          // Limit to 2
          const chain = await queries.posts.getParentChain(data2.id, 2);
          expect(chain.length).toBe(2);
          expect(chain[0].id).toBe(data2.id);
          expect(chain[1].id).toBe(data1.id);
        });

        test("returns only self for root post", async () => {
          await registerAndLoginNewUser();
          const { id: rootId } = await createRandomPost();
          const chain = await queries.posts.getParentChain(rootId);
          expect(chain.length).toBe(1);
          expect(chain[0].id).toBe(rootId);
          expect(chain[0].parent_post).toBeNull();
        });
      });
    });

    describe("authors", () => {
      test("get", async () => {
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
      test("invite/cancel invite to user to author", async () => {
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

      test("get and accept author invites", async () => {
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
      test("ensure category exists", async () => {
        await registerAndLoginNewUser();
        const name = randomName(8);
        const category = await queries.categories.get(await queries.categories.getEnsuredId(name));
        expect(category.name).toBe(name);
      });

      test("pattern matching", async () => {
        await registerAndLoginNewUser();
        const name = "very_precise_pattern_to_match";
        await queries.categories.getEnsuredId(name);
        expect((await queries.categories.match("_precise_pattern_to_match")).length).toBe(1);
        expect((await queries.categories.match("_precise_pattern_to_")).length).toBe(1);
        expect((await queries.categories.match("very_precise_pattern_to_")).length).toBe(1);
      });
    });

    describe("posts categories", () => {
      test("add category to post", async () => {
        await registerAndLoginNewUser();
        const { id } = await createRandomPost();
        const name = randomName(8);
        await queries.postsCategories.add(id, name);
        const categories = await queries.postsCategories.get(id);
        expect(categories.length).toBe(1);
        expect(categories[0].name).toBe(name);
      });

      test("remove post category", async () => {
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
      test("add for self", async () => {
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

      test("remove for self", async () => {
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
      test("add for self", async () => {
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

      test("remove for self", async () => {
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
      test("add for self", async () => {
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

      test("queries", async () => {
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

      test("remove for self", async () => {
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

    describe("storage", () => {
      const registerPersonalFilesTests = (
        updateFn: (file: File | null) => Promise<void>,
        bucketName: string,
        testName: string,
      ) => {
        describe(`storage (${bucketName}) - ${testName}`, () => {
          test(`can upload own ${testName}`, async () => {
            await registerAndLoginNewUser();
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });
            await expect(updateFn(dummyFile)).resolves.not.toThrow();
          });

          test(`delete/reupload ${testName}`, async () => {
            await registerAndLoginNewUser();
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });
            await expect(updateFn(dummyFile)).resolves.not.toThrow();
            await expect(updateFn(null)).resolves.not.toThrow();
            const dummyFile2 = new File(["dummy2"], "file2.png", { type: "image/png" });
            await expect(updateFn(dummyFile2)).resolves.not.toThrow();
          });

          test(`can remove own ${testName}`, async () => {
            await registerAndLoginNewUser();
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });
            await updateFn(dummyFile);
            await expect(updateFn(null)).resolves.not.toThrow();
          });
        });
      };

      registerPersonalFilesTests(queries.profiles.updateAvatar, "profile-pics", "profile picture");

      registerPersonalFilesTests(queries.profiles.updateBanner, "banners", "banner");
    });
  });
}
