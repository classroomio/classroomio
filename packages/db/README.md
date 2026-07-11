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

Requires `DATABASE_URL` or `PRIVATE_DATABASE_URL` in the environment. The scripts load `.env` from this package directory, so bootstrap it once from the template:

```bash
cp .env.example .env   # then set DATABASE_URL for your DB
```

#### db:backfill-profile-email-verification

Repairs stale `profile.is_email_verified` rows where the auth user is already verified (`user.email_verified = true`) or has a linked OAuth/SSO account, but the profile flag was never synced. Use after the auth/profile verification mismatch fix, or when users are blocked by the verify-email modal while `send-verification-email` returns `EMAIL_IS_ALREADY_VERIFIED`.

Dry run (lists affected count and a sample; makes no changes):

```bash
pnpm db:backfill-profile-email-verification
# or from repo root:
pnpm --filter @cio/db db:backfill-profile-email-verification
```

Apply updates:

```bash
pnpm db:backfill-profile-email-verification -- --execute
```

The script prints how many profiles were updated and verifies zero mismatches remain.

## Seeding

The seed script populates the database with demo data for local development. It is idempotent — running it multiple times is safe; existing records are skipped.

### Run all seeds

```bash
pnpm seed
# or explicitly
pnpm seed --all
```

### Run individual seeds

Pass one or more flags to run only specific steps:

```bash
pnpm seed --users --profiles
pnpm seed --organizations --organization-members --organization-plan
```

| Flag                     | What it seeds                                          |
| ------------------------ | ------------------------------------------------------ |
| `--roles`                | ADMIN, TUTOR, STUDENT roles                            |
| `--submissions`          | Submission statuses                                    |
| `--question-types`       | Question types                                         |
| `--users`                | Auth users (from `users.json`)                         |
| `--profiles`             | User profiles                                          |
| `--accounts`             | User accounts                                          |
| `--organizations`        | Demo organizations                                     |
| `--organization-members` | Org membership records                                 |
| `--organization-plan`    | Organization plan records (enterprise + early adopter) |
| `--groups`               | Course groups                                          |
| `--group-members`        | Group membership records                               |
| `--courses`              | Demo courses                                           |
| `--sections`             | Course sections                                        |
| `--lessons`              | Lessons                                                |
| `--exercises`            | Exercises                                              |
| `--questions`            | Questions                                              |
| `--templates`            | Exercise templates                                     |

### Demo accounts

| Email                            | Password | Role    | Plan          |
| -------------------------------- | -------- | ------- | ------------- |
| `admin@test.com`                 | `123456` | Admin   | Basic (free)  |
| `student@test.com`               | `123456` | Student | Basic (free)  |
| `enterprise@test.com`            | `123456` | Admin   | Enterprise    |
| `enterprise-student@test.com`    | `123456` | Student | Enterprise    |
| `early-adopter@test.com`         | `123456` | Admin   | Early Adopter |
| `early-adopter-student@test.com` | `123456` | Student | Early Adopter |

Mock user credentials are defined in `users.json`. The demo accounts above use the password `123456`.
