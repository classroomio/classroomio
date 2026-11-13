---
title: 'How to Upload Videos to ClassroomIO'
description: 'A technical guide for developers who want to add training videos to their product without building video hosting, streaming and progress tracking themselves.'
imageUrl: '/blog/how-to-upload-videos-to-classroomio.png'
date: '2026-11-13'
author: Hamzat Abdul-muizz
avatar: /blog/hamza.jpg
role: QA/Developer Relations Engineer
tags: ['API', 'Developers']
published: true
---

![how-to-upload-videos-to-classroomio](/blog/how-to-upload-videos-to-classroomio.png)
_How to Upload Videos to ClassroomIO_

For those who don't know, ClassroomIO is an open-source platform that companies use to run training across their organization, from customer training to employee onboarding and more.

This is a technical article for developers who want to learn about file uploads, and for developers who want to add training videos to their product without building video hosting, streaming and progress tracking themselves.

## What happens after you upload a video

Uploading the file is only the first step. Once the video is attached to a lesson, ClassroomIO takes care of the rest:

- **It becomes part of a course.** The video sits inside a lesson, so your learners watch it in the same place they read notes, take exercises and earn certificates.
- **It streams smoothly.** ClassroomIO converts the video to adaptive streaming (HLS), so it plays well on slow and fast connections alike.
- **It can be transcribed.** When transcription is enabled, ClassroomIO creates a transcript, and the course AI assistant can use it to answer learners' questions about what the video says.
- **Learners pick up where they left off.** Playback resumes from where each learner stopped watching.
- **You stay in control.** You can read the lesson back through the API at any time. Uploaded videos come back as short-lived signed links, so the files are never publicly exposed.

## Ways to upload a video

ClassroomIO gives you three ways to upload a video:

1. **The dashboard:** an interface where you upload by hand.
2. **The MCP server:** connect your favorite AI agent (Claude, ChatGPT and others) and ask it to do the work.
3. **The public API:** upload from your own code. That's our focus today.

![classroomio-media-upload-dialog](/blog/how-to-upload-videos-dashboard.png)
_Uploading a video from the dashboard_

## Before you start

1. Sign up at [app.classroomio.com](https://app.classroomio.com) and complete the onboarding.
2. Go to **Automation**, open the **API** tab, and click **Generate API key**. Give the key a name, then create it.
3. Copy the key straight away and save it as an environment variable. You'll need it for every request in this article.

![classroomio-api-keys](/blog/how-to-upload-videos-api-keys.png)
_The API keys page under Automation → API_

```bash
CLASSROOMIO_API_KEY=cio_api_your_key_here
```

You'll also need the ID of the course the video belongs to. You can list your courses with `GET /courses`:

```bash
curl https://api.classroomio.com/public-api/v1/courses \
  -H "Authorization: Bearer $CLASSROOMIO_API_KEY"
```

## Uploading takes three API calls

1. **Reserve the upload.** Tell ClassroomIO you're about to upload a video.
2. **Upload the file.** Send the file straight to storage.
3. **Attach it to a lesson.** Make the video part of a course.

### Step 1: Reserve the upload

Reserving the upload tells ClassroomIO what you're about to send: the file name, type and size. ClassroomIO checks the size is within your limit and creates a placeholder for the video. It then gives you two things back:

- an `assetId`, the video's ID, which you'll use in step 3;
- an `uploadUrl`, a short-lived link you'll send the file to in step 2.

```bash
curl -X POST https://api.classroomio.com/public-api/v1/assets \
  -H "Authorization: Bearer $CLASSROOMIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "video",
    "fileName": "intro.mp4",
    "mimeType": "video/mp4",
    "byteSize": 52428800
  }'
```

- `kind` is always `video` for now.
- `mimeType` can be `video/mp4`, `video/quicktime`, `video/x-msvideo` or `video/x-matroska`.
- `byteSize` is the exact size of your file in bytes. Files over the limit (1 GB by default) are rejected with a `413` error.

The response looks like this:

```json
{
  "success": true,
  "data": {
    "assetId": "3f6c2a9e-...",
    "uploadUrl": "https://...",
    "expiresAt": "2026-11-11T10:15:00.000Z"
  }
}
```

### Step 2: Upload the file

Send the file to `uploadUrl` in a single `PUT` request:

```bash
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --data-binary @intro.mp4
```

Three things to get right:

- **Don't send your API key here.** The link is already signed, so leave out the `Authorization` header.
- **Match the details from step 1.** The `Content-Type` must be the same as `mimeType`, and the file must be exactly `byteSize` bytes.
- **Upload before `expiresAt`.** The link stops working after that.

### Step 3: Attach it to a lesson

Your video is now stored, but nobody can see it until it's attached to a lesson. You can create a new lesson with the video in it:

```bash
curl -X POST https://api.classroomio.com/public-api/v1/courses/$COURSE_ID/lessons \
  -H "Authorization: Bearer $CLASSROOMIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction",
    "order": 1,
    "videos": [{ "type": "upload", "assetId": "3f6c2a9e-..." }]
  }'
```

Or add it to an existing lesson:

```bash
curl -X PUT https://api.classroomio.com/public-api/v1/courses/$COURSE_ID/lessons/$LESSON_ID \
  -H "Authorization: Bearer $CLASSROOMIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "videos": [{ "type": "upload", "assetId": "3f6c2a9e-..." }] }'
```

Note that `PUT` replaces all the videos in the lesson, so include any videos you want to keep.

When you attach the video, ClassroomIO checks that the file actually arrived. If it hasn't, you get a `409` error, and you can retry once the upload has finished. If it has, ClassroomIO starts preparing the video for streaming in the background.

You can also mix uploaded videos with YouTube, Vimeo or other links in the same lesson:

```json
{ "type": "youtube", "link": "https://www.youtube.com/watch?v=..." }
```

If you're interested in learning more about how ClassroomIO helps you run training for your company or organization, check out [classroomio.com/help](https://classroomio.com/help).

If you found this helpful, don't forget to drop a like or a comment. See you in the next one!
