# @cio/db

This package handles everything related to the database, schema, migrations and connection.

## Stack

1. Postgres - We use postgres for the database
2. Drizzle ORM - For managing and querying the database
3. Better Auth - For managing the auth tables (users, account, session).

## Workflow

We used Supabase in the past for managing the supabase but have now moved on to use postgres directly and auth managed by our backend. This means the workflow is a mix of the Database First approach (Option 1) and the Codebase First approach (Option 2). Learn more about each approach [from the drizzle migration docs](https://orm.drizzle.team/docs/migrations).

Here is how I do it:

### 1. Local DB to Drizzle Schema TS file

I have a postgres tool where I can make changes to the db as I want. I am not so familiar with drizzle that much so I am sticking with this for now.

    ```bash
    pnpm db pull # this does sql -> drizzle ts code
    ```

### 2. Drizzle Schema file to Prod SQL

Now when I am ready to deploy the feature, I can use [option 2](https://orm.drizzle.team/docs/migrations) which is makes the typescript schema the source of truth. This command will only run on CI on every merge on a condition that there was a change to the schema file `packages/db/src/schema.ts`

    ```bash
    pnpm db push # this does drizzle ts code to prod db
    ```

## OR

I can make changes directly to the schema file and run `pnpm db push` to push the changes to the source db.

## Setting up a new DB on Railway

Once you setup a Postgres DB on Railway, you should copyt the `DATABASE_PUBLIC_URL` and paste into your `.env`. In the `.env` we expect `DATABASE_URL`:

    ```.env
    DATABASE_URL=what-you-copied-from-railway
    ```

### Commands

#### db:setup

Prepares the database so the application can run. Run this for new databases or after provisioning Postgres.

```
pnpm db:setup
```

It performs three steps in order:

1. **Schema sync** – Runs `drizzle-kit push` to apply the TypeScript schema to the database (creates/updates tables, enums, etc.).
2. **PostgreSQL roles** – Creates the `authenticated` and `anon` roles if missing (used by RLS policies).
3. **Essential seed data** – Inserts required reference data: roles (ADMIN, TUTOR, STUDENT), submission statuses, and question types.

**Optional:** Add `--seed` (or `-s`) to run the full seed, including demo users, organizations, courses, and other example data.

Requires `DATABASE_URL` or `PRIVATE_DATABASE_URL` in the environment.
