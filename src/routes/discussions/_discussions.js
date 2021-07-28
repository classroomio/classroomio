// Ordinarily, you'd generate this data from markdown files in your
// repo, or fetch them from a database of some kind. But in order to
// avoid unnecessary dependencies in the starter template, and in the
// service of obviousness, we're just going to leave it here.

// This file is called `_discussions.js` rather than `posts.js`, because
// we don't want to create an `/blog/posts` route — the leading
// underscore tells Sapper not to do that.
const question = "\ Hey!\n>\n> I'm working on a dashboard app that's where most things are login only and I like using ### Outlined a draft of the flows\n>\n> ### API Proposals\n> #### Through `getServerSideProps`\n> * Add new return property to `getServerSideProps` called i.e. `fetchPolicy` that can default to `always` being current behaviour and add new option `cache-and-network`/`stale-while-revalidate` as outlined above\n> * Add new router API event, called i.e. `routePropsChanged`, that can be triggered when page props change\n> * Maybe it could also send the `stale-while-revalidate` http header to the browser for instant page reloads?\n> * Problem: needs a way to clear cache when mutating to prevent a flash of unchanged content\n>\n> #### Through router\n> * Add new prop to Link/Router called `fetchPolicy: 'cache-and-network'` which could use a cache of the page's data if it exists and warm it up on load (similar to [`shallow`](https://nextjs.org/docs/routing/shallow-routing).)\n> * If `fetchPolicy: 'cache-and-network` is combined with `prefetch` it could actually preload the data on each page as well and make every route navigation change snappy, even when using getServerSideProps`\n> * This removes the \"flash of unchanged content\" on mutations as you can trigger a route change after a mutation w/o using the cache.\n>\n> Later on, this could be extended to allow for polling as well maybe, which could enable some real-time views without the need of any actual client-side query wiring.\n"
export default [
  {
    title: "What is Sapper?",
    id: 1,
    votes: 100,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    tags: [
      'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
    ],
    question: '# Problem\n\nThere is a problem with my code please help me check it out.\n\n```js\nconst name = "dfdf";\n```',
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        votes: 5,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        votes: 0,
        comment:
          " Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "loris",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        votes: 100,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "How to use Sapper",
    id: 2,
    votes: 100,

    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    tags: [
      'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
    ],
      question:
        question,
      createdAt: Date.now(),
    comments: [
      {
        name: "rawe",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        votes: 10,
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "hlaow",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        votes: 5,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "Why the name?",
    votes: 100,
    id: 3,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    tags: [
      'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
    ],
    question:
        question,
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        votes: 50,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        votes: 9,
        comment:
          "Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
      },
      {
        name: "loris",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        votes: 5,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  },

  {
    title: "How is Sapper different from Next.js?",
    id: 4,
    votes: 10,
    author: {
      name: "babdraa",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    tags: [
      'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
    ],
    question: question,
      createdAt: Date.now(),
    comments: [
      {
        name: "babdraa",
        avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4",
        votes: 0,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      },
      {
        name: "crana",
        avatar: "https://avatars1.githubusercontent.com/u/31749594?s=60&v=4",
        votes: 1,
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
    votes: 7,
    tags: [
      'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
    ],
    author: {
      name: "living",
      avatar: "https://avatars3.githubusercontent.com/u/24832873?s=60&v=4"
    },
    question: question,
      createdAt: Date.now(),
    comments: [
      {
        name: "gbenga",
        avatar: "https://avatars3.githubusercontent.com/u/11896398?s=60&v=4",
        votes: 1000,
        comment:
          "getStaticProps must always be called from a page located in pages/*"
      }
    ]
  }
];
