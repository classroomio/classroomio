<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import Bot from '@lucide/svelte/icons/bot';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Copy from '@lucide/svelte/icons/copy';
  import Share from '@lucide/svelte/icons/share';
  import Trash from '@lucide/svelte/icons/trash';
  import UserRoundX from '@lucide/svelte/icons/user-round-x';
  import VolumeOff from '@lucide/svelte/icons/volume-off';
  import AudioLines from '@lucide/svelte/icons/audio-lines';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Search from '@lucide/svelte/icons/search';
  import Archive from '@lucide/svelte/icons/archive';
  import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
  import Clock from '@lucide/svelte/icons/clock';
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import MailCheck from '@lucide/svelte/icons/mail-check';
  import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
  import Tag from '@lucide/svelte/icons/tag';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';

  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Separator } from '@cio/ui/base/separator';
  import * as Popover from '@cio/ui/base/popover';
  import * as Select from '@cio/ui/base/select';
  import * as InputGroup from '@cio/ui/base/input-group';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ButtonGroup',
    component: ButtonGroup.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let label = $state('personal');
  let voiceEnabled = $state(false);

  const CURRENCIES = [
    {
      value: '$',
      label: 'US Dollar'
    },
    {
      value: '€',
      label: 'Euro'
    },
    {
      value: '£',
      label: 'British Pound'
    }
  ];

  let currency = $state('$');
</script>

<Story name="Default">
  {#snippet template()}
    <ButtonGroup.Root>
      <ButtonGroup.Root class="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeft />
        </Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline">Snooze</Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="icon" aria-label="More Options">
                <MoreHorizontal />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-52">
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                <MailCheck />
                Mark as Read
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <Archive />
                Archive
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                <Clock />
                Snooze
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <CalendarPlus />
                Add to Calendar
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <ListFilter />
                Add to List
              </DropdownMenu.Item>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>
                  <Tag />
                  Label As...
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.RadioGroup bind:value={label}>
                    <DropdownMenu.RadioItem value="personal">Personal</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="work">Work</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="other">Other</DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item class="text-destructive focus:text-destructive">
                <Trash2 />
                Trash
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Orientation">
  {#snippet template()}
    <ButtonGroup.Root orientation="vertical" aria-label="Media controls" class="h-fit">
      <Button variant="outline" size="icon">
        <Plus />
      </Button>
      <Button variant="outline" size="icon">
        <Minus />
      </Button>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Sizes">
  {#snippet template()}
    <div class="flex flex-col items-start gap-8">
      <ButtonGroup.Root>
        <Button variant="outline" size="sm">Small</Button>
        <Button variant="outline" size="sm">Button</Button>
        <Button variant="outline" size="sm">Group</Button>
        <Button variant="outline" size="icon-sm">
          <Plus />
        </Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Button</Button>
        <Button variant="outline">Group</Button>
        <Button variant="outline" size="icon">
          <Plus />
        </Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline" size="lg">Large</Button>
        <Button variant="outline" size="lg">Button</Button>
        <Button variant="outline" size="lg">Group</Button>
        <Button variant="outline" size="icon-lg">
          <Plus />
        </Button>
      </ButtonGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Nested">
  {#snippet template()}
    <ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline" size="sm">1</Button>
        <Button variant="outline" size="sm">2</Button>
        <Button variant="outline" size="sm">3</Button>
        <Button variant="outline" size="sm">4</Button>
        <Button variant="outline" size="sm">5</Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button variant="outline" size="icon-sm" aria-label="Previous">
          <ArrowLeft />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Next">
          <ArrowRight />
        </Button>
      </ButtonGroup.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Separator">
  {#snippet template()}
    <ButtonGroup.Root>
      <Button variant="secondary" size="sm">Copy</Button>
      <ButtonGroup.Separator />
      <Button variant="secondary" size="sm">Paste</Button>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Split">
  {#snippet template()}
    <ButtonGroup.Root>
      <Button variant="secondary">Button</Button>
      <ButtonGroup.Separator />
      <Button variant="secondary" size="icon">
        <Plus />
      </Button>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Input">
  {#snippet template()}
    <ButtonGroup.Root>
      <Input placeholder="Search..." />
      <Button variant="outline" size="icon" aria-label="Search">
        <Search />
      </Button>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Input Group">
  {#snippet template()}
    <ButtonGroup.Root class="[--radius:9999rem]">
      <ButtonGroup.Root>
        <Button variant="outline" size="icon">
          <Plus />
        </Button>
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <InputGroup.Root>
          <InputGroup.Input
            placeholder={voiceEnabled ? 'Record and send audio...' : 'Send a message...'}
            disabled={voiceEnabled}
          />
          <InputGroup.Addon align="inline-end">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <InputGroup.Button
                      {...props}
                      onclick={() => (voiceEnabled = !voiceEnabled)}
                      size="icon-xs"
                      data-active={voiceEnabled}
                      class="ui:data-[active=true]:bg-orange-100 ui:data-[active=true]:text-orange-700 ui:dark:data-[active=true]:bg-orange-800 ui:dark:data-[active=true]:text-orange-100"
                      aria-pressed={voiceEnabled}
                    >
                      <AudioLines />
                    </InputGroup.Button>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>Voice Mode</Tooltip.Content>
              </Tooltip.Root></Tooltip.Provider
            >
          </InputGroup.Addon>
        </InputGroup.Root>
      </ButtonGroup.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Dropdown Menu">
  {#snippet template()}
    <ButtonGroup.Root>
      <Button variant="outline">Follow</Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="ps-2!">
              <ChevronDown />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="[--radius:1rem]">
          <DropdownMenu.Group>
            <DropdownMenu.Item>
              <VolumeOff />
              Mute Conversation
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Check />
              Mark as Read
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <AlertTriangle />
              Report Conversation
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <UserRoundX />
              Block User
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Share />
              Share Conversation
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Copy />
              Copy Conversation
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.Item variant="destructive">
              <Trash />
              Delete Conversation
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Select">
  {#snippet template()}
    <ButtonGroup.Root>
      <ButtonGroup.Root>
        <Select.Root type="single" bind:value={currency}>
          <Select.Trigger class="font-mono">
            {currency}
          </Select.Trigger>
          <Select.Content class="min-w-24">
            {#each CURRENCIES as currencyOption (currencyOption.value)}
              <Select.Item value={currencyOption.value}>
                {currencyOption.value}
                <span class="text-muted-foreground">{currencyOption.label}</span>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Input placeholder="10.00" pattern="[0-9]*" />
      </ButtonGroup.Root>
      <ButtonGroup.Root>
        <Button aria-label="Send" size="icon" variant="outline">
          <ArrowRight />
        </Button>
      </ButtonGroup.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>

<Story name="Popover">
  {#snippet template()}
    <ButtonGroup.Root>
      <Button variant="outline">
        <Bot />
        Copilot
      </Button>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" size="icon" aria-label="Open Popover">
              <ChevronDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="end" class="rounded-xl p-0 text-sm">
          <div class="px-4 py-3">
            <div class="text-sm font-medium">Agent Tasks</div>
          </div>
          <Separator />
          <div class="*:[p:not(:last-child)]:mb-2 p-4 text-sm">
            <Textarea placeholder="Describe your task in natural language." class="mb-4 resize-none" />
            <p class="font-medium">Start a new task with Copilot</p>
            <p class="text-muted-foreground">
              Describe your task in natural language. Copilot will work in the background and open a pull request for
              your review.
            </p>
          </div>
        </Popover.Content>
      </Popover.Root>
    </ButtonGroup.Root>
  {/snippet}
</Story>
