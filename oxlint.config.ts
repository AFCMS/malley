import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["oxc", "typescript", "react-perf", "import", "jsdoc", "promise"],
  categories: {
    correctness: "error",
  },
  options: {
    typeAware: true,
  },
  ignorePatterns: ["dist", "src/contexts/supabase/database.d.ts", "supabase/functions"],
});
