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
import { useAllRepositoryMetadata } from '../../hooks/useAllRepositoryMetadata';
import styles from './CataloguePage.module.css';

interface CataloguePageProps {
  initialFilter?: { language?: string };
}

export const CataloguePage: React.FC<CataloguePageProps> = ({ initialFilter }) => {
  const [data, setData] = useState<CatalogueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  // Load catalogue data from public directory
  useEffect(() => {
    const loadCatalogueData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/data/snaps.json');
        if (!response.ok) {
          throw new Error(`Failed to load catalogue data: ${response.status}`);
        }
        const catalogueData = await response.json();
        setData(catalogueData);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load catalogue data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load catalogue data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalogueData();
  }, []);

  // Fetch all repository metadata
  const { metadata: repositoryMetadata, loading: isLoadingMetrics } = useAllRepositoryMetadata(data?.snaps || []);

  // Enrich SNAPs with fetched repository metadata
  const enrichedSnaps = useMemo(() => {
    if (!data?.snaps) return [];

    return data.snaps.map(snap => {
      const snapId = snap.id || snap.name;
      const metadata = repositoryMetadata.get(snapId);

      if (metadata) {
        return {
          ...snap,
          stars: metadata.stars ?? snap.stars,
          lastCommit: metadata.lastUpdated ?? snap.lastCommit,
          lastRelease: metadata.lastRelease ?? snap.lastRelease,
          license: metadata.license ?? snap.license,
          openIssues: metadata.openIssues ?? snap.openIssues,
        };
      }
      return snap;
    });
  }, [data, repositoryMetadata]);

  // Filter and sort SNAPs
  const filteredSnaps = useMemo(() => {
    const filtered = filterSnaps(enrichedSnaps, filters);
    return sortSnaps(filtered, sortState);
  }, [enrichedSnaps, filters, sortState]);

  // Filter specifications
  const filteredSpecs = useMemo(() => {
    if (!data?.specifications) return [];
    const filtered = filterSpecifications(data.specifications, filters.searchQuery);
    return sortSpecifications(filtered, sortState.direction);
  }, [data, filters.searchQuery, sortState.direction]);

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
      // Support both new language field and legacy languages array
      if ('language' in snap && snap.language) {
        languageCounts.set(snap.language, (languageCounts.get(snap.language) || 0) + 1);
      } else if ('languages' in snap && snap.languages) {
        snap.languages.forEach(lang => {
          languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
        });
      }
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
    const languages = [...new Set(enrichedSnaps
      .flatMap(s => {
        // Support both new language field and legacy languages array
        if ('language' in s && s.language) {
          return [s.language];
        } else if ('languages' in s && s.languages) {
          return s.languages;
        }
        return [];
      })
    )].sort();
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

  const handleViewModeToggle = () => {
    setFilters(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'snaps' ? 'specifications' : 'snaps',
    }));
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className={styles.cataloguePage}>
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (loadError || !data) {
    return (
      <div className={styles.cataloguePage}>
        <div className={styles.errorMessage}>
          <h2>Failed to Load Catalogue</h2>
          <p>{loadError || 'Unable to load catalogue data'}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

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
                    const [field, direction] = e.target.value.split('-') as [SortState['field'], SortState['direction']];
                    setSortState({ field, direction });
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

            {isLoadingMetrics && filters.viewMode === 'snaps' ? (
              <div className={styles.metricsLoading}>
                <LoadingSpinner />
                <span>Loading repository metrics...</span>
              </div>
            ) : (
              <div className={styles.catalogueGrid}>
                {filters.viewMode === 'snaps' ? (
                  filteredSnaps.map(snap => (
                  <SnapCard
                    key={snap.id || snap.name}
                    snap={snap}
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
                      snap.id && spec.implementations?.includes(snap.id)
                    )}
                  />
                ))
              )}
              </div>
            )}

            {!isLoadingMetrics && displayItems.length === 0 && (
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