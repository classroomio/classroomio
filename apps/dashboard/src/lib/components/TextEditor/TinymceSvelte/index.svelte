<script lang="ts" module>
  const uuid = (prefix: string): string => {
    return prefix + '_' + Math.floor(Math.random() * 1000000000) + String(Date.now());
  };

  const createScriptLoader = () => {
    let state: {
      listeners: { (): void }[];
      scriptId: string;
      scriptLoaded: boolean;
      injected: boolean;
    } = {
      listeners: [],
      scriptId: uuid('tiny-script'),
      scriptLoaded: false,
      injected: false
    };

    const injectScript = (_scriptId: string, doc: Document, url: string, cb: () => void) => {
      state.injected = true;
      const script = doc.createElement('script');
      script.referrerPolicy = 'origin';
      script.type = 'application/javascript';
      script.src = url;
      script.onload = () => {
        cb();
      };
      if (doc.head) doc.head.appendChild(script);
    };

    const load = (doc: Document, url: string, callback: () => void) => {
      if (state.scriptLoaded) {
        callback();
      } else {
        state.listeners.push(callback);
        // check we can access doc
        if (!state.injected) {
          injectScript(state.scriptId, doc, url, () => {
            state.listeners.forEach((fn) => fn());
            state.scriptLoaded = true;
          });
        }
      }
    };

    return {
      load
    };
  };
  let scriptLoader = createScriptLoader();
</script>

<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { bindHandlers } from './Utils';
  // export let apiKey: string = 'no-api-key';
  // export let channel: string = '6';

  interface Props {
    id?: string; // default values
    inline?: boolean | undefined;
    disabled?: boolean;
    // export let scriptSrc: string | undefined = undefined;
    conf?: any;
    modelEvents?: string;
    value?: string;
    text?: string;
    cssClass?: string;
  }

  let {
    id = uuid('tinymce-svelte'),
    inline = undefined,
    disabled = false,
    conf = $bindable({}),
    modelEvents = 'change input undo redo',
    value = $bindable(''),
    text = $bindable(''),
    cssClass = 'tinymce-wrapper'
  }: Props = $props();

  let container: HTMLElement | undefined = $state();
  let element: HTMLElement | undefined = $state();
  let editorRef: any = $state();

  let lastVal = $state(value);
  let disablindCache = $state(disabled);

  const dispatch = createEventDispatcher();

  $effect(() => {
    if (editorRef && lastVal !== value) {
      try {
        editorRef.setContent(value);
        text = editorRef.getContent({ format: 'text' });
      } catch (error) {
        console.error('Error setting default value', error);
      }
    }
    if (editorRef && disabled !== disablindCache) {
      disablindCache = disabled;
      if (typeof editorRef.mode?.set === 'function') {
        editorRef.mode.set(disabled ? 'readonly' : 'design');
      } else {
        editorRef.setMode(disabled ? 'readonly' : 'design');
      }
    }
  });

  const getTinymce = () => {
    const getSink = () => {
      return typeof window !== 'undefined' ? window : global;
    };
    const sink = getSink();
    return sink && sink.tinymce ? sink.tinymce : null;
  };

  const init = () => {
    //
    const finalInit = {
      ...conf,
      target: element,
      inline: inline !== undefined ? inline : conf.inline !== undefined ? conf.inline : false,
      readonly: disabled,
      setup: (editor: any) => {
        editorRef = editor;
        editor.on('init', () => {
          editor.setContent(value);
          // bind model events
          editor.on(modelEvents, () => {
            lastVal = editor.getContent();
            if (lastVal !== value) {
              value = lastVal;
              text = editor.getContent({ format: 'text' });
            }
          });
        });
        bindHandlers(editor, dispatch);
        if (typeof conf.setup === 'function') {
          conf.setup(editor);
        }
      }
    };
    if (element) {
      element.style.visibility = '';
    }
    getTinymce().init(finalInit);
  };

  onMount(() => {
    if (getTinymce() !== null) {
      init();
    } else {
      if (!container) return;

      const script = window.location.origin + '/js/tinymce/tinymce.min.js';
      scriptLoader.load(container.ownerDocument, script, () => {
        init();
      });
    }
  });

  onDestroy(() => {
    if (editorRef) {
      getTinymce()?.remove(editorRef);
    }
  });
</script>

<div bind:this={container} class={cssClass}>
  {#if inline}
    <div {id} bind:this={element}></div>
  {:else}
    <textarea {id} bind:this={element} style="visibility:hidden"></textarea>
  {/if}
</div>

<style>
  :global(.tox .tox-promotion) {
    display: none !important;
  }
</style>
