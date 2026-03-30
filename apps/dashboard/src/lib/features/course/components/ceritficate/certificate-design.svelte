<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';

  import { courseApi } from '$features/course/api';
  import { CERTIFICATE_THEME_IDS, type CertificateThemeId } from '$features/course/utils/constants';
  import { parseCertificateThemeId } from '$features/course/utils/certificate-utils';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import Plain from './templates/plain.svelte';
  import Professional from './templates/professional.svelte';
  import BlueBadgePattern from './templates/blue-badge-pattern.svelte';
  import PurpleBadgePattern from './templates/purple-badge-pattern.svelte';
  import BlueProfessionalBadge from './templates/blue-professional-badge.svelte';
  import PurpleProfessionalBadge from './templates/purple-professional-badge.svelte';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  const studentNamePlaceholder = 'Name of student';

  const certificateTheme = $derived(parseCertificateThemeId(courseApi.course?.certificate?.theme));

  const helperText = $derived(
    `${courseApi.course?.description?.length || 0}/200 ${$t('course.navItem.certificates.characters')}`
  );

  function onDescriptionInput(e: Event) {
    if (!courseApi.course) return;
    courseApi.course.description = (e.currentTarget as HTMLTextAreaElement).value;
  }

  function goToOrgSettings() {
    goto(
      resolve('/org/[slug]/settings', {
        slug: $currentOrg.siteName || ''
      })
    );
  }
</script>

<div class="mb-3 flex h-4/5 w-full flex-1 flex-col justify-between gap-3 lg:flex-row">
  <section class="h-full w-full lg:w-2/5">
    <Field.Group class="w-full max-w-md! px-2">
      <Field.Set>
        <Field.Legend>{$t('course.navItem.certificates.certificate_settings')}</Field.Legend>

        <Field.Group>
          <Field.Field>
            <Field.Label>{$t('course.navItem.certificates.theme')}</Field.Label>
            <RadioGroup.Root
              value={certificateTheme}
              onValueChange={(value) => {
                if (!courseApi.course) return;

                courseApi.course.certificate = {
                  ...(courseApi.course.certificate ?? {}),
                  theme: value as CertificateThemeId
                };
              }}
              disabled={$isFreePlan}
              class="mb-6"
            >
              <div class="flex flex-wrap justify-between gap-y-5">
                {#each CERTIFICATE_THEME_IDS as theme (theme)}
                  <div class="mr-3 flex items-start space-x-2">
                    <RadioGroup.Item value={theme} id={theme} />
                    <Label for={theme} class="cursor-pointer">
                      <img src={`/images/certificate_theme_${theme}.png`} alt="" class="h-[82px] w-[110px]" />
                    </Label>
                  </div>
                {/each}
              </div>
            </RadioGroup.Root>
          </Field.Field>

          <Field.Field>
            <Field.Label>{$t('course.navItem.certificates.logo')}</Field.Label>
            <Field.Description>
              {$t('course.navItem.certificates.to_update')}
              <strong class="font-semibold">{$t('course.navItem.certificates.settings')}</strong>
              {$t('course.navItem.certificates.and_upload')}
            </Field.Description>
            <Button variant="outline" class="mt-3" onclick={goToOrgSettings}>
              {$t('course.navItem.certificates.goto_settings')}
            </Button>
          </Field.Field>

          <Field.Field>
            <Field.Label for="cert-design-description">{$t('course.navItem.certificates.description')}</Field.Label>
            <Textarea
              id="cert-design-description"
              rows={6}
              class="w-full"
              placeholder={$t('course.navItem.certificates.placeholder')}
              value={courseApi.course?.description ?? ''}
              oninput={onDescriptionInput}
              disabled={$isFreePlan}
            />
            <Field.Description>{helperText}</Field.Description>
            {#if errors.description}
              <Field.Error>{errors.description}</Field.Error>
            {/if}
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </Field.Group>
  </section>
  <section class="flex w-full rounded-md lg:w-3/5">
    <div class="w-[95%]">
      {#if certificateTheme === 'professional'}
        <Professional studentName={studentNamePlaceholder} />
      {:else if certificateTheme === 'plain'}
        <Plain studentName={studentNamePlaceholder} />
      {:else if certificateTheme === 'purpleProfessionalBadge'}
        <PurpleProfessionalBadge studentName={studentNamePlaceholder} />
      {:else if certificateTheme === 'blueProfessionalBadge'}
        <BlueProfessionalBadge studentName={studentNamePlaceholder} />
      {:else if certificateTheme === 'purpleBadgePattern'}
        <PurpleBadgePattern studentName={studentNamePlaceholder} />
      {:else if certificateTheme === 'blueBadgePattern'}
        <BlueBadgePattern studentName={studentNamePlaceholder} />
      {/if}
    </div>
  </section>
</div>
