<script>
  //
  import Editor from '../main/component/Editor.svelte';
  import { Meta, Story } from '@storybook/addon-svelte-csf';

  const apiKey = 'b1g4d59rwwqxx1vj7mci23rjj8ubgb46i4xsio6ieig6fkps';
  const content = `
    <h2 style="text-align: center;">
    TinyMCE provides a <span style="text-decoration: underline;">full-featured</span> rich text editing experience, and a featherweight download.
  </h2>
  <p style="text-align: center;">
    <strong><span style="font-size: 14pt;"><span style="color: #7e8c8d; font-weight: 600;">No matter what you're building, TinyMCE has got you covered.</span></span></strong>
  </p>`;

  let value = content;
  let disabled = true;
  let text = '';

  const toggleDisabled = () => {
    disabled = !disabled;
  }
</script>

<Meta title="Editor" component={Editor}/>

<Story name="Iframe">
  <Editor {apiKey} value={content}/>
</Story>

<Story name="Inline">
  <div style="padding-top:100px;">
    <Editor {apiKey} inline={true} value={content} />
  </div>
</Story>

<Story name="Value binding">
  <div>
    <Editor {apiKey} bind:value={value} />
    <div>
      {@html value}
    </div>
  </div>
</Story>

<Story name="Input binding">
  <div>
    <Editor {apiKey} bind:value={value} />
    <textarea style="width:100%;height:200px" bind:value={value}></textarea>
  </div>
</Story>

<Story name="Text binding">
  <div>
    <Editor {apiKey} bind:value={value} bind:text={text} />
    <div>{text}</div>
    <div>{@html value}</div>
    <textarea style="width:100%;height:200px" bind:value={text}></textarea>
  </div>
</Story>

<Story name="Disabling">
  <div>
    <button on:click={toggleDisabled}>{#if disabled}Enable{:else}Disable{/if}</button>
    <Editor {disabled} />
  </div>
</Story>
