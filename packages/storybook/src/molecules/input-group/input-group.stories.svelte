<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import SearchIcon from '@lucide/svelte/icons/search';
  import MailIcon from '@lucide/svelte/icons/mail';
  import LockIcon from '@lucide/svelte/icons/lock';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import UserIcon from '@lucide/svelte/icons/user';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import KeyIcon from '@lucide/svelte/icons/key';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import StarIcon from '@lucide/svelte/icons/star';
  import InfoIcon from '@lucide/svelte/icons/info';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import Link2Icon from '@lucide/svelte/icons/link-2';

  import { CopyButton } from '@cio/ui/base/copy-button';

  import * as InputGroup from '@cio/ui/base/input-group';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import { Kbd } from '@cio/ui/base/kbd';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/InputGroup',
    component: InputGroup.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let apiKey = $state('');
  let searchQuery = $state('');
  let fileName = $state('');
  let username = $state('');
  let message = $state('');
  let code = $state("console.log('Hello, world!');");
  let customInput = $state('Autoresize textarea...');
  let domain = $state('example.com');
  let amount = $state('0.00');
  let cardNumber = $state('');
  let fileType = $state('txt');
</script>

<Story name="Icon">
  {#snippet template()}
    <div class="grid w-full max-w-sm gap-6">
      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <SearchIcon />
        </InputGroup.Addon>
        <InputGroup.Input placeholder="Search..." />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <MailIcon />
        </InputGroup.Addon>
        <InputGroup.Input type="email" placeholder="Enter your email" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <CreditCardIcon />
        </InputGroup.Addon>
        <InputGroup.Input placeholder="Card number" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Input placeholder="Card number" />
        <InputGroup.Addon align="inline-end">
          <StarIcon />
          <InfoIcon />
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Text">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>https://</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input placeholder="example.com" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>$</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input type="number" placeholder="0.00" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <InputGroup.Text>@</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Input placeholder="Enter your username" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="block-start">
          <InputGroup.Text>Note</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Textarea placeholder="Enter your message" />
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Button">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputGroup.Root>
        <InputGroup.Input placeholder="https://x.com/shadcn" />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Button>
            <CopyIcon />
          </InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Input placeholder="Type to search..." />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Button>
            <SearchIcon />
          </InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Tooltip">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <LockIcon />
        </InputGroup.Addon>
        <InputGroup.Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" />
        <InputGroup.Addon align="inline-end">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <InputGroup.Button
                    {...props}
                    onclick={() => (showPassword = !showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {#if showPassword}
                      <EyeOffIcon />
                    {:else}
                      <EyeIcon />
                    {/if}
                  </InputGroup.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>{showPassword ? 'Hide password' : 'Show password'}</Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </InputGroup.Addon>
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <MailIcon />
        </InputGroup.Addon>
        <InputGroup.Input type="email" placeholder="Your email address" />
        <InputGroup.Addon align="inline-end">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <InputGroup.Button {...props} aria-label="Help">
                    <MessageSquareIcon />
                  </InputGroup.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>We'll never share your email</Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </InputGroup.Addon>
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="inline-start">
          <KeyIcon />
        </InputGroup.Addon>
        <InputGroup.Input type="password" placeholder="Enter API key" />
        <InputGroup.Addon align="inline-end">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <InputGroup.Button {...props} aria-label="Generate API key">
                    <KeyIcon />
                  </InputGroup.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Generate a new API key</Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Textarea">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputGroup.Root>
        <InputGroup.Addon align="block-start">
          <InputGroup.Text>Code</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Textarea placeholder="console.log('Hello, world!');" />
      </InputGroup.Root>

      <InputGroup.Root>
        <InputGroup.Addon align="block-end">
          <InputGroup.Text>Note</InputGroup.Text>
        </InputGroup.Addon>
        <InputGroup.Textarea placeholder="Enter your message" />
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Spinner">
  {#snippet template()}
    <div class="grid w-full max-w-sm gap-4">
      <InputGroup.Root data-disabled>
        <InputGroup.Input placeholder="Searching..." disabled />
        <InputGroup.Addon align="inline-end">
          <Spinner />
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root data-disabled>
        <InputGroup.Input placeholder="Processing..." disabled />
        <InputGroup.Addon>
          <Spinner />
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root data-disabled>
        <InputGroup.Input placeholder="Saving changes..." disabled />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Text>Saving...</InputGroup.Text>
          <Spinner />
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root data-disabled>
        <InputGroup.Input placeholder="Refreshing data..." disabled />
        <InputGroup.Addon>
          <LoaderIcon class="animate-spin" />
        </InputGroup.Addon>
        <InputGroup.Addon align="inline-end">
          <InputGroup.Text class="text-muted-foreground">Please wait...</InputGroup.Text>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Label">
  {#snippet template()}
    <div class="grid w-full max-w-sm gap-4">
      <InputGroup.Root>
        <InputGroup.Input id="email" placeholder="shadcn" />
        <InputGroup.Addon>
          <Label for="email">@</Label>
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root>
        <InputGroup.Input id="email-2" placeholder="shadcn@vercel.com" />
        <InputGroup.Addon align="block-start">
          <Label for="email-2" class="ui:text-foreground">Email</Label>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <InputGroup.Button
                    {...props}
                    variant="ghost"
                    aria-label="Help"
                    class="ms-auto rounded-full"
                    size="icon-xs"
                  >
                    <InfoIcon />
                  </InputGroup.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>We'll use this to send you notifications</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Dropdown">
  {#snippet template()}
    <div class="grid w-full max-w-sm gap-4">
      <InputGroup.Root>
        <InputGroup.Input placeholder="Enter file name" />
        <InputGroup.Addon align="inline-end">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <InputGroup.Button {...props} variant="ghost" aria-label="More" size="icon-xs">
                  <MoreHorizontalIcon />
                </InputGroup.Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item>Settings</DropdownMenu.Item>
              <DropdownMenu.Item>Copy path</DropdownMenu.Item>
              <DropdownMenu.Item>Open location</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root class="[--radius:1rem]">
        <InputGroup.Input placeholder="Enter search query" />
        <InputGroup.Addon align="inline-end">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <InputGroup.Button {...props} variant="ghost" class="!pe-1.5 text-xs">
                  Search In... <ChevronDownIcon class="size-3" />
                </InputGroup.Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="[--radius:0.95rem]">
              <DropdownMenu.Item>Documentation</DropdownMenu.Item>
              <DropdownMenu.Item>Blog Posts</DropdownMenu.Item>
              <DropdownMenu.Item>Changelog</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Button Group">
  {#snippet template()}
    <div class="grid w-full max-w-sm gap-6">
      <ButtonGroup.Root>
        <ButtonGroup.Text>
          <Label for="url">https://</Label>
        </ButtonGroup.Text>
        <InputGroup.Root>
          <InputGroup.Input id="url" />
          <InputGroup.Addon align="inline-end">
            <Link2Icon />
          </InputGroup.Addon>
        </InputGroup.Root>
        <ButtonGroup.Text>.com</ButtonGroup.Text>
      </ButtonGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Custom Input">
  {#snippet template()}
    <div class="grid w-lg gap-6">
      <InputGroup.Root>
        <textarea
          data-slot="input-group-control"
          class="flex field-sizing-content min-h-16 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          placeholder="Autoresize textarea..."
        ></textarea>
        <InputGroup.Addon align="block-end">
          <InputGroup.Button class="ms-auto" size="sm" variant="default">Submit</InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>
