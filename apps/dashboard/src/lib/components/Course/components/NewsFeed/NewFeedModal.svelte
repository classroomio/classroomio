<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { Feed, Author } from '$lib/utils/types/feed';
  import { createNewFeed } from '$lib/utils/services/newsfeed';
  import { getTextFromHTML } from '$lib/utils/functions/toHtml';
  import { Button } from '@cio/ui/base/button';
  import { createNewsfeedValidation } from '$lib/utils/functions/validator';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';
  import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification/notification';

  import * as Dialog from '@cio/ui/base/dialog';
  import { TextEditor } from '$features/ui';

  interface Props {
    author?: Author | any;
    courseId?: string;
    onSave?: any;
    onEdit?: any;
    edit?: boolean;
    editFeed: Feed | null;
  }

  let {
    author = {},
    courseId = '',
    onSave = (_feed: Feed) => {},
    onEdit = (_id: string, _content: string) => {},
    edit = $bindable(false),
    editFeed = $bindable()
  }: Props = $props();

  let isLoading = $state(false);
  let createdFeed;
  let errors: Record<string, string> = $state({
    newPost: ''
  });

  let newPost = $state(edit === true ? editFeed?.content : '');

  const onPost = async () => {
    errors = createNewsfeedValidation(getTextFromHTML(newPost ?? ''));

    if (Object.keys(errors).length || !editFeed) {
      return;
    }

    isLoading = true;

    try {
      if (edit) {
        onEdit(editFeed.id, newPost);
        snackbar.success('snackbar.newsfeed.success.edit');

        edit = false;
        newPost = '';
        $isNewFeedModal.open = false;
      } else {
        const {
          response: { data }
        } = await createNewFeed({
          content: newPost ?? '',
          author_id: author.id,
          course_id: courseId,
          reaction: {
            smile: [],
            thumbsup: [],
            thumbsdown: [],
            clap: []
          }
        });

        if (!data) return;

        createdFeed = data[0];

        if (!createdFeed) return;

        onSave({
          id: createdFeed.id,
          content: newPost,
          author: {
            profile: { ...author }
          },
          created_at: createdFeed.created_at,
          comment: [],
          reaction: createdFeed.reaction,
          isPinned: false
        });

        snackbar.success('snackbar.newsfeed.success.add');
        triggerSendEmail(NOTIFICATION_NAME.NEWSFEED, {
          authorId: createdFeed.author_id,
          feedId: createdFeed.id
        });
        resetEditor();
      }
    } catch (error) {
      snackbar.error(
        'snackbar.newsfeed.error.error ' +
          (edit ? 'snackbar.newsfeed.error.editing' : 'snackbar.newsfeed.error.creating')
      );
    } finally {
      isLoading = false;
    }
  };

  const resetEditor = () => {
    newPost = '';
    edit = false;
    $isNewFeedModal.open = false;
  };
</script>

<Dialog.Root
  bind:open={$isNewFeedModal.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) resetEditor();
  }}
>
  <Dialog.Content class="w-4/5 max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {edit === true
          ? $t('course.navItem.news_feed.heading_button.edit_post')
          : $t('course.navItem.news_feed.heading_button.make_a_post')}
      </Dialog.Title>
    </Dialog.Header>
    <section class="w-2/ flex h-full flex-col rounded-xl pb-3">
    <TextEditor
      content={newPost}
      onChange={(text) => {
        newPost = text;
      }}
      editorClass="max-h-[400px]"
      placeholder={$t('course.navItem.news_feed.heading_button.placeholder')}
    />
    {#if errors.newPost}
      <p class="text-sm text-red-500">{errors.newPost}</p>
    {/if}
    <div class="flex items-center justify-end py-2">
      <div class="flex gap-2">
        <Button
          variant="outline"
          onclick={resetEditor}
        >
          {$t('course.navItem.news_feed.heading_button.cancel')}
        </Button>
        <Button loading={isLoading} onclick={onPost}>
          {$t('course.navItem.news_feed.heading_button.post')}
        </Button>
      </div>
    </div>
  </section>
  </Dialog.Content>
</Dialog.Root>
