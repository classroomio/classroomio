// src/lib/types.ts
export interface SearchFilters {
    referrer?: string;
    path?: string;
    // Add other filter keys as needed
}

export interface AnalyticsData {
    siteId: string;
    interval: string;
    filters: SearchFilters;
    sites: string[];
}

export interface SearchFilterBadgesProps {
    filters: SearchFilters;
    onFilterDelete: (key: keyof SearchFilters) => void;
}