## ✨ About LinkAPI

This is a simple link shortener api service that allows users to shorten a long url as specified in [Issue(159)](https://github.com/rotimi-best/classroomio/issues/159).

This service runs as a cloudflare worker and written in [HonoJs](https://hono.dev/).

### 🗝 Key Features

- Url shortening
- Rate Limiting
- Logging (✅)
- Validations (⌛)

### API Flow ♒

The API exposes two endpoints; One for shortening the url and the other for getting the original url.

1. Shortening the url

   #### **`POST /short`**

   - **Description:** Shortens a specified url

   - **Body:**

     - This endpoint accepts a payload body:

```json
{
  "url": "your_url.com"
}
```

- **Example Response:**

If all goes well, this return a _200_ response code is returned with the following json:

```json
{
  "short_url": "https://clsrio.com/Ka3Y72"
}
```

If the url has already been shortened, the endpoint returns a _409_ response with below json:

```json
{
  "message": "Link already exists",
  "short_link": "https://clsrio.com/Ka3Y72"
}
```

The endpoint can also return a _500_ response if one of the following occurs:

- If the generated uid has a duplicate
- If there's a supabase error
- If there's an unexpected server error

2. Get and redirect to a shortened url

   #### **`GET /{uid}`**

   - **Description:** Get the specified url and redirect to it

   - **Parameters:**

     - `uid` (string, required): This is the id generated.

- **Example Response:**

If all goes well, this redirect to the original url with a 302 response code.

If the uid is not in the db, the endpoint returns a _404_ response with the following json:

```json
{
  "message": "Url not found"
}
```

The endpoint can also return a _500_ response if one of the following occurs:

- If there's a supabase error
- If there's an unexpected server error

### Getting started

If you already have the ClassroomIO [repo](https://github.com/rotimi-best/classroomio), just pull in the latest changes and push migrations to your supabase cloud using the following command:

```bash
pnpm supabase db push --db-url "URL HERE"
```

If you are just getting started with the whole project, refer to this [docs](https://www.classroomio.com/docs/contributor-guides/supabase-cloud) and the github [README](https://github.com/rotimi-best/classroomio/blob/main/README.md)

After setting up the project with all migrations, create a new file called wrangler.toml at the rool of the link-api project with the following configs:

```toml
name = "link-api"
compatibility_date = "2023-12-01"
node_compat = true

[vars]
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
host="THE HOST usually http://127.0.0.1:8787"
redis_url="YOUR_REDIS_URL"
token="YOUR_REDIS_TOKEN"
telemetry="1"

# [[kv_namespaces]]
# binding = "MY_KV_NAMESPACE"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# [[r2_buckets]]
# binding = "MY_BUCKET"
# bucket_name = "my-bucket"

# [[d1_databases]]
# binding = "DB"
# database_name = "my-database"
# database_id = ""

```

You can get the redis url and token from [upstash](https://upstash.com/docs/introduction)

Then do the following command:

```bash
pnpm i # to install all dependencies
```

Then start your local service by running:

```bash
pnpm dev
```
