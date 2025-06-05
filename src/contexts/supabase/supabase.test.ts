/* eslint-disable @typescript-eslint/no-unused-expressions */
import { test, beforeAll, afterAll } from "vitest";
import { flushAllTables } from "./tests/supabase.test-utils";
import { minimal_function } from "./tests/minimal-function";
import { rls_blocks } from "./tests/rls-blocks";

let run_tests: boolean;
if (process.env.TEST_SUPABASE || process.env.TEST_ALL) {
  run_tests = true;
  if (!process.env.DESTRUCTIVE_SUPABASE && !process.env.DESTRUCTIVE_ALL) {
    throw new Error("Testing the supabase necessitates wiping it. Set DESTRUCTIVE_SUPABASE environment to allow it.");
  }
} else {
  run_tests = false;
}

beforeAll(async () => {
  // clean the db
  const code = await flushAllTables();
  if (code === 0) {
    return;
  }
  let faultyRole = "";
  if (code === 1) {
    faultyRole = "*ALL*";
  } else if (code === 2) {
    faultyRole = "ANON";
  }
  process.exit(`
  ███████████████████ EXTREME DANGER ███████████████████
  
  The TRUNCATE-all function is accessible to ${faultyRole} USERS.
  
  You should not need an explanation of the surity risk.
  
  If you do not understand, involve a responsible adult.
  
  ██████████████████████ ABORTING ██████████████████████
  `);
});

afterAll(async () => {
  // clean the db again
  await flushAllTables();
});

test.runIf(run_tests)("supabase", () => {
  minimal_function;
  rls_blocks;
});
