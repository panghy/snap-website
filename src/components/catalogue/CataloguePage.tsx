import { useState, useEffect, useMemo } from 'react';
import { FilterSidebar } from './FilterSidebar';
import { SnapCard } from './SnapCard';
import { SpecificationCard } from './SpecificationCard';
import { CatalogueHeader } from './CatalogueHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';
import type {
  CatalogueData,
  FilterState,
  SortState,
  SnapCapabilities,
} from '../../types/snap';
import { SnapCategory } from '../../types/snap';
import { filterSnaps, filterSpecifications } from '../../utils/filters';
import { sortSnaps, sortSpecifications } from '../../utils/sort';
import { GitHubService } from '../../services/github';
import catalogueData from '../../data/snaps.json';
import styles from './CataloguePage.module.css';

interface CataloguePageProps {
  initialFilter?: { language?: string };
}

export const CataloguePage: React.FC<CataloguePageProps> = ({ initialFilter }) => {
  const [data] = useState<CatalogueData>(catalogueData as CatalogueData);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategories: [],
    selectedLanguages: initialFilter?.language ? [initialFilter.language] : [],
    selectedCapabilities: [],
    showArchived: false,
    showBeta: true,
    viewMode: 'snaps',
  });
  const [sortState, setSortState] = useState<SortState>({
    field: 'stars',
    direction: 'desc',
  });
  const [githubMetrics, setGithubMetrics] = useState<Map<string, any>>(new Map());
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Fetch GitHub metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoadingMetrics(true);
      const urls = data.snaps.map(snap => snap.repository);
      const metrics = await GitHubService.fetchBatchMetrics(urls);
      setGithubMetrics(metrics);
      setIsLoadingMetrics(false);
    };

    fetchMetrics();
  }, [data.snaps]);

  // Enrich SNAPs with GitHub metrics
  const enrichedSnaps = useMemo(() => {
    return data.snaps.map(snap => {
      const metrics = githubMetrics.get(snap.repository);
      if (metrics) {
        return {
          ...snap,
          stars: metrics.stars,
          lastCommit: metrics.lastCommit,
          lastRelease: metrics.lastRelease,
          openIssues: metrics.openIssues,
        };
      }
      return snap;
    });
  }, [data.snaps, githubMetrics]);

  // Filter and sort SNAPs
  const filteredSnaps = useMemo(() => {
    const filtered = filterSnaps(enrichedSnaps, filters);
    return sortSnaps(filtered, sortState);
  }, [enrichedSnaps, filters, sortState]);

  // Filter specifications
  const filteredSpecs = useMemo(() => {
    const filtered = filterSpecifications(data.specifications, filters.searchQuery);
    return sortSpecifications(filtered, sortState.direction);
  }, [data.specifications, filters.searchQuery, sortState.direction]);

  // Get items to display based on view mode
  const displayItems = filters.viewMode === 'snaps' ? filteredSnaps : filteredSpecs;

  // Calculate available options and counts
  const filterCounts = useMemo(() => {
    // Helper to check if a SNAP would pass current filters except for a specific filter type
    const getFilterableSnaps = (excludeFilterType?: 'categories' | 'languages' | 'capabilities') => {
      const tempFilters: FilterState = {
        ...filters,
        selectedCategories: excludeFilterType === 'categories' ? [] : filters.selectedCategories,
        selectedLanguages: excludeFilterType === 'languages' ? [] : filters.selectedLanguages,
        selectedCapabilities: excludeFilterType === 'capabilities' ? [] : filters.selectedCapabilities,
      };
      return filterSnaps(enrichedSnaps, tempFilters);
    };

    const categoryCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    const capabilityCounts = new Map<string, number>();

    // Calculate counts for each filter type
    const snapsForCategories = getFilterableSnaps('categories');
    const snapsForLanguages = getFilterableSnaps('languages');
    const snapsForCapabilities = getFilterableSnaps('capabilities');

    // Count categories
    snapsForCategories.forEach(snap => {
      categoryCounts.set(snap.category, (categoryCounts.get(snap.category) || 0) + 1);
    });

    // Count languages
    snapsForLanguages.forEach(snap => {
      snap.languages.forEach(lang => {
        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
      });
    });

    // Count capabilities
    snapsForCapabilities.forEach(snap => {
      if (snap.capabilities) {
        Object.entries(snap.capabilities).forEach(([key, value]) => {
          if (value) {
            capabilityCounts.set(key, (capabilityCounts.get(key) || 0) + 1);
          }
        });
      }
    });

    return { categoryCounts, languageCounts, capabilityCounts };
  }, [enrichedSnaps, filters]);

  // Get available options (only those that exist in the data)
  const availableFilters = useMemo(() => {
    const categories = [...new Set(enrichedSnaps.map(s => s.category))] as SnapCategory[];
    const languages = [...new Set(enrichedSnaps.flatMap(s => s.languages))].sort();
    const capabilities = [...new Set(
      enrichedSnaps.flatMap(s =>
        s.capabilities
          ? Object.entries(s.capabilities).filter(([_, v]) => v).map(([k]) => k)
          : []
      )
    )] as Array<keyof SnapCapabilities>;

    return { categories, languages, capabilities };
  }, [enrichedSnaps]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (field: SortState['field']) => {
    setSortState(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleViewModeToggle = () => {
    setFilters(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'snaps' ? 'specifications' : 'snaps',
    }));
  };

  return (
    <ErrorBoundary>
      <div className={styles.cataloguePage}>
        <CatalogueHeader
          totalSnaps={data.snaps.length}
          totalSpecs={data.specifications.length}
        />

        <div className={styles.catalogueContent}>
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onViewModeToggle={handleViewModeToggle}
            availableLanguages={availableFilters.languages}
            availableCategories={availableFilters.categories}
            availableCapabilities={availableFilters.capabilities}
            categoryCounts={filterCounts.categoryCounts}
            languageCounts={filterCounts.languageCounts}
            capabilityCounts={filterCounts.capabilityCounts}
          />

          <div className={styles.catalogueMain}>
            <div className={styles.catalogueControls}>
              <div className={styles.resultCount}>
                {displayItems.length} {filters.viewMode === 'snaps' ? 'SNAPs' : 'Specifications'} found
              </div>
              <div className={styles.sortControls}>
                <label>Sort by:</label>
                <select
                  value={`${sortState.field}-${sortState.direction}`}
                  onChange={e => {
                    const [field] = e.target.value.split('-') as [SortState['field']];
                    handleSortChange(field);
                  }}
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  {filters.viewMode === 'snaps' && (
                    <>
                      <option value="stars-desc">Most Stars</option>
                      <option value="lastCommit-desc">Recently Updated</option>
                      <option value="category-asc">Category</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {isLoadingMetrics && filters.viewMode === 'snaps' && (
              <div className={styles.metricsLoading}>
                <LoadingSpinner />
                <span>Loading GitHub metrics...</span>
              </div>
            )}

            <div className={styles.catalogueGrid}>
              {filters.viewMode === 'snaps' ? (
                filteredSnaps.map(snap => (
                  <SnapCard
                    key={snap.id}
                    snap={snap}
                    specification={data.specifications.find(
                      spec => spec.id === snap.specificationId
                    )}
                    isLoadingMetrics={isLoadingMetrics}
                    onLanguageClick={(language) => {
                      setFilters(prev => ({
                        ...prev,
                        selectedLanguages: prev.selectedLanguages.includes(language)
                          ? prev.selectedLanguages.filter(l => l !== language)
                          : [...prev.selectedLanguages, language]
                      }));
                    }}
                    onCapabilityClick={(capability) => {
                      setFilters(prev => ({
                        ...prev,
                        selectedCapabilities: prev.selectedCapabilities.includes(capability as keyof SnapCapabilities)
                          ? prev.selectedCapabilities.filter(c => c !== capability)
                          : [...prev.selectedCapabilities, capability as keyof SnapCapabilities]
                      }));
                    }}
                  />
                ))
              ) : (
                filteredSpecs.map(spec => (
                  <SpecificationCard
                    key={spec.id}
                    specification={spec}
                    implementations={enrichedSnaps.filter(snap =>
                      spec.implementations?.includes(snap.id)
                    )}
                  />
                ))
              )}
            </div>

            {displayItems.length === 0 && (
              <div className={styles.noResults}>
                <p>No {filters.viewMode === 'snaps' ? 'SNAPs' : 'specifications'} found.</p>
                <p>Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};