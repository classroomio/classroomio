<script>
  import marked from "marked";
  import PageNav from "../../../PageNav/index.svelte";
  import CloseButton from "../../../Buttons/Close/index.svelte";
  import TextField from "../../../Form/TextField.svelte";
  // import SendButton from "../../../Buttons/Send/index.svelte";

  export let handleClose;

  let message = "";
  let bodyRef;
  let chats = [
    {
      avatar: "https://picsum.photos/32/32/?random",
      name: "Evgeniy",
      message: "I'am looking at this and it looks great",
    },
    {
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
      message:
        "Thanks for the feedback, what do you think about my website. https://rotimibest.com",
    },
    {
      avatar: "https://picsum.photos/32/32/?random",
      name: "Vitalii Marushko",
      message: "Всем привет",
    },
    {
      avatar: "https://picsum.photos/32/32/?random",
      name: "Natasha",
      message: "Привет Виталий",
    },
  ];

  function handleSend() {
    if (!message) {
      return;
    }

    chats = [
      ...chats,
      {
        avatar: "https://picsum.photos/32/32/?random",
        name: "You",
        message,
      },
    ];

    message = null;

    setTimeout(() => {
      bodyRef.scrollTo({
        top: bodyRef.scrollHeight,
      });
    }, 100);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSend();
    }
  }
</script>

<PageNav title="LiveChat" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div bind:this={bodyRef} class="body">
  {#each chats as chat}
    <div class="pl-2 pb-4">
      <div class="flex items-center no-underline hover:underline text-black">
        <img
          alt="Placeholder"
          class="block rounded-full"
          width="24"
          height="20"
          src={chat.avatar}
        />
        <p class="ml-2 text-sm font-bold">{chat.name}</p>
      </div>
      <article class="prose prose-sm sm:prose pt-2 pl-8">
        {@html marked(chat.message)}
      </article>
    </div>
  {/each}
</div>

<div class="footer">
  <!-- <div class="flex items-center justify-between leading-none pl-2"> -->
  <TextField
    placeholder="Say something"
    bind:value={message}
    onKeyDown={handleKeyDown}
  />
  <!-- <SendButton onClick={handleSend} /> -->
  <!-- </div> -->
</div>

<style>
  .body {
    overflow: auto;
    height: 80%;
  }
  .footer {
    position: absolute;
    bottom: 0px;
    width: 100%;
  }
</style>
