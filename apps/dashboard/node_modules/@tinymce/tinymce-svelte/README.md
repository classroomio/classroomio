# TinyMCE Svelte component

## About

This package is a thin wrapper around [TinyMCE](https://github.com/tinymce/tinymce) to make it easier to use in a Svelte application.

## Quick start

### Create a Svelte App from a template

```
npx degit sveltejs/template my-tiny-app
cd my-tiny-app
```

### Add the Editor component

Installl the editor component in your project

```
npm install @tinymce/tinymce-svelte
```

## Import the TinyMCE component

Import the TinyMCE component inside the script tag of your Svelte app

```
<script lang="ts">
import Editor from '@tinymce/tinymce-svelte';
</script>
<main>
  <h1> Hello Tiny</h1>
  <Editor />
</main>

```

## TinyMCE Svelte technical reference

### Configuring the TinyMCE svelte integration

The editor component accepts the following properties:

```
<Editor
  apiKey="api-key"
  channel="5"
  id="uuid"
  inline=false
  disabled=false
  scriptSrc=undefined
  conf={}
  modelEvents="input change undo redo"
  value="value"
  text="readonly-text-output"
  cssClass="tinymce-wrapper"
/>
```

#### ApiKey

Tiny Cloud API key. Required for deployments using the Tiny Cloud to provide the TinyMCE editor.

Default value: no-api-key
Type: string

##### Example using ApiKey
```
<Editor
  apiKey="your-api-key"
/>
```

#### Channel

Specifies the Tiny Cloud channel to use. For more information on TinyMCE development channels, see: [Specifying the TinyMCE editor version deployed from Cloud - dev, testing, and stable releases](https://www.tiny.cloud/docs/cloud-deployment-guide/editor-plugin-version/#devtestingandstablereleases)

Default value: '5'
Type: string

##### Example using channel
```
<Editor
  channel="5-dev"
/>
```

#### CssClass

Specifies the name of the class or classes to use for the `div` wrapping the editor.

Default value: 'tinymce-wrapper'
Type: string

##### Example using cssClass
```
<script>
let editorCss = 'active editor';
</script>
<Editor
  cssClass={editorCss}
/>
```

#### Id

Specified an Id for the editor. Used for retrieving the editor instance using the `tinymce.get('ID')` method.

Default value: Automatically generated UUID
Type: string

##### Example using Id
```
<Editor
  id="my-unique-identifier"
/>
```

#### Inline

Set the editor to inline mode.

Default value: false
Type: bool

##### Example using Inline
```
<Editor
  inline=true
/>
```

#### Disabled

Set the editor to readonly mode.

Default value: false
Type: bool

##### Example using Disabled
```
<Editor
  disabled=true
/>
```

#### Conf

Specify a set of properties for the `Tinymce.init` method to initialize the editor.

Default value: {}
Type: Object

##### Example using Conf
```
<script>
 let conf = {
   toolbar: 'undo redo',
   menubar: false
 }
</script>
<main>
  <Editor
    {conf}
  />
</main>
```

### Component binding

#### Input binding

The editor component allows users to bind the contents of editor to a variable. By specifying the `bind:value`, users can do two-way binding on a select variable.

#### Example of input binding

```
<script>
let value = 'some content';
</script>
<main>
  <Editor bind:value={value} />
  <div>{@html value}</div>
  <textarea bind:value={value}></textarea>
</main>
```


#### Binding text output

The editor exposes the `text` property as a read-only value you can bind to get the editor content as text. It is important to remember that changes will not propagate up the editor if the text bound variable changes. It will only propagate changes from the editor.

#### Example of text binding

```
<script>
let text = '';
</script>
<main>
  <Editor bind:text={text} />
  <div>{text}</div>
</main>
```