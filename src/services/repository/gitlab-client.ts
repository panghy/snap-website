import type {
  Repository,
  RepositoryMetadata,
  GitLabProjectResponse,
  GitLabLanguagesResponse
} from '../../types/repository';
import { getAPIEndpoint } from '../../utils/url-parser';

export class GitLabClient {
  /**
   * Fetch metadata from GitLab API
   */
  async fetchMetadata(repository: Repository): Promise<RepositoryMetadata> {
    const projectUrl = getAPIEndpoint(repository.platform, repository.owner, repository.name);

    // Fetch project data
    const projectResponse = await fetch(projectUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    if (!projectResponse.ok) {
      if (projectResponse.status === 404) {
        throw new Error('Repository not found or private');
      }
      if (projectResponse.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`GitLab API error: ${projectResponse.status} ${projectResponse.statusText}`);
    }

    const projectData: GitLabProjectResponse = await projectResponse.json();

    // Fetch languages to determine primary language
    let primaryLanguage: string | undefined;
    try {
      const languagesUrl = `${projectUrl}/languages`;
      const languagesResponse = await fetch(languagesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (languagesResponse.ok) {
        const languages: GitLabLanguagesResponse = await languagesResponse.json();
        // Get the language with the highest percentage
        const sortedLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]);
        if (sortedLanguages.length > 0) {
          primaryLanguage = sortedLanguages[0][0];
        }
      }
    } catch {
      // Ignore language fetch errors, it's optional
    }

    const metadata = this.mapGitLabToMetadata(projectData, primaryLanguage);

    // Try to fetch latest release
    try {
      const releasesUrl = `${projectUrl}/releases`;
      const releasesResponse = await fetch(releasesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (releasesResponse.ok) {
        const releases = await releasesResponse.json();
        if (Array.isArray(releases) && releases.length > 0) {
          metadata.lastRelease = releases[0].tag_name;
        }
      }
    } catch {
      // Ignore release fetch errors
    }

    return metadata;
  }

  /**
   * Map GitLab API response to normalized metadata structure
   */
  mapGitLabToMetadata(
    data: GitLabProjectResponse,
    primaryLanguage?: string | null
  ): RepositoryMetadata {
    let description = data.description;

    // Handle null/undefined description
    if (description === null || description === undefined) {
      description = undefined;
    } else if (description.length > 500) {
      // Truncate long descriptions
      description = description.substring(0, 497) + '...';
    }

    // Handle null primary language
    const lang = primaryLanguage === null ? undefined : primaryLanguage;

    return {
      stars: data.star_count,
      description,
      primaryLanguage: lang,
      lastUpdated: data.last_activity_at,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      lastRelease: undefined // Will be populated by separate API call
    };
  }
}