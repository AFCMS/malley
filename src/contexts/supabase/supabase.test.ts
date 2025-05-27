import { expect, test } from "vitest";
import { queries } from "./supabase";

const ifTest = !process.env.TEST_SUPABASE && !process.env.TEST_ALL ? test.skip : test;

if (ifTest == test && !process.env.DESTRUCTIVE_SUPABASE && !process.env.DESTRUCTIVE_ALL) {
  throw new Error("Testing the supabase necessitates wiping it. Set DESTRUCTIVE_SUPABASE environment to allow it, o");
}

ifTest("", () => {
  expect(queries.profiles.isNameAvailable(""));
});
