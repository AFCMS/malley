import { beforeAll, describe, test } from "vitest";

if (process.env.TEST_SUPABASE || process.env.TEST_ALL) {
  if (!process.env.DESTRUCTIVE_SUPABASE && !process.env.DESTRUCTIVE_ALL) {
    throw new Error("Testing the supabase necessitates wiping it. Set DESTRUCTIVE_SUPABASE environment to allow it.");
  }

  const [{ flushAllTables }, { minimal_function }, { rls_blocks }] = await Promise.all([
    import("./tests/supabase.test-utils"),
    import("./tests/minimal-function"),
    import("./tests/rls-blocks"),
  ]);

  describe("supabase", () => {
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

    minimal_function();
    rls_blocks();
  });
} else {
  test.skip("Supabase integration requires TEST_SUPABASE", () => undefined);
}
