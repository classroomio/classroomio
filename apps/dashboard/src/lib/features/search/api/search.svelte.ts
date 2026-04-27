import type {
  GroupedSearchResults,
  SearchLmsData,
  SearchLmsRequest,
  SearchOrgData,
  SearchOrgRequest,
  SearchResultItem,
  SearchScope
} from '../utils/types';
import { BaseApi, classroomio } from '$lib/utils/services/api';

const SEARCH_DEBOUNCE_MS = 200;

function emptyResults(): GroupedSearchResults {
  return {
    course: [],
    program: [],
    widget: [],
    tag: [],
    audience: [],
    nav: [],
    settings: []
  };
}

function summarize(value?: string | null) {
  return value?.trim() || undefined;
}

class SearchApi extends BaseApi {
  query = $state('');
  results = $state<GroupedSearchResults>(emptyResults());

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSearchController: AbortController | null = null;

  clearResults() {
    this.results = emptyResults();
  }

  cancelSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = null;
    this.activeSearchController?.abort();
    this.activeSearchController = null;
  }

  runSearch(query: string, currentOrgPath: string, scope: SearchScope) {
    this.query = query;
    this.cancelSearch();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      this.clearResults();
      this.isLoading = false;
      return;
    }

    this.debounceTimer = setTimeout(() => {
      void this.fetchSearchResults(trimmedQuery, currentOrgPath, scope);
    }, SEARCH_DEBOUNCE_MS);
  }

  private async fetchSearchResults(query: string, currentOrgPath: string, scope: SearchScope) {
    const requestController = new AbortController();
    this.activeSearchController = requestController;

    if (scope === 'lms') {
      await this.execute<SearchLmsRequest>({
        requestFn: () =>
          classroomio.organization.search.lms.$get(
            {
              query: {
                q: query,
                limit: '5'
              }
            },
            {
              init: {
                signal: requestController.signal
              }
            }
          ),
        logContext: 'searching LMS',
        onSuccess: (response) => {
          this.results = mapLmsSearchResults(response.data);
        }
      });

      if (this.activeSearchController === requestController) {
        this.activeSearchController = null;
      }

      return;
    }

    await this.execute<SearchOrgRequest>({
      requestFn: () =>
        classroomio.organization.search.$get(
          {
            query: {
              q: query,
              limit: '5'
            }
          },
          {
            init: {
              signal: requestController.signal
            }
          }
        ),
      logContext: 'searching organization',
      onSuccess: (response) => {
        this.results = mapSearchResults(response.data, currentOrgPath);
      }
    });

    if (this.activeSearchController === requestController) {
      this.activeSearchController = null;
    }
  }
}

function mapSearchResults(data: SearchOrgData, currentOrgPath: string): GroupedSearchResults {
  const results = emptyResults();

  results.course = data.courses.map(
    (course): SearchResultItem => ({
      kind: 'course',
      id: course.id,
      title: course.title,
      subtitle: summarize(course.description),
      url: `/courses/${course.id}`
    })
  );

  results.program = data.programs.map(
    (program): SearchResultItem => ({
      kind: 'program',
      id: program.id,
      title: program.name,
      subtitle: summarize(program.description),
      url: `/programs/${program.id}/courses`
    })
  );

  results.widget = data.widgets.map(
    (widget): SearchResultItem => ({
      kind: 'widget',
      id: widget.id,
      title: widget.name,
      subtitle: widget.status,
      url: `/widgets/${widget.id}`
    })
  );

  results.tag = data.tags.map(
    (tag): SearchResultItem => ({
      kind: 'tag',
      id: tag.id,
      title: tag.name,
      subtitle: tag.kind === 'tag' ? tag.groupName : undefined,
      url: `${currentOrgPath}/tags`
    })
  );

  results.audience = data.audience.map(
    (member): SearchResultItem => ({
      kind: 'audience',
      id: String(member.memberId),
      title: member.name,
      subtitle: member.email,
      url: `${currentOrgPath}/audience?search=${encodeURIComponent(member.email || member.name)}`
    })
  );

  return results;
}

function mapLmsSearchResults(data: SearchLmsData): GroupedSearchResults {
  const results = emptyResults();

  results.course = data.courses.map(
    (course): SearchResultItem => ({
      kind: 'course',
      id: course.id,
      title: course.title,
      subtitle: summarize(course.description),
      url: `/courses/${course.id}`
    })
  );

  results.program = data.programs.map(
    (program): SearchResultItem => ({
      kind: 'program',
      id: program.id,
      title: program.name,
      subtitle: summarize(program.description),
      url: `/programs/${program.id}/courses`
    })
  );

  return results;
}

export const searchApi = new SearchApi();
