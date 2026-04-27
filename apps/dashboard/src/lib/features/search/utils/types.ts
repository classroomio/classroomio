import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { Component } from 'svelte';

export type SearchOrgRequest = (typeof classroomio.organization)['search']['$get'];
export type SearchOrgResponse = InferResponseType<SearchOrgRequest>;
export type SearchOrgSuccess = Extract<SearchOrgResponse, { success: true }>;
export type SearchOrgData = SearchOrgSuccess['data'];

export type SearchLmsRequest = (typeof classroomio.organization)['search']['lms']['$get'];
export type SearchLmsResponse = InferResponseType<SearchLmsRequest>;
export type SearchLmsSuccess = Extract<SearchLmsResponse, { success: true }>;
export type SearchLmsData = SearchLmsSuccess['data'];

export type SearchResultKind = 'course' | 'program' | 'widget' | 'tag' | 'audience' | 'nav' | 'settings';
export type SearchScope = 'org' | 'lms';

export interface SearchResultItem {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon?: Component;
}

export type GroupedSearchResults = Record<SearchResultKind, SearchResultItem[]>;
