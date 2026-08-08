import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 120,
  insertFinalNewline: true,
  sortPackageJson: true,
  sortTailwindcss: {},
  ignorePatterns: ["/src/contexts/supabase/database.d.ts", "/supabase/functions"],
});
