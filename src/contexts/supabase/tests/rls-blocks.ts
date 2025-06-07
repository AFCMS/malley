import { describe, expect, test } from "vitest";
import { queries, supabase } from "../supabase";
import { randomName, registerAndLoginNewUser, createRandomPost } from "./supabase.test-utils";

export function rls_blocks() {
  describe("rls blocks inapropriate requests", () => {
    describe("misuse of supabase.ts", () => {
      describe("posts", () => {
        test("cannot post when not logged in", async () => {
          await supabase.auth.signOut();
          await expect(async () => {
            await createRandomPost();
          }).rejects.toThrow();
        });

        test("cannot edit another user's post", async () => {
          await registerAndLoginNewUser();
          const { id } = await createRandomPost();
          await supabase.auth.signOut();
          await registerAndLoginNewUser();
          expect(await queries.posts.edit(id, "hacked!")).toBe(false);
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
      test("cannot update profile of other user", async () => {
        const { user } = await registerAndLoginNewUser();
        await supabase.auth.signOut();
        await registerAndLoginNewUser();
        const req = await supabase
          .from("profiles")
          .update({ bio: randomName(64) })
          .eq("id", user.id);
        expect(req.data).toBe(null);
      });

      test("cannot get pendingAuthors information of other user", async () => {
        const { user } = await registerAndLoginNewUser();
        await supabase.auth.signOut();
        await registerAndLoginNewUser();
        const req1 = await supabase.from("pendingAuthors").select("*").eq("to_profile", user.id);
        const req2 = await supabase.from("pendingAuthors").select("*").eq("from_profile", user.id);
        expect(req1.data).toStrictEqual([]);
        expect(req2.data).toStrictEqual([]);
      });

      test("cannot change features of other user", async () => {
        const { user: user1 } = await registerAndLoginNewUser();
        await supabase.auth.signOut();
        const { user: user2 } = await registerAndLoginNewUser();

        await supabase.from("features").insert({
          featuree: user2.id,
          featurer: user1.id,
        });
        expect(await queries.features.doesXfeatureY(user1.id, user2.id)).toBe(false);
        const req2 = await supabase.from("features").delete().eq("featuree", user2.id).eq("featurer", user1.id);
        expect(req2.error == null).toBe(true);
      });
    });

    describe("profile pictures", () => {
      test("cannot upload file with invalid name", async () => {
        await registerAndLoginNewUser();
        const dummyFile = new File(["avatar-data"], "avatar.png", { type: "image/png" });
        // This filename does NOT start with the user's UUID
        const fileName = "invalidprefix_" + Math.floor(Date.now() / 1000).toString() + ".png";

        const req = await supabase.storage.from("profile-pics").upload(fileName, dummyFile, {
          cacheControl: "3600",
          upsert: false,
        });

        expect(req.error).not.toBeNull();
      });

      test("cannot upload a second profile pic for the same user", async () => {
        const { user } = await registerAndLoginNewUser();
        const dummyFile1 = new File(["avatar-data"], "avatar1.png", { type: "image/png" });
        await expect(queries.profiles.updateAvatar(dummyFile1)).resolves.not.toThrow();

        const dummyFile2 = new File(["avatar-data"], "avatar2.png", { type: "image/png" });
        const extension = dummyFile2.type.split("/")[1] || "png";
        const fileName = user.id + "_" + Math.floor(Date.now() / 1000).toString() + "." + extension;
        const req = await supabase.storage.from("profile-pics").upload(fileName, dummyFile2, {
          cacheControl: "3600",
          upsert: false,
        });

        expect(req.error).not.toBeNull();
      });

      test("cannot upload profile pic when not logged in", async () => {
        // also serves as impostor test
        const { user } = await registerAndLoginNewUser();
        await supabase.auth.signOut();

        // Use the valid naming convention
        const extension = "png";
        const fileName = user.id + "_" + Math.floor(Date.now() / 1000).toString() + "." + extension;
        const dummyFile = new File(["avatar-data"], "avatar.png", { type: "image/png" });

        const req = await supabase.storage.from("profile-pics").upload(fileName, dummyFile, {
          cacheControl: "3600",
          upsert: false,
        });

        expect(req.error).not.toBeNull();
      });

      test("cannot remove another user's profile pic", async () => {
        let { user: userA } = await registerAndLoginNewUser();
        const dummyFile = new File(["avatar-data"], "avatar.png", { type: "image/png" });
        await queries.profiles.updateAvatar(dummyFile);

        await supabase.auth.signOut();
        await registerAndLoginNewUser();
        userA = await queries.profiles.get(userA.id);
        if (userA.profile_pic == null) {
          throw new Error();
        }
        await supabase.storage.from("profile-pics").remove([userA.profile_pic]);

        const req = await supabase.storage.from("profile-pics").download(userA.profile_pic);
        expect(req.error).toBeNull();
        expect(req.data).not.toBeNull();
      });
    });

    describe("storage", () => {
      const registerPersonalFilesNegativeTests = (
        updateFn: (file: File | null) => Promise<void>,
        bucketName: "profile-pics" | "banners",
        testName: "profile picture" | "banner",
        field: "profile_pic" | "banner",
      ) => {
        describe(`storage (${bucketName}) - negative ${testName}`, () => {
          test(`cannot upload ${testName} with invalid name`, async () => {
            await registerAndLoginNewUser();
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });
            // Filename does NOT start with the user's UUID
            const fileName = "invalidprefix_" + Math.floor(Date.now() / 1000).toString() + ".png";

            const req = await supabase.storage.from(bucketName).upload(fileName, dummyFile, {
              cacheControl: "3600",
              upsert: false,
            });

            expect(req.error).not.toBeNull();
          });

          test(`cannot upload a second ${testName} for the same user`, async () => {
            const { user } = await registerAndLoginNewUser();
            const dummyFile1 = new File(["dummy"], "file1.png", { type: "image/png" });
            await expect(updateFn(dummyFile1)).resolves.not.toThrow();

            const dummyFile2 = new File(["dummy"], "file2.png", { type: "image/png" });
            const extension = dummyFile2.type.split("/")[1] || "png";
            const fileName = user.id + "_" + Math.floor(Date.now() / 1000).toString() + "." + extension;
            const req = await supabase.storage.from(bucketName).upload(fileName, dummyFile2, {
              cacheControl: "3600",
              upsert: false,
            });

            expect(req.error).not.toBeNull();
          });

          test(`cannot upload ${testName} when not logged in`, async () => {
            const { user } = await registerAndLoginNewUser();
            await supabase.auth.signOut();

            const extension = "png";
            const fileName = user.id + "_" + Math.floor(Date.now() / 1000).toString() + "." + extension;
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });

            const req = await supabase.storage.from(bucketName).upload(fileName, dummyFile, {
              cacheControl: "3600",
              upsert: false,
            });

            expect(req.error).not.toBeNull();
          });

          test(`cannot remove another user's ${testName}`, async () => {
            let { user: userA } = await registerAndLoginNewUser();
            const dummyFile = new File(["dummy"], "file.png", { type: "image/png" });
            await updateFn(dummyFile);

            await supabase.auth.signOut();
            await registerAndLoginNewUser();
            userA = await queries.profiles.get(userA.id);
            if (!userA[field]) {
              throw new Error();
            }
            const filePath = userA[field];
            await supabase.storage.from(bucketName).remove([filePath]);

            const req = await supabase.storage.from(bucketName).download(filePath);
            expect(req.error).toBeNull();
            expect(req.data).not.toBeNull();
          });
        });
      };

      registerPersonalFilesNegativeTests(
        queries.profiles.updateAvatar,
        "profile-pics",
        "profile picture",
        "profile_pic",
      );

      registerPersonalFilesNegativeTests(queries.profiles.updateBanner, "banners", "banner", "banner");
    });
  });
}
