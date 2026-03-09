<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import * as Code from '@cio/ui/custom/code';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Code',
    component: Code.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const sampleTypeScript = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`;

  const sampleBash = `# Install dependencies
pnpm install

# Run development server
pnpm dev`;

  const sampleJson = `{
  "name": "@cio/ui",
  "version": "0.0.1",
  "type": "module"
}`;

  const sampleSvelte = [
    '<script lang="ts">',
    '  let { count = 0 }: { count?: number } = $props();',
    '</' + 'script>',
    '',
    '<button onclick={() => count++}>',
    '  Count: {count}',
    '</button>'
  ].join('\n');

  const longCode = `// Example: Long code block for overflow demo
export function useCode(props: CodeRootStateProps) {
  return ctx.set(new CodeRootState(props, overflowCtx.getOr(undefined)));
}

export function useCodeCopyButton() {
  return new CodeCopyButtonState(ctx.get());
}

const overflowCtx = new Context<CodeOverflowState>('code-overflow-state');
const ctx = new Context<CodeRootState>('code-root-state');

class CodeRootState {
  highlighter: HighlighterCore | null = $state(null);

  constructor(
    readonly opts: CodeRootStateProps,
    readonly overflow?: CodeOverflowState
  ) {
    highlighter.then((hl) => (this.highlighter = hl));
  }

  highlight(code: string) {
    return this.highlighter?.codeToHtml(code, {
      lang: this.opts.lang.current,
      themes: { light: 'github-light-default', dark: 'github-dark-default' }
    });
  }
}`;
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-3xl">
      <Code.Root code={sampleTypeScript} lang="typescript" />
    </div>
  {/snippet}
</Story>

<Story name="With Copy Button">
  {#snippet template()}
    <div class="ui:relative ui:w-full ui:max-w-3xl">
      <Code.Root code={sampleTypeScript} lang="typescript">
        <Code.CopyButton />
      </Code.Root>
    </div>
  {/snippet}
</Story>

<Story name="Variants">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-6 ui:w-full ui:max-w-3xl">
      <div>
        <p class="ui:mb-2 ui:text-sm ui:font-medium ui:text-muted-foreground">Default variant</p>
        <Code.Root code={sampleTypeScript} lang="typescript" variant="default">
          <Code.CopyButton />
        </Code.Root>
      </div>
      <div>
        <p class="ui:mb-2 ui:text-sm ui:font-medium ui:text-muted-foreground">Secondary variant</p>
        <Code.Root code={sampleTypeScript} lang="typescript" variant="secondary">
          <Code.CopyButton />
        </Code.Root>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Languages">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-6 ui:w-full ui:max-w-3xl">
      <Code.Block filename="example.ts" code={sampleTypeScript} />
      <Code.Block filename="script.sh" code={sampleBash} />
      <Code.Block filename="package.json" code={sampleJson} />
      <Code.Block filename="Component.svelte" code={sampleSvelte} />
    </div>
  {/snippet}
</Story>

<Story name="With Line Highlighting">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <Code.Root code={sampleTypeScript} lang="typescript" highlight={[2, [4, 5]]} />
    </div>
  {/snippet}
</Story>

<Story name="Hide Line Numbers">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <Code.Root code={sampleTypeScript} lang="typescript" hideLines={true} />
    </div>
  {/snippet}
</Story>

<Story name="With Overflow">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <Code.Overflow>
        <Code.Root code={longCode} lang="typescript">
          <Code.CopyButton />
        </Code.Root>
      </Code.Overflow>
    </div>
  {/snippet}
</Story>

<Story name="Overflow Expanded">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <Code.Overflow collapsed={false}>
        <Code.Root code={longCode} lang="typescript">
          <Code.CopyButton />
        </Code.Root>
      </Code.Overflow>
    </div>
  {/snippet}
</Story>
