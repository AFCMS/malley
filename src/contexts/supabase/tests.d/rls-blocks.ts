import { describe, expect, test } from "vitest";

import { queries, supabase } from "../supabase";
import { randomName, registerAndLoginNewUser, createRandomPost } from "./supabase.test-utils";

export const rls_blocks = describe("rls blocks inapropriate requests", () => {
  describe("misuse of supabase.ts", () => {
    describe("posts", () => {
      test("cannot post when not logged in", async () => {
        await supabase.auth.signOut();
        await expect(async () => {
          await createRandomPost();
        }).rejects.toThrow();
      });
    });

    describe("pendingAuthors", () => {
      test("cannot send/cancel/get/accept invite when not logged in", async () => {
        await registerAndLoginNewUser();
        const target = (await registerAndLoginNewUser()).user;
        const { id } = await createRandomPost();
        await supabase.auth.signOut();
        await expect(queries.pendingAuthors.invite(target.id, id)).rejects.toThrow();
        await expect(queries.pendingAuthors.cancel(id)).rejects.toThrow();
        await expect(queries.pendingAuthors.get()).rejects.toThrow();
        expect(await queries.pendingAuthors.accept(id)).toBe(false);
      });
    });

    describe("categories", () => {
      test("cannot ensure category exists when not logged in", async () => {
        await registerAndLoginNewUser();
        const name = randomName(8);
        await supabase.auth.signOut();
        await expect(queries.categories.getEnsuredId(name)).rejects.toThrow();
      });
    });

    describe("postCategories", () => {
      test("cannot manage categories of posts when not logged in", async () => {
        await registerAndLoginNewUser();
        const { id } = await createRandomPost();
        const name = randomName(8);
        await supabase.auth.signOut();
        await expect(queries.postsCategories.add(id, name)).rejects.toThrow();
        await expect(queries.postsCategories.remove(id, name)).rejects.toThrow();
      });
    });

    describe("profileCategories", () => {
      test("cannot manage categories of profiles when not logged in", async () => {
        await registerAndLoginNewUser();
        const name = randomName(8);
        await supabase.auth.signOut();
        await expect(queries.profilesCategories.add(name)).rejects.toThrow();
        await expect(queries.profilesCategories.remove(name)).rejects.toThrow();
      });
    });

    describe("follows", () => {
      test("cannot do anything on follows when not logged in", async () => {
        await registerAndLoginNewUser();
        const { user } = await registerAndLoginNewUser();
        await supabase.auth.signOut();
        await expect(queries.follows.add(user.id)).rejects.toThrow();
        await expect(queries.follows.remove(user.id)).rejects.toThrow();
        await expect(queries.follows.get()).rejects.toThrow();
      });
    });

    describe("features", () => {
      test("cannot write on features when not logged in", async () => {
        await registerAndLoginNewUser();
        const { user } = await registerAndLoginNewUser();
        await supabase.auth.signOut();
        await expect(queries.features.add(user.id)).rejects.toThrow();
        await expect(queries.features.remove(user.id)).rejects.toThrow();
      });
    });
  });

  describe("direct sql queries", () => {
    describe("cannot update profile of other user", async () => {
      const { user } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      await registerAndLoginNewUser();
      const req = await supabase
        .from("profiles")
        .update({ bio: randomName(64) })
        .eq("id", user.id);
      await expect(req).rejects.toThrow();
    });

    describe("cannot get pendingAuthors information of other user", async () => {
      const { user } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      await registerAndLoginNewUser();
      const req1 = await supabase.from("pendingAuthors").select("*").eq("to_profile", user.id);
      await expect(req1).rejects.toThrow();
      const req2 = await supabase.from("pendingAuthors").select("*").eq("from_profile", user.id);
      await expect(req2).rejects.toThrow();
    });

    describe("cannot change features of other user", async () => {
      const { user: user1 } = await registerAndLoginNewUser();
      await supabase.auth.signOut();
      const { user: user2 } = await registerAndLoginNewUser();

      const req1 = await supabase.from("features").insert({
        featuree: user2.id,
        featurer: user1.id,
      });
      const req2 = await supabase.from("features").delete().eq("featuree", user2.id).eq("featurer", user1.id);
      await expect(req1).rejects.toThrow();
      await expect(req2).rejects.toThrow();
    });
  });
});
