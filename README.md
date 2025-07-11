# Malley

Malley is a X-like social media platform.

## Tech Stack

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![daisyUI](https://img.shields.io/badge/daisyui-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

## Documentation

### Prerequisites

- [NodeJS](https://nodejs.org)
- [PNPM](https://pnpm.io)
- [Deno](https://deno.com)
- [Docker](https://www.docker.com) or [Podman](https://podman.io)

> [!NOTE]
> For **Docker Desktop** users, you need to enable `Expose deamon on tcp://localhost:2375 without TLS` in the Docker settings.
>
> More informations [here](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows#running-supabase-locally).

### Run project

You can use the **Supabase CLI** (recommended) or you own cloud instance of Supabase for development.

```sh
pnpm install

pnpm run supabase start
```

Populate the `.env.local` file with data from the `supabase start` output.

```properties
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_ANON_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
VITE_GOOGLE_SITE_VERIFICATION=""
```

```sh
pnpm run dev

# Afterwards you may want to stop the supabase containers
pnpm run supabase stop
```

Finally, start the edge functions

```sh
pnpm run supabase functions serve
```

<!--[![Made with Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)-->
<!--[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/project?template=https://github.com/AFCMS/malley)-->

### Create Migrations

Database documentation is [here](/supabase/README.md).

Modify the database from Supabase Studio and export the DB diff to a file, then refine it (formating, comments, etc):

```sh
pnpm run --silent supabase db diff --schema public > my_file.sql
```

Create a new migration file in `supabase/migrations` and fill the given file with the content of the diff file:

```sh
pnpm run supabase migration new migration_name
```

Update the TypeScript definitions:

```sh
pnpm run --silent supabase gen types typescript --local > src/contexts/supabase/database.d.ts
```

Reset DB (or apply the migration if possible):

```sh
pnpm run supabase db reset
# or if your local edits can be reapplied without errors
pnpm run supabase migration up
```

### Run tests

Vitest is used for tests. Use environment variables to determine test targets. Available targets are :

```sh
TEST_ALL=1 // run every test
TEST_SUPABASE=1 // run supabase tests // DESTRUCTIVE
```

Note that some tests, like those of supabase, are destructive. To run these, confirm it is what you want to do by additionally setting `DESTRUCTIVE_TARGET` :

```sh
DESTRUCTIVE_ALL=1
DESTRUCTIVE_SUPABASE=1
```

### Update Logo

The logo source file is an Inkscape SVG, which needs to be exported to a standard SVG file after modification.

```sh
inkscape --export-type=svg --export-plain-svg --export-overwrite --export-filename=./public/favicon.svg ./src/logo.svg
# or
flatpak run org.inkscape.Inkscape --export-type=svg --export-plain-svg --export-overwrite --export-filename=./public/favicon.svg ./src/logo.svg

# then update derivated icons
pnpm run generate-pwa-assets
```

---

<img align="right" src=".github/Hexa_Logo_Sign_RVB_Full.svg" width="300px"/>

**Made with ❤️ by:**

- [AFCMS](https://github.com/AFCMS)
- [Roceann](https://github.com/Roceann)
- [AKArien0](https://github.com/AKArien0)

[**Ecole Hexagone**](https://www.ecole-hexagone.com) 🇫🇷 - Class of 2024/2025
