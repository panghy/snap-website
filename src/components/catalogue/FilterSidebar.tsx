import type { FilterState, SnapCapabilities } from '../../types/snap';
import { SnapCategory } from '../../types/snap';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onViewModeToggle: () => void;
  availableLanguages: string[];
  availableCategories: SnapCategory[];
  availableCapabilities: Array<keyof SnapCapabilities>;
  categoryCounts: Map<string, number>;
  languageCounts: Map<string, number>;
  capabilityCounts: Map<string, number>;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onViewModeToggle,
  availableLanguages,
  availableCategories,
  availableCapabilities,
  categoryCounts,
  languageCounts,
  capabilityCounts,
}) => {
  const getCapabilityLabel = (key: keyof SnapCapabilities): string => {
    const labels: Record<keyof SnapCapabilities, string> = {
      otelMetrics: 'OpenTelemetry Metrics',
      otelTracing: 'OpenTelemetry Tracing',
      multiTenancy: 'Multi-Tenancy',
      encryption: 'Encryption',
      compression: 'Compression',
      streaming: 'Streaming',
      batchOperations: 'Batch Operations',
      asyncApi: 'Async API',
    };
    return labels[key] || key;
  };

  const getCategoryDisplayName = (category: string): string => {
    const displayNames: Record<string, string> = {
      queue: 'Task Queue',
      blobstore: 'Blob Store',
      search: 'Vector Search',
      graph: 'Graph Database',
      timeseries: 'Time Series',
      cache: 'Cache',
      pubsub: 'Pub/Sub',
      workflow: 'Workflow Engine',
      other: 'Other'
    };
    return displayNames[category] || category;
  };

  const handleCategoryToggle = (category: SnapCategory) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    onFilterChange({ selectedCategories: newCategories });
  };

  const handleLanguageToggle = (language: string) => {
    const newLanguages = filters.selectedLanguages.includes(language)
      ? filters.selectedLanguages.filter(l => l !== language)
      : [...filters.selectedLanguages, language];
    onFilterChange({ selectedLanguages: newLanguages });
  };

  const handleCapabilityToggle = (capability: keyof SnapCapabilities) => {
    const newCapabilities = filters.selectedCapabilities.includes(capability)
      ? filters.selectedCapabilities.filter(c => c !== capability)
      : [...filters.selectedCapabilities, capability];
    onFilterChange({ selectedCapabilities: newCapabilities });
  };

  const clearAllFilters = () => {
    onFilterChange({
      searchQuery: '',
      selectedCategories: [],
      selectedLanguages: [],
      selectedCapabilities: [],
      showArchived: false,
      showBeta: true,
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedCategories.length > 0 ||
    filters.selectedLanguages.length > 0 ||
    filters.selectedCapabilities.length > 0 ||
    filters.showArchived;

  return (
    <aside className={styles.filterSidebar}>
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleButton} ${filters.viewMode === 'snaps' ? styles.active : ''}`}
          onClick={() => filters.viewMode !== 'snaps' && onViewModeToggle()}
        >
          SNAPs
        </button>
        <button
          className={`${styles.toggleButton} ${filters.viewMode === 'specifications' ? styles.active : ''}`}
          onClick={() => filters.viewMode !== 'specifications' && onViewModeToggle()}
        >
          Specifications
        </button>
      </div>

      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search..."
          value={filters.searchQuery}
          onChange={e => onFilterChange({ searchQuery: e.target.value })}
          className={styles.searchInput}
        />
      </div>

      {filters.viewMode === 'snaps' && (
        <>
          <div className={styles.filterSection}>
            <h3>Categories</h3>
            <div className={styles.filterOptions}>
              {availableCategories.map(category => {
                const count = categoryCounts.get(category) || 0;
                const isDisabled = count === 0;
                return (
                  <label
                    key={category}
                    className={`${styles.filterOption} ${isDisabled ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCategories.includes(category)}
                      onChange={() => !isDisabled && handleCategoryToggle(category)}
                      disabled={isDisabled}
                    />
                    <span>
                      {getCategoryDisplayName(category)}
                      <span className={styles.count}>({count})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Languages</h3>
            <div className={styles.filterOptions}>
              {availableLanguages.map(language => {
                const count = languageCounts.get(language) || 0;
                const isDisabled = count === 0;
                return (
                  <label
                    key={language}
                    className={`${styles.filterOption} ${isDisabled ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedLanguages.includes(language)}
                      onChange={() => !isDisabled && handleLanguageToggle(language)}
                      disabled={isDisabled}
                    />
                    <span>
                      {language}
                      <span className={styles.count}>({count})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Capabilities</h3>
            <div className={styles.filterOptions}>
              {availableCapabilities.map(key => {
                const count = capabilityCounts.get(key) || 0;
                const isDisabled = count === 0;
                return (
                  <label
                    key={key}
                    className={`${styles.filterOption} ${isDisabled ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCapabilities.includes(key)}
                      onChange={() => !isDisabled && handleCapabilityToggle(key)}
                      disabled={isDisabled}
                    />
                    <span>
                      {getCapabilityLabel(key)}
                      <span className={styles.count}>({count})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterOption} style={{ marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                checked={filters.showBeta}
                onChange={e => onFilterChange({ showBeta: e.target.checked })}
              />
              <span>Show Beta SNAPs</span>
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                checked={filters.showArchived}
                onChange={e => onFilterChange({ showArchived: e.target.checked })}
              />
              <span>Show Archived</span>
            </label>
          </div>
        </>
      )}

      {hasActiveFilters && (
        <button onClick={clearAllFilters} className={styles.clearButton}>
          Clear All Filters
        </button>
      )}
    </aside>
  );
};