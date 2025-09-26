import type { SnapEntry, SnapSpecification, SortState } from '../types/snap';

/**
 * Sort SNAPs based on selected field and direction
 */
export function sortSnaps(snaps: SnapEntry[], sortState: SortState): SnapEntry[] {
  const sorted = [...snaps].sort((a, b) => {
    let comparison = 0;

    switch (sortState.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;

      case 'stars':
        const aStars = a.stars ?? 0;
        const bStars = b.stars ?? 0;
        comparison = bStars - aStars; // Higher stars first by default
        // Use lastCommit as tiebreaker
        if (comparison === 0) {
          const aDate = a.lastCommit ? new Date(a.lastCommit).getTime() : 0;
          const bDate = b.lastCommit ? new Date(b.lastCommit).getTime() : 0;
          comparison = bDate - aDate; // More recent first
        }
        break;

      case 'lastCommit':
        const aDate = a.lastCommit ? new Date(a.lastCommit).getTime() : 0;
        const bDate = b.lastCommit ? new Date(b.lastCommit).getTime() : 0;
        comparison = bDate - aDate; // More recent first by default
        break;

      case 'category':
        comparison = a.category.localeCompare(b.category);
        if (comparison === 0) {
          // Secondary sort by name within category
          comparison = a.name.localeCompare(b.name);
        }
        break;

      default:
        comparison = 0;
    }

    // Apply direction
    if (sortState.direction === 'desc' && sortState.field !== 'stars' && sortState.field !== 'lastCommit') {
      comparison = -comparison;
    } else if (sortState.direction === 'asc' && (sortState.field === 'stars' || sortState.field === 'lastCommit')) {
      comparison = -comparison;
    }

    return comparison;
  });

  return sorted;
}

/**
 * Sort specifications alphabetically
 */
export function sortSpecifications(
  specifications: SnapSpecification[],
  direction: 'asc' | 'desc' = 'asc'
): SnapSpecification[] {
  return [...specifications].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get top SNAPs by stars
 */
export function getTopSnapsByStars(snaps: SnapEntry[], limit: number = 10): SnapEntry[] {
  return sortSnaps(snaps, { field: 'stars', direction: 'desc' }).slice(0, limit);
}

/**
 * Get recently updated SNAPs
 */
export function getRecentlyUpdatedSnaps(
  snaps: SnapEntry[],
  limit: number = 10
): SnapEntry[] {
  return sortSnaps(snaps, { field: 'lastCommit', direction: 'desc' }).slice(0, limit);
}

/**
 * Sort SNAPs by multiple criteria
 */
export function multiSort(
  snaps: SnapEntry[],
  criteria: Array<{ field: SortState['field']; direction: SortState['direction'] }>
): SnapEntry[] {
  return [...snaps].sort((a, b) => {
    for (const criterion of criteria) {
      const tempSort = sortSnaps([a, b], criterion);
      if (tempSort[0] === a && tempSort[1] === b) {
        return -1;
      } else if (tempSort[0] === b && tempSort[1] === a) {
        return 1;
      }
      // Continue to next criterion if equal
    }
    return 0;
  });
}

/**
 * Group and sort SNAPs for display
 */
export function groupAndSort(
  snaps: SnapEntry[],
  groupBy: 'category' | 'language',
  sortState: SortState
): Map<string, SnapEntry[]> {
  const grouped = new Map<string, SnapEntry[]>();

  snaps.forEach(snap => {
    const keys = groupBy === 'category'
      ? [snap.category]
      : (snap.language ? [snap.language] : []);

    keys.forEach(key => {
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(snap);
    });
  });

  // Sort within each group
  grouped.forEach((groupSnaps, key) => {
    grouped.set(key, sortSnaps(groupSnaps, sortState));
  });

  return grouped;
}

/**
 * Create a comparator function for custom sorting
 */
export function createComparator(sortState: SortState) {
  return (a: SnapEntry, b: SnapEntry): number => {
    const sorted = sortSnaps([a, b], sortState);
    return sorted[0] === a ? -1 : 1;
  };
}