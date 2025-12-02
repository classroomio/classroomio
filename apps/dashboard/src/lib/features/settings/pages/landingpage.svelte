<script lang="ts">
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import * as RadioGroup from '@cio/ui/base/radio-group';

  import { landingPageSettings } from '../utils/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$lib/features/org/api/org.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';

  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Button } from '@cio/ui/base/button';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import * as Field from '@cio/ui/base/field';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import type { AccountOrg } from '$lib/features/app/types';

  let creatingNewQuestion = $state(false);
  let creatingNewCustomLink = $state(false);
  let hasUnsavedChanges = $state(false);
  let widgetKey = $state('');
  const banner = [
    { value: 'video', label: `${$t('settings.landing_page.actions.banner_type.video')}` },
    { value: 'image', label: `${$t('settings.landing_page.actions.banner_type.image')}` }
  ];

  let newQuestion = $state({
    title: '',
    content: ''
  });

  let newCustomLink = $state({
    label: '',
    url: '',
    openInNewTab: false
  });

  function widgetControl(key: string) {
    widgetKey = key;
    $handleOpenWidget.open = true;
  }

  function createNewFaq() {
    newQuestion = {
      title: '',
      content: ''
    };
    creatingNewQuestion = true;
  }

  function saveNewFAQ() {
    if (newQuestion.title !== '' && newQuestion.content !== '') {
      $landingPageSettings.faq.questions = [
        ...$landingPageSettings.faq.questions,
        {
          id: new Date().getTime(),
          title: newQuestion.title,
          content: newQuestion.content
        }
      ];
      creatingNewQuestion = false;
    }
  }

  function cancelNewFAQ() {
    creatingNewQuestion = false;
  }

  function deleteFaq(id: number) {
    let faqs = $landingPageSettings.faq.questions;
    const filteredFaq = faqs.filter((faq) => faq.id !== id);
    $landingPageSettings.faq.questions = filteredFaq;
  }

  function createNewCustomLink() {
    newCustomLink = {
      label: '',
      url: '',
      openInNewTab: false
    };
    creatingNewCustomLink = true;
  }

  function saveNewCustomLink() {
    if (newCustomLink.label !== '' && newCustomLink.url !== '') {
      $landingPageSettings.customLinks.links = [
        ...$landingPageSettings.customLinks.links,
        {
          id: new Date().getTime(),
          label: newCustomLink.label,
          url: newCustomLink.url,
          openInNewTab: newCustomLink.openInNewTab
        }
      ];
      creatingNewCustomLink = false;
    }
  }

  function cancelNewCustomLink() {
    creatingNewCustomLink = false;
  }

  function deleteCustomLink(id: number) {
    let customLinks = $landingPageSettings.customLinks.links;
    const filteredCustomLinks = customLinks.filter((link) => link.id !== id);
    $landingPageSettings.customLinks.links = filteredCustomLinks;
  }

  const checkPrefix = (inputValue: string) => {
    if (!inputValue) return;

    if (inputValue.trim() !== '') {
      if (!inputValue.startsWith('https://')) {
        inputValue = 'https://' + inputValue;
      }
    }
    return inputValue;
  };

  export async function handleSave() {
    $landingPageSettings.footer.twitter = checkPrefix($landingPageSettings.footer.twitter) || '';
    $landingPageSettings.footer.linkedin = checkPrefix($landingPageSettings.footer.linkedin) || '';
    $landingPageSettings.footer.facebook = checkPrefix($landingPageSettings.footer.facebook) || '';

    await orgApi.update($currentOrg.id, {
      landingpage: $landingPageSettings as AccountOrg['landingpage']
    });

    if (orgApi.success) {
      $currentOrg.landingpage = $landingPageSettings as AccountOrg['landingpage'];
      hasUnsavedChanges = false;
    }
  }

  // Set default from store
  currentOrg.subscribe((cOrg) => {
    if (cOrg.landingpage && Object.keys(cOrg.landingpage).length) {
      const landingpage = { ...(cOrg.landingpage as unknown as OrgLandingPageJson) };

      // Fallbacks for new keys we added into JSON, in case a user already saved the old JSON
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      if (!landingpage?.header?.background) {
        landingpage.header.background = $landingPageSettings.header.background;
      }

      if (!landingpage.customLinks) {
        landingpage.customLinks = $landingPageSettings.customLinks;
      }
      $landingPageSettings = {
        ...landingpage
      };
    }
  });
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.header.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.header.show
          ? $t('settings.landing_page.show_section')
          : $t('settings.landing_page.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.header.title}
          oninput={() => (hasUnsavedChanges = true)}
          class="w-full"
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.title_highlight')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
          class="w-full"
          bind:value={$landingPageSettings.header.titleHighlight}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.subtitle')}</Field.Label>
        <Textarea
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
          class="w-full"
          bind:value={$landingPageSettings.header.subtitle}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.actions.heading')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
          class="w-full"
          bind:value={$landingPageSettings.header.action.label}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.actions.link')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.link')}
          bind:value={$landingPageSettings.header.action.link}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch
          bind:checked={$landingPageSettings.header.action.redirect}
          onCheckedChange={() => (hasUnsavedChanges = true)}
        />
        <Field.Label class="text-gray-600">
          {$landingPageSettings.header.action.redirect
            ? $t('settings.landing_page.actions.redirect')
            : $t('settings.landing_page.actions.no_redirect')}
        </Field.Label>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.actions.banner_type.heading')}</Field.Label>
        <RadioGroup.Root
          bind:value={$landingPageSettings.header.banner.type}
          onValueChange={() => {
            if (hasUnsavedChanges) return;
            hasUnsavedChanges = true;
          }}
        >
          {#each banner as item}
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value={item.value} id={item.value} />
              <Label for={item.value} class="cursor-pointer">{item.label}</Label>
            </div>
          {/each}
        </RadioGroup.Root>
      </Field.Field>

      {#if $landingPageSettings.header.banner.type === 'video'}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.actions.link')}</Field.Label>
          <Input
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.video')}
            bind:value={$landingPageSettings.header.banner.video}
            oninput={() => (hasUnsavedChanges = true)}
          />
        </Field.Field>
      {:else}
        <Field.Field>
          <Button variant="outline" onclick={() => widgetControl('header.banner.image')}>
            {$t('settings.landing_page.about.select_image')}
          </Button>
        </Field.Field>
      {/if}
      {#if $landingPageSettings.header.banner.image && $landingPageSettings.header.banner.type === 'image'}
        <img alt="bannerImage" src={$landingPageSettings.header.banner.image} class="mt-2 w-full rounded-md" />
      {/if}

      <Field.Field orientation="horizontal">
        <Switch
          bind:checked={$landingPageSettings.header.banner.show}
          onCheckedChange={() => (hasUnsavedChanges = true)}
        />
        <Field.Label class="text-gray-600">
          {$landingPageSettings.header.banner.show
            ? $t('settings.landing_page.actions.show_banner')
            : $t('settings.landing_page.actions.hide_banner')}
        </Field.Label>
      </Field.Field>
      {#if $handleOpenWidget.open && widgetKey === 'banner'}
        <UploadWidget
          bind:imageURL={$landingPageSettings.header.banner.image}
          onchange={() => (hasUnsavedChanges = true)}
        />
      {/if}

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.background.title')}</Field.Label>
        <Button variant="outline" onclick={() => widgetControl('background')}>
          {$t('settings.landing_page.about.select_image')}
        </Button>
      </Field.Field>
      {#if $landingPageSettings.header.background?.image}
        <img alt="backgroundImage" src={$landingPageSettings.header.background.image} class="mt-2 w-full rounded-md" />
      {/if}

      <Field.Field orientation="horizontal">
        <Switch
          checked={$landingPageSettings.header.background?.show}
          onCheckedChange={() => {
            hasUnsavedChanges = true;
            if (!$landingPageSettings.header.background) {
              $landingPageSettings.header.background = {
                image: '',
                show: true
              };
            } else {
              $landingPageSettings.header.background.show = !$landingPageSettings.header.background.show;
            }
          }}
        />
        <Field.Label class="text-gray-600">
          {$landingPageSettings.header.background?.show
            ? $t('settings.landing_page.background.show_background')
            : $t('settings.landing_page.background.hide_background')}
        </Field.Label>
      </Field.Field>
      {#if $handleOpenWidget.open && widgetKey === 'background'}
        <UploadWidget
          imageURL={$landingPageSettings.header.background?.image}
          onchange={(imgUrl) => {
            hasUnsavedChanges = true;

            if (!$landingPageSettings.header.background) {
              $landingPageSettings.header.background = {
                image: imgUrl,
                show: true
              };
            } else {
              $landingPageSettings.header.background.image = imgUrl;
            }
          }}
        />
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.about.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.aboutUs.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.aboutUs.show
          ? $t('settings.landing_page.show_section')
          : $t('settings.landing_page.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.about.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.aboutUs.title}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.about.content')}</Field.Label>
        <Textarea
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.content')}
          bind:value={$landingPageSettings.aboutUs.content}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>

      <Field.Field>
        <Field.Label class="font-bold">{$t('settings.landing_page.about.upload_an_image')}</Field.Label>
        <Button variant="outline" onclick={() => widgetControl('about-us')}>
          {$t('settings.landing_page.about.select_image')}
        </Button>
        {#if $landingPageSettings.aboutUs.imageUrl}
          <img alt="About us" src={$landingPageSettings.aboutUs.imageUrl} class="mt-2 w-full rounded-md" />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'about-us'}
          <UploadWidget bind:imageURL={$landingPageSettings.aboutUs.imageUrl} />
        {/if}
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.courses.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.courses.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.courses.show
          ? $t('settings.landing_page.courses.show_section')
          : $t('settings.landing_page.courses.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.courses.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.courses.title}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.courses.title_highlight')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
          bind:value={$landingPageSettings.courses.titleHighlight}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.courses.subtitle')}</Field.Label>
        <Textarea
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
          bind:value={$landingPageSettings.courses.subtitle}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.faq.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.faq.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.faq.show
          ? $t('settings.landing_page.faq.show_section')
          : $t('settings.landing_page.faq.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.faq.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.faq.title}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>

      {#each $landingPageSettings.faq.questions as item (item.id)}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.faq.question')}</Field.Label>
          <Input
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_question_here')}
            bind:value={item.title}
            oninput={() => (hasUnsavedChanges = true)}
          />
        </Field.Field>
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.faq.answer')}</Field.Label>
          <Textarea
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
            bind:value={item.content}
            oninput={() => (hasUnsavedChanges = true)}
          />
        </Field.Field>
        <Button variant="ghost" size="icon" onclick={() => deleteFaq(item.id)}>
          <TrashIcon size={16} />
        </Button>
      {/each}

      {#if creatingNewQuestion}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.faq.question')}</Field.Label>
          <Input
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_question_here')}
            bind:value={newQuestion.title}
            oninput={() => (hasUnsavedChanges = true)}
          />
        </Field.Field>
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.faq.answer')}</Field.Label>
          <Textarea
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
            bind:value={newQuestion.content}
            oninput={() => (hasUnsavedChanges = true)}
          />
        </Field.Field>
        <Field.Field orientation="horizontal">
          <Button variant="outline" onclick={saveNewFAQ}>
            {$t('settings.landing_page.faq.save')}
          </Button>
          <Button variant="outline" onclick={cancelNewFAQ}>
            {$t('settings.landing_page.faq.cancel')}
          </Button>
        </Field.Field>
      {:else}
        <Field.Field orientation="horizontal">
          <Button variant="outline" onclick={createNewFaq}>
            {$t('settings.landing_page.faq.button')}
          </Button>
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.contact_us.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.contact.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.contact.show
          ? $t('settings.landing_page.contact_us.show_section')
          : $t('settings.landing_page.contact_us.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.contact.title}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.title_highlight')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
          bind:value={$landingPageSettings.contact.titleHighlight}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.subtitle')}</Field.Label>
        <Textarea
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
          bind:value={$landingPageSettings.contact.subtitle}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.address')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.address')}
          bind:value={$landingPageSettings.contact.address}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.phone_number')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.number')}
          bind:value={$landingPageSettings.contact.phone}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.contact_us.email')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.email')}
          bind:value={$landingPageSettings.contact.email}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.mailing_list.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.mailinglist.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.mailinglist.show
          ? $t('settings.landing_page.mailing_list.show_section')
          : $t('settings.landing_page.mailing_list.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.mailing_list.title')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
          bind:value={$landingPageSettings.mailinglist.title}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.mailing_list.subtitle')}</Field.Label>
        <Textarea
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
          bind:value={$landingPageSettings.mailinglist.subtitle}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.mailing_list.button_label')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
          bind:value={$landingPageSettings.mailinglist.buttonLabel}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.custom_links.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.customLinks.show} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.customLinks.show
          ? $t('settings.landing_page.custom_links.show_links')
          : $t('settings.landing_page.custom_links.hide_links')}
      </Field.Label>
    </Field.Field>

    <Field.Description>{$t('settings.landing_page.custom_links.description')}</Field.Description>

    <Field.Group>
      {#each $landingPageSettings.customLinks.links as link (link.id)}
        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field.Field>
              <Field.Label>{$t('settings.landing_page.custom_links.label')}</Field.Label>
              <Input placeholder={$t('settings.landing_page.custom_links.label_placeholder')} bind:value={link.label} />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('settings.landing_page.custom_links.url')}</Field.Label>
              <Input placeholder={$t('settings.landing_page.custom_links.url_placeholder')} bind:value={link.url} />
            </Field.Field>
          </div>
          <div class="flex items-center justify-between">
            <Field.Field orientation="horizontal">
              <Checkbox id="new-tab-{link.id}" bind:checked={link.openInNewTab} />
              <Field.Label class="text-sm">{$t('settings.landing_page.custom_links.new_tab')}</Field.Label>
            </Field.Field>
            <Button variant="ghost" size="icon" onclick={() => deleteCustomLink(link.id)}>
              <TrashIcon size={16} />
            </Button>
          </div>

          <Field.Separator />
        </div>
      {/each}

      {#if creatingNewCustomLink}
        <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div class="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field.Field>
              <Field.Label>{$t('settings.landing_page.custom_links.label')}</Field.Label>
              <Input
                placeholder={$t('settings.landing_page.custom_links.label_placeholder')}
                bind:value={newCustomLink.label}
              />
            </Field.Field>
            <Field.Field>
              <Field.Label>{$t('settings.landing_page.custom_links.url')}</Field.Label>
              <Input
                placeholder={$t('settings.landing_page.custom_links.url_placeholder')}
                bind:value={newCustomLink.url}
              />
            </Field.Field>
          </div>
          <div class="flex items-center justify-between">
            <Field.Field orientation="horizontal">
              <input type="checkbox" bind:checked={newCustomLink.openInNewTab} class="mr-2" />
              <Field.Label class="text-sm">{$t('settings.landing_page.custom_links.new_tab')}</Field.Label>
            </Field.Field>
            <div class="flex gap-2">
              <Button variant="outline" onclick={saveNewCustomLink} class="px-3 py-1 text-sm">
                {$t('settings.landing_page.custom_links.save')}
              </Button>
              <Button variant="outline" onclick={cancelNewCustomLink} class="px-3 py-1 text-sm">
                {$t('settings.landing_page.custom_links.cancel')}
              </Button>
            </div>
          </div>
        </div>
      {:else}
        <Field.Field orientation="horizontal">
          <Button variant="outline" onclick={createNewCustomLink}>
            {$t('settings.landing_page.custom_links.add')}
          </Button>
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.footer.heading')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch bind:checked={$landingPageSettings.footer.show} onCheckedChange={() => (hasUnsavedChanges = true)} />
      <Field.Label class="text-gray-600">
        {$landingPageSettings.footer.show
          ? $t('settings.landing_page.footer.show_section')
          : $t('settings.landing_page.footer.hide_section')}
      </Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.footer.facebook')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.facebook')}
          bind:value={$landingPageSettings.footer.facebook}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <!-- <TextField
        label="Instagram"
        placeholder="Write your Instagram link here"
        className="mb-5"
        bind:value={$landingPageSettings.footer.instagram}
      /> -->
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.footer.twitter')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.twitter')}
          bind:value={$landingPageSettings.footer.twitter}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.footer.linkedin')}</Field.Label>
        <Input
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.linkedin')}
          bind:value={$landingPageSettings.footer.linkedin}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>

<style>
  :global(.dark) {
    --cp-text-color: #fff;
    --cp-border-color: white;
    --cp-text-color: white;
    --cp-input-color: #555;
    --cp-button-hover-color: #777;
  }

  :global(.dark .alpha) {
    background: #333 !important;
  }
</style>
