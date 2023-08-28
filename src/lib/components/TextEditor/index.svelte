<script>
  import { onMount } from 'svelte';

  export let onChange;
  export let content;
  export let disable;
  export let docId;
  export let placeholder = 'Type something...';
  export let errorMessage;
  export let container;

  const settings = {
    modules: {
      toolbar: {
        modules: {
          syntax: true,
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'code-block']
          ]
        },
        placeholder: 'Type something...',
        theme: 'snow'
      }
    },
    theme: 'snow',
    placeholder
  };

  let quill = null;
  let isUserTyping = false;

  function resetContent(docId) {
    if (quill && quill.setText) {
      if (content) {
        quill.setContents(JSON.parse(content));
      } else {
        quill.setText('');
      }
    }
  }

  function setQuillHTML(html) {
    if (quill) {
      quill.setHTML(html);
    }
  }

  onMount(async () => {
    const { default: Quill } = await import('quill');

    Quill.prototype.getHTML = function () {
      return this.container.querySelector('.ql-editor').innerHTML;
    };

    Quill.prototype.setHTML = function (html) {
      this.container.querySelector('.ql-editor').innerHTML = html;
    };

    quill = new Quill(container, settings);

    quill.setHTML(content || '');

    quill.on('text-change', function () {
      onChange(quill.getHTML());
    });
    quill.getModule('toolbar').container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isUserTyping = true;
    });
    quill.root.addEventListener('focus', () => {
      isUserTyping = true;
    });
    quill.root.addEventListener('blur', () => {
      isUserTyping = false;
    });
  });

  $: {
    if (quill && quill.setText) {
      if (disable) {
        quill.disable(disable);
      } else {
        quill.enable(true);
      }
    }
  }

  $: if (!isUserTyping) {
    setQuillHTML(content);
  }

  $: resetContent(docId);
</script>

<div class="p-2 w-full h-full">
  <div bind:this={container} />
  {#if errorMessage}
    <p class="dark:text-white text-red-500 text-sm">
      {errorMessage}
    </p>
  {/if}
</div>

<style>
  :global(.dark .ql-stroke) {
    stroke: #fff;
  }

  :global(.dark .ql-snow .ql-picker) {
    color: #fff;
  }

  :global(.dark .ql-editor.ql-blank::before) {
    color: #fff;
  }

  :global(.ql-editor) {
    white-space: normal !important;
  }

  :global(.ql-editor p),
  :global(.ql-editor h1),
  :global(.ql-editor h2),
  :global(.ql-editor h3),
  :global(.ql-editor h4) {
    line-height: 2.2;
  }
</style>
