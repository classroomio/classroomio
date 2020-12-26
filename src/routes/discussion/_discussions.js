// Ordinarily, you'd generate this data from markdown files in your
// repo, or fetch them from a database of some kind. But in order to
// avoid unnecessary dependencies in the starter template, and in the
// service of obviousness, we're just going to leave it here.

// This file is called `_discussions.js` rather than `posts.js`, because
// we don't want to create an `/blog/posts` route — the leading
// underscore tells Sapper not to do that.

export default [
  {
    title: "What is Sapper?",
    id: 1,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    question: "Hello, I was thinking… Is there a way to get static props for non-page components without passing props from page component? Eg. navigation which is shared across many pages.",
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "loris",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "How to use Sapper",
    id: 2,

    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
      question:
        "Hello, I was thinking… Is there a way to get static props for non-page components without passing props from page component? Eg. navigation which is shared across many pages.",
      createdAt: Date.now(),
    comments: [
      {
        name: "rawe",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "hlaow",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "Why the name?",
    id: 3,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    question:
        "Hello, I was thinking… Is there a way to get static props for non-page components without passing props from page component? Eg. navigation which is shared across many pages.",
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "loris",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "How is Sapper different from Next.js?",
    id: 4,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    question: "Hello, I was thinking… Is there a way to get static props for non-page components without passing props from page component? Eg. navigation which is shared across many pages.",
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "loris",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "How can I get involved?",
    id: 5,
    author: {
      name: "living",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    question: "Hello, I was thinking… Is there a way to get static props for non-page components without passing props from page component? Eg. navigation which is shared across many pages.",
      createdAt: Date.now(),
    comments: [
      {
        name: "gbenga",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  }
];
