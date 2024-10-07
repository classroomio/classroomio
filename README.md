<a href="https://classroomio.com/">
  <img alt="ClassroomIO is a no-code tool that allows you build and scale your online bootcamp with ease." src="https://raw.githubusercontent.com/rotimi-best/classroomio/main/apps/classroomio-com/static/classroomio-opengraph-image.png" />
  <h1 align="center">ClassroomIO.com</h1>
  <p align="center">
    The Open Source Learning Management System for Companies
    <br />
    <a href="https://classroomio.com">Website</a>  |  <a href="https://dub.sh/ciodiscord">Join Discord community</a>
  </p>
</a>

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/629e2bb8994345729513c4d69ccbe3d5)](https://app.codacy.com/gh/rotimi-best/classroomio?utm_source=github.com&utm_medium=referral&utm_content=rotimi-best/classroomio&utm_campaign=Badge_Grade)

## ✨ About ClassroomIO.com

<img alt="ClassroomIO Courses page" src="https://raw.githubusercontent.com/rotimi-best/classroomio/main/apps/classroomio-com/static/classroomio-courses.png" />

Streamline training for everyone with ClassroomIO.com. Our all-in-one platform empowers bootcamps, educators, and businesses to manage training programs easily. With our platform, anyone can run multiple classes and cohorts all from one UI. The application is mobile-first, which means that students can access your lesson materials from any device.

### Mission: Provide Students with the Best Learning Experience

At ClassroomIO, our mission is to provide students with the best possible learning experience. We believe in empowering educators with the tools they need to deliver high-quality education that is accessible, engaging, and effective.

### Key Features

1. **📚 Advanced Course Management:** You can create unlimited courses, create lessons, invite students, add assignments, grade their assignments, and even generate certificates.
2. **👨‍👩‍👦 Multi-Teacher Management:** You can invite other teachers into your organization and assign them individual courses.
3. **🤖 AI Integration:** We've got OpenAI integration for quick course creation where you can generate course content, lesson outlines, and even generate assignments right from your lesson notes.
4. **💬 Forum:** Students can ask questions in your dedicated community and get answers from either you or other students.
5. **💻 Dedicated Student Dashboard:** Once you create an account, you get a dedicated dashboard where your students can access all their courses, assignments, and more.
6. **🔒 Fully open source:** You can self-host the entire stack on your servers.

### Roadmap Features

1. **Forms:** Instead of using Google Forms to collect vital information from your students, you will be able to create forms directly within the dashboard.
2. **Course Templates:** You can clone a full course or share templates with other people.
3. **Analytics:** You can track data about your students across multiple courses.
4. **Run Courses on Messengers:** Students can just join a channel on slack/discord/telegram and a bot automatically sends daily lesson content to your students without you doing anything.

Please reach out to me on [twitter](https://x.com/rotimi_best) if you have any feature request.

## Built With

- [SvelteKit](https://kit.svelte.dev/?ref=classroomio.com)
- [Supabase](https://supabase.com/?ref=classroomio.com)
- [TailwindCSS](https://tailwindcss.com/?ref=classroomio.com)

## Get a Demo

You can book a quick 15 min demo to see if ClassroomIO is a good fit for you

<a href="https://cal.com/classroomio/demo">
  <img src="https://cal.com/book-with-cal-dark.svg" alt="Book a Call with ClassroomIO.com">
</a>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running, please follow these simple steps.

### Prerequisites

Here is what you need to be able to run ClassroomIO.com

- [Node.js](https://nodejs.org/) (Version: >=18.x)
- [Supabase CLI](https://github.com/supabase/cli)
- [Docker](https://docs.docker.com/engine/install/)
- [NPM](https://www.npmjs.com/)

### Project Structure

This repo is a mono repo that consists of 3 projects:

1. `classroomio-com`: The landing page of ClassroomIO hosted [here](https://classroomio.com)
2. `backend`: The backend service that handles PDF, video processing, Emailing and Notifications.
3. `dashboard`: The web application that runs the learning management system hosted [here](https://app.classroomio.com).
4. `docs`: Official documentation of ClassroomIO hosted [here](https://classroomio.com/docs)

## Development

### Gitpod Setup

1. Click the button below to open this project in Gitpod.

2. This will open a fully configured workspace in your browser with all the necessary dependencies already installed.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/rotimi-best/classroomio)

### Local Setup

1. Fork the repo, then clone it using the following command (remember to replace the url with the url from your forked repo)

   ```bash
   git clone https://github.com/rotimi-best/classroomio.git
   ```

2. Go to project folder

   ```bash
   cd classroomio
   ```

3. Set up Node if your Node version does not meet the project's requirements, as instructed by the documentation., "nvm" (Node Version Manager) allows using Node at the version required by the project:

   ```bash
   nvm use
   ```

   You first might need to install the specific version and then use it:

   ```bash
   nvm install && nvm use
   ```

   You can install nvm from [here](https://github.com/nvm-sh/nvm).

   You also need to have pnpm installed, you can find the installation guide [here](https://pnpm.io/installation#using-npm)

4. Set up your `.env` file

   - Go to `apps/classroomio-com`, `apps/dashboard` and `apps/backend`.
   - Duplicate the `.env.example` file and rename it to `.env`
   - Populate your .env files with the neccessary variables

To get the environmental variables for supabase continue to step(5)

5. Install all dependencies

   ```bash
   pnpm i
   ```

6. Setup Supabase.

   - Install and Start [docker](https://docs.docker.com/engine/install/)
   - Go to the project directory in your terminal and start Supabase

     ```bash
       pnpm supabase start
     ```

   - You should get a result like this

     ```bash
       supabase local development setup is running.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
           DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
       Studio URL: http://127.0.0.1:54323
     Inbucket URL: http://127.0.0.1:54324
       JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
         anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
     service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
     ```

   - Add Supabase environment variables into `app/dashboard` folder, which should be taken from the result of `pnpm supabase start`

     ```env
       PUBLIC_SUPABASE_URL=<API URL>
       PUBLIC_SUPABASE_ANON_KEY=<anon key>
       PRIVATE_SUPABASE_SERVICE_ROLE=<service_role key>
     ```

   - To view the Supabase studio, open the Studio URL from the result of `pnpm supabase start`

7. Run all projects (in development mode)

   ```bash
   pnpm dev
   ```

8. All projects should start running

   - `classroomio-com`: [http://localhost:5174](http://localhost:5174)
   - `backend`: [http://localhost:3002](http://localhost:3002)
   - `dashboard`: [http://localhost:5173](http://localhost:5173)
   - `docs`: [http://localhost:3000](http://localhost:3000)

9. Running a specific project

   - **classroomio-com**: `pnpm dev --filter=classroomio-com`
   - **backend**: `pnpm dev --filter=backend`
   - **dashboard**: `pnpm dev --filter=dashboard`
   - **docs**: `pnpm dev --filter=docs`

10. Login into `dashboard`

    - Visit [http://localhost:5174/login](http://localhost:5173/login)
    - Enter email: `admin@test.com`
    - Enter password: `123456`
     
    To learn more about how to login with a dummy account, [go here.](https://classroomio.com/docs/contributor-guides/demo-accounts)
