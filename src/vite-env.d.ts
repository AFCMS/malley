/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * The URL of the Supabase API.
   *
   * Typically, this is `https://<your-project-id>.supabase.co` or `http://127.0.0.1:54321` for local development.
   *
   * @see https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
   */
  readonly VITE_SUPABASE_URL: string;
  /**
   * The anonymous key of the Supabase API.
   *
   * This key is used to authenticate with the Supabase API.
   *
   * @see https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
   */
  readonly VITE_SUPABASE_ANON_KEY: string;

  /**
   * The Google site verification key.
   *
   * This is used to claim the website property on the Google Search Console (via meta tags).
   *
   * @see https://search.google.com/search-console
   */
  readonly VITE_GOOGLE_SITE_VERIFICATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
