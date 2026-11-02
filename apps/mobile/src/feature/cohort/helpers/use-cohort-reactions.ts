import { useCohortMemberIdQuery } from '@/feature/cohort/api/cohort';
import { useToggleCohortReactionMutation } from '@/feature/cohort/api/cohort-newsfeed';
import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortPost } from '@/feature/cohort/types/cohort';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { ReactionType } from '@/feature/newsfeed/types/newsfeed';
import { showToast } from '@/feature/toast/helpers/toast-store';

/** The viewer's membership id and a toggle that reacts as that member, reporting failures in a toast. */
export function useCohortReactions(cohortId: string) {
  const t = useTranslations(cohortCatalog);
  const memberId = useCohortMemberIdQuery(cohortId).data ?? null;
  const toggle = useToggleCohortReactionMutation(cohortId);

  const react = (post: CohortPost, type: ReactionType) => {
    if (!memberId) return;

    toggle.mutate(
      { post, type, memberId },
      {
        onError: (error) => showToast({ tone: 'danger', title: t('reactionFailed'), description: errorMessage(error) })
      }
    );
  };

  return { memberId, react };
}
