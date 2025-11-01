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
    pnpm dlx drizzle-kit pull
    ```

### 2. Drizzle Schema file to Prod SQL

Now when I am ready to deploy the feature, I can use [option 2](https://orm.drizzle.team/docs/migrations) which is makes the typescript schema the source of truth. This command will only run on CI on every merge on a condition that there was a change to the schema file `packages/db/src/schema.ts`

    ```bash
    pnpm dlx drizzle-kit push
    ```
