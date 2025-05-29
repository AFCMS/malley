import { describe, expect, test, beforeAll, afterAll } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { Tables } from "./database";
import { queries, supabase } from "./supabase";
import { flushAllTables, registerAndLoginNewUser } from "./supabase.test-utils";

let ifTest;
if (process.env.TEST_SUPABASE || process.env.TEST_ALL) {
  ifTest = test;
  if (!process.env.DESTRUCTIVE_SUPABASE && !process.env.DESTRUCTIVE_ALL) {
    throw new Error("Testing the supabase necessitates wiping it. Set DESTRUCTIVE_SUPABASE environment to allow it.");
  }
} else {
  ifTest = test.skip;
}

let userA: Tables<"profiles">, sessionA: Session, credsA: { handle: string; email: string; password: string };
let userB: Tables<"profiles">, sessionB: Session, credsB: { handle: string; email: string; password: string };
let userC: Tables<"profiles">, sessionC: Session, credsC: { handle: string; email: string; password: string };

beforeAll(async () => {
  // clean the db
  await flushAllTables();

  // get users for the tests
  ({ user: userA, session: sessionA, creds: credsA } = await registerAndLoginNewUser());
  await supabase.auth.signOut();
  ({ user: userB, session: sessionB, creds: credsB } = await registerAndLoginNewUser());
  await supabase.auth.signOut();
  ({ user: userC, session: sessionC, creds: credsC } = await registerAndLoginNewUser());
  await supabase.auth.signOut();
});

afterAll(async () => {
  // clean the db again
  await flushAllTables();
});

// just handy shit
async function switchToUserA() {
  await supabase.auth.setSession(sessionA);
}
async function switchToUserB() {
  await supabase.auth.setSession(sessionB);
}
async function switchToUserC() {
  await supabase.auth.setSession(sessionC);
}
async function switchToAnon() {
  await supabase.auth.signOut();
}

// a few things we get in some tests that we will reuse
let post: Tables<"posts">;
let category: Tables<"categories">;

describe("posts", () => {
  ifTest("logged in creation", async () => {
    await switchToUserA();
    const dummyFile = new File(["filedata"], "myfile.txt", { type: "text/plain" });
    const id = await queries.posts.new("post body", [dummyFile]);
    post = await queries.posts.get(id);
    expect(post.body).toBe("post body");
    expect((await supabase.storage.from("posts-media").list(id)).data?.length !== 1);
  });
});

describe("authors", () => {
  ifTest("get", async () => {
    await switchToAnon();
    let array: Tables<"profiles">[] | Tables<"posts">[];
    array = await queries.authors.ofPost(post.id);
    expect(array.length).toBe(1);
    expect(array[1]).toBe(userA);
    array = await queries.authors.postsOf(userA.id);
    expect(array.length).toBe(1);
    expect(array[1]).toBe(post);
  });
});

describe("pending authors", () => {
  ifTest("invite/cancel invite to user to author", async () => {
    await switchToUserA();
    await queries.pendingAuthors.invite(userB.id, post.id);
    await queries.pendingAuthors.cancel(post.id); // test cancelling
    await queries.pendingAuthors.invite(userB.id, post.id); // resend for next test
  });

  ifTest("get and accept author invites", async () => {
    // we reuse the invite sent earlier
    await switchToUserB();
    const invites = await queries.pendingAuthors.get();
    expect(invites.length).toBe(1);
    expect(invites[1].from).toBe(userA);
    expect(invites[1].post.body).toBe("post body");
    expect(queries.pendingAuthors.accept(post.id));
  });
});

describe("categories", () => {
  ifTest("ensure category exists", async () => {
    await switchToUserA();
    await queries.categories.getEnsuredId("category1");
    category = await queries.categories.get(await queries.categories.getEnsuredId("category1"));
    expect(category.name).toBe("category1");
  });

  ifTest("pattern matching", async () => {
    await switchToAnon();
    expect((await queries.categories.match("cat")).length).toBe(1);
    expect((await queries.categories.match("y1")).length).toBe(1);
    expect((await queries.categories.match("g")).length).toBe(1);
  });
});

describe("posts categories", () => {
  ifTest("add existing category to post", async () => {
    await switchToUserA();
    await queries.postsCategories.add(post.id, "category1");
    const categories = await queries.postsCategories.get(post.id);
    expect(categories.length).toBe(1);
    expect(categories[1].name === "category1").toBe(true);
  });

  ifTest("add new category to post", async () => {
    await switchToUserA();
    await queries.postsCategories.add(post.id, "category2");
    const categories = await queries.postsCategories.get(post.id);
    expect(categories.length).toBe(2);
    expect(categories[1].name === "category1" || categories[2].name === "category2").toBe(true);
  });

  ifTest("remove post category", async () => {
    await switchToUserA();
    await queries.postsCategories.remove(post.id, "category1");
    const categories = await queries.postsCategories.get(post.id);
    expect(categories.length).toBe(1);
    expect(categories[1].name === "category2").toBe(true);
  });
});

describe("profile categories", () => {
  ifTest("add for self", async () => {
    await switchToUserA();
    await queries.profilesCategories.add("category1");
    await queries.profilesCategories.add("category2");
    expect((await queries.profilesCategories.get(userA.id)).length).toBe(2);
  });

  ifTest("remove for self", async () => {
    await switchToUserA();
    await queries.profilesCategories.remove("category1");
    const categories = await queries.profilesCategories.get(userA.id);
    expect(categories.length).toBe(1);
    expect(categories[1].name).toBe("category2");
  });
});

describe("follows", () => {
  ifTest("add for self", async () => {
    await switchToUserA();
    await queries.follows.add(userB.id);
    await queries.follows.add(userC.id);
    expect((await queries.follows.get()).length).toBe(2);
  });

  ifTest("remove for self", async () => {
    await switchToUserA();
    await queries.follows.remove(userC.id);
    const follows = await queries.follows.get();
    expect(follows.length).toBe(1);
    expect(follows[1]).toBe(userB);
  });
});

describe("features", () => {
  ifTest("add", async () => {
    await switchToUserA();
    await queries.featuredUsers.add(userB.id);
    expect(await queries.featuredUsers.doesXfeatureY(userA.id, userB.id)).toBe(true);
  });

  ifTest("queries", async () => {
    await switchToUserA();
    await queries.featuredUsers.add(userC.id);
    await switchToUserC();
    await queries.featuredUsers.add(userA.id);
    await switchToAnon();
    expect((await queries.featuredUsers.byUser(userA.id)).length).toBe(2);
    expect((await queries.featuredUsers.byUser(userB.id)).length).toBe(0);
    expect((await queries.featuredUsers.byUser(userC.id)).length).toBe(1);
    expect((await queries.featuredUsers.byWho(userA.id)).length).toBe(1);
    expect((await queries.featuredUsers.byWho(userB.id)).length).toBe(0);
    expect(await queries.featuredUsers.doesXfeatureY(userA.id, userC.id)).toBe(true);
    expect(await queries.featuredUsers.doesXfeatureY(userB.id, userC.id)).toBe(false);
    expect(await queries.featuredUsers.doesXfeatureY(userC.id, userA.id)).toBe(true);
  });

  ifTest("remove", async () => {
    await switchToUserA();
    await queries.featuredUsers.remove(userC.id);
    const featured = await queries.featuredUsers.byUser(userA.id);
    expect(featured.length).toBe(1);
    expect(featured[1]).toBe(userB);
  });
});
