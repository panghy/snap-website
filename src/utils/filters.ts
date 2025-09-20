import type { SnapEntry, SnapSpecification, FilterState, SnapCapabilities } from '../types/snap';

/**
 * Filter SNAPs based on search query and filters
 */
export function filterSnaps(
  snaps: SnapEntry[],
  filters: FilterState
): SnapEntry[] {
  return snaps.filter(snap => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        snap.name.toLowerCase().includes(query) ||
        snap.description.toLowerCase().includes(query) ||
        snap.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        snap.languages.some(lang => lang.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.selectedCategories.length > 0) {
      if (!filters.selectedCategories.includes(snap.category)) {
        return false;
      }
    }

    // Language filter
    if (filters.selectedLanguages.length > 0) {
      const hasLanguage = filters.selectedLanguages.some(lang =>
        snap.languages.includes(lang)
      );
      if (!hasLanguage) return false;
    }

    // Capabilities filter
    if (filters.selectedCapabilities.length > 0) {
      const hasAllCapabilities = filters.selectedCapabilities.every(cap => {
        return snap.capabilities?.[cap] === true;
      });
      if (!hasAllCapabilities) return false;
    }

    // Archived filter
    if (!filters.showArchived && snap.archived) {
      return false;
    }

    // Beta filter
    if (!filters.showBeta && snap.beta) {
      return false;
    }

    return true;
  });
}

/**
 * Filter specifications based on search query
 */
export function filterSpecifications(
  specifications: SnapSpecification[],
  searchQuery: string
): SnapSpecification[] {
  if (!searchQuery) return specifications;

  const query = searchQuery.toLowerCase();
  return specifications.filter(
    spec =>
      spec.name.toLowerCase().includes(query) ||
      spec.description.toLowerCase().includes(query)
  );
}

/**
 * Extract unique languages from SNAPs
 */
export function getUniqueLanguages(snaps: SnapEntry[]): string[] {
  const languages = new Set<string>();
  snaps.forEach(snap => {
    snap.languages.forEach(lang => languages.add(lang));
  });
  return Array.from(languages).sort();
}

/**
 * Extract unique capabilities from SNAPs
 */
export function getUniqueCapabilities(snaps: SnapEntry[]): (keyof SnapCapabilities)[] {
  const capabilities = new Set<keyof SnapCapabilities>();
  snaps.forEach(snap => {
    if (snap.capabilities) {
      Object.entries(snap.capabilities).forEach(([key, value]) => {
        if (value === true) {
          capabilities.add(key as keyof SnapCapabilities);
        }
      });
    }
  });
  return Array.from(capabilities).sort();
}

/**
 * Get SNAP counts by category
 */
export function getSnapCountsByCategory(
  snaps: SnapEntry[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  snaps.forEach(snap => {
    counts[snap.category] = (counts[snap.category] || 0) + 1;
  });
  return counts;
}

/**
 * Get SNAPs that implement a specific specification
 */
export function getSnapsBySpecification(
  snaps: SnapEntry[],
  specificationId: string
): SnapEntry[] {
  return snaps.filter(snap => snap.specificationId === specificationId);
}

/**
 * Check if a SNAP matches current time-based filters
 */
export function isSnapActive(
  snap: SnapEntry,
  daysThreshold: number = 365
): boolean {
  if (!snap.lastCommit) return true; // No data, assume active

  const lastCommitDate = new Date(snap.lastCommit);
  const now = new Date();
  const daysSinceCommit = (now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceCommit <= daysThreshold;
}

/**
 * Group SNAPs by category
 */
export function groupSnapsByCategory(
  snaps: SnapEntry[]
): Record<string, SnapEntry[]> {
  const grouped: Record<string, SnapEntry[]> = {};

  snaps.forEach(snap => {
    if (!grouped[snap.category]) {
      grouped[snap.category] = [];
    }
    grouped[snap.category].push(snap);
  });

  return grouped;
}

/**
 * Create a filter predicate for reusable filtering
 */
export function createFilterPredicate(filters: FilterState) {
  return (snap: SnapEntry): boolean => {
    const filtered = filterSnaps([snap], filters);
    return filtered.length > 0;
  };
}