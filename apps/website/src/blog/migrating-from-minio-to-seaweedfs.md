---
title: 'Migrating from MinIO to SeaweedFS'
description: 'By the end of this article, you should be able to migrate from MinIO to SeaweedFS without losing your files, or set up a new instance with SeaweedFS as the default file storage.'
imageUrl: '/blog/migrating-from-minio-to-seaweedfs.png'
date: '2026-10-08'
author: Hamzat Abdul-muizz
avatar: /blog/hamza.jpg
role: QA/Developer Relations Engineer
tags: ['Self-host', 'Company Update']
published: true
---

![migrating-from-minio-to-seaweedfs](/blog/migrating-from-minio-to-seaweedfs.png)
_Migrating from MinIO to SeaweedFS_

As of September 2026, anyone who pulls MinIO from Docker Hub receives a 404 error. That means the images have been deleted from Docker Hub, or removed from public access.

This article is for people who self-host ClassroomIO. It covers two groups:

1. Existing users who use MinIO as their object storage service, which stores all the media for their self-hosted instance.
2. New users who are self-hosting ClassroomIO for the first time.

By the end of this article, you should be able to migrate from MinIO to SeaweedFS without losing your files, or set up a new instance with SeaweedFS as the default file storage.

## What happened to MinIO

MinIO is a self-hosted object storage tool that stores media assets. Because it is open source, a lot of companies use it. In ClassroomIO, for instance, MinIO was the default file storage in our official documentation.

Over the last year, MinIO stopped maintaining its free version, and in September 2026 it removed its images from Docker Hub. For ClassroomIO this meant two things. New installs failed because the MinIO image could not be downloaded. Existing installs could no longer upgrade.

## Why we moved to SeaweedFS

Because of this development, we have decided to move to SeaweedFS. We picked it for three reasons:

1. It is actively maintained and has been around since 2012.
2. It is open source under the Apache 2.0 license.
3. It speaks the same S3 API as MinIO, so ClassroomIO works with it the same way.

To keep things smooth for new and existing users, we updated all the necessary scripts and added a guide for migrating to SeaweedFS without losing your data.

## The classroomio.sh script

ClassroomIO has a `classroomio.sh` script. You can get it like this:

```bash
mkdir classroomio && cd classroomio
curl -fsSLO https://classroomio.com/classroomio.sh
chmod +x classroomio.sh
```

This script contains everything you need to set up ClassroomIO. It generates secret variables for you, starts all the services, and a lot more.

If you already have a `classroomio` folder, run the last two commands inside it so you get the latest version of the script.

## For existing users: migrate from MinIO

If you are an existing user deploying on a VPS, you might be familiar with the script already.

### Before you start

There are three things to know:

1. You need free disk space. Every file is copied, so you need at least as much free space as your current uploads take. We recommend keeping at least 20 GB free.
2. Your app will be paused for a few minutes while the files are copied.
3. Your old MinIO files are not deleted. They stay where they are until you remove them yourself.

### Run the upgrade

To change your file storage to SeaweedFS, all you need to run is this command:

```bash
./classroomio.sh upgrade
```

When you run `upgrade` on an install that still uses MinIO, the script moves you to SeaweedFS. Here is what it does, in order:

1. It replaces your old `docker-compose.images.yaml` with the new one. Your old file is kept as `docker-compose.images.yaml.bak`.
2. It backs up your data before getting started: the Postgres database and the storage volume. You will find them in the `backups` folder.
3. It asks which version of ClassroomIO you want to use. You can enter a specific version, or press Enter to keep your current one. It then pulls the images for that version, so it might take a while. That's completely normal.
4. It pauses the app so nobody uploads a file in the middle of the move.
5. It starts SeaweedFS and creates three buckets: `videos`, `documents` and `media`.
6. It copies all your files from MinIO to SeaweedFS, then compares every file with the original.
7. It switches the app to SeaweedFS and starts everything again.

The switch in step 7 only happens if every file in step 6 matches. If anything is missing or different, the script stops and your install stays on MinIO.

One more thing about step 3. The version you choose must be one that supports SeaweedFS. If you pick an older version, the script tells you and stops without changing anything.

### Check that it worked

After this is done, check the file storage endpoint your server (the API) connects to:

```bash
grep OBJECT_STORAGE_ENDPOINT .env
```

You should see `OBJECT_STORAGE_ENDPOINT=http://storage:9000`. Before the upgrade it was `http://minio:9000`.

Next, look at the running services:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

You should see a `cio-storage` service running SeaweedFS. The `cio-minio` service is gone.

Also, when you run `docker volume ls` you will notice that the file storage is now different from what it used to be:

```bash
docker volume ls | grep -E 'minio-data|storage-data'
```

You should see two volumes. `classroomio_storage-data` is the new one that the app now uses. `classroomio_minio-data` is your old one, untouched.

Now that everything is running fine, the next thing to do is test it on the dashboard. Open a course, play a video, open a document, and upload a new file. Everything you uploaded before the upgrade should still be there.

### What about my old MinIO files

They are still on your server in the `classroomio_minio-data` volume. What you do with it is up to you. You can keep it as a safety copy for as long as you like. Once you are sure everything works, you can free the space with:

```bash
docker volume rm classroomio_minio-data
```

### Can I run the upgrade again

Yes. If the migration is already done, the script notices and copies nothing. If it was interrupted halfway, running it again continues from where it stopped.

## For new users: set up a new instance

If you are self-hosting ClassroomIO for the first time, yours is straightforward. There is nothing to migrate. SeaweedFS is set up for you as part of the install.

After getting the script, run:

```bash
./classroomio.sh install
```

Here is what it does:

1. It downloads the files it needs.
2. It creates your `.env` file and generates the secret variables.
3. It generates a random key pair for the file storage, so you never have to type one.
4. It starts all the services and creates the `videos`, `documents` and `media` buckets.

When it is done, check that everything is running:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

You should see the dashboard, the API, the jobs worker, Postgres, Redis and the storage service.

The dashboard is now available at `http://localhost:3082`. If you are deploying on a server with your own domain, open the `.env` file, set `DASHBOARD_ORIGIN` to your domain, then run:

```bash
./classroomio.sh restart
```

From here you can sign up, create a course and upload your first video.

If you are stuck, open an issue on GitHub and include the output of `./classroomio.sh logs`.
