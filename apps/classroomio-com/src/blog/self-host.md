---
title: 'Self-host ClassroomIO on your Servers'
description: 'On Day 3 of our launch week, we are excited to announce that you can now easily self-host ClassroomIO on your servers using our pre-built Railway template.'
imageUrl: 'https://assets.cdn.clsrio.com/blog/self-host.png'
date: '2024-10-09'
author: Rotimi Best
avatar: /blog/best.jpg
role: Founder
tags: ['Launch Week', 'Self-host', 'Company Update']
published: true
---

![self-host-classroomio](https://assets.cdn.clsrio.com/blog/self-host.png)
_Selfhost ClassroomIO on your Servers_

Today we are happy to share that you can now easily self-host classroomio and use it for whatever purpose you want without paying us a dime. Our mission is to build the simplest yet customisable open source learning management system on the planet, and this is taking us 1 step closer to that goal.

If you are interested in just trying out the product, it is advisable to use the [cloud version](https://app.classroomio.com). You can use almost all the features for free on the cloud version unless you need more students. Right now the main reason you'd have to upgrade is because your students are growing. If you don't want to upgrade and/or face this, then you'd be fine self hosting the whole application.

For self-hosting, we have written up a [guide that uses Railway](https://classroomio.com/docs/quickstart/self-hosting)  to help deploy our stack and you get to manage the servers on Railway as you wish. We hope this is a good step in helping you educate your audience at ease.

Below is a demo showing you step by step how to self host the project

<iframe class="embed my-5" src="https://www.youtube.com/embed/3TMWPgoSPZ0?si=cbpN6ZC0-sevAL-i" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### Next steps

We want to support self-hosting using a Coolify template or just using a Dockerfile. We currently have Dockerfiles for both our backend and dashboard projects however contributions from the open source community would help us in properly testing and improving them.

If you prefer deployment with Docker, do checkout our [docker-compose.yaml](https://github.com/classroomio/classroomio/blob/main/docker-compose.yaml) file to get started and we can kick off a conversation on Github.
