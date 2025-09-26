import type {
  Repository,
  RepositoryMetadata,
  GitHubRepoResponse
} from '../../types/repository';
import { getAPIEndpoint } from '../../utils/url-parser';

export class GitHubClient {
  /**
   * Fetch metadata from GitHub API
   */
  async fetchMetadata(repository: Repository): Promise<RepositoryMetadata> {
    const apiUrl = getAPIEndpoint(repository.platform, repository.owner, repository.name);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found or private');
      }
      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
        throw new Error(
          `Rate limit exceeded${resetDate ? `. Resets at ${resetDate.toLocaleTimeString()}` : ''}`
        );
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: GitHubRepoResponse = await response.json();
    const metadata = this.mapGitHubToMetadata(data);

    // Try to fetch latest release
    try {
      const releaseUrl = `https://api.github.com/repos/${repository.owner}/${repository.name}/releases/latest`;
      const releaseResponse = await fetch(releaseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        mode: 'cors'
      });

      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        metadata.lastRelease = releaseData.tag_name;
      }
    } catch {
      // Ignore release fetch errors
    }

    return metadata;
  }

  /**
   * Map GitHub API response to normalized metadata structure
   */
  mapGitHubToMetadata(data: GitHubRepoResponse): RepositoryMetadata {
    let description = data.description;

    // Handle null/undefined description
    if (description === null || description === undefined) {
      description = undefined;
    } else if (description.length > 500) {
      // Truncate long descriptions
      description = description.substring(0, 497) + '...';
    }

    // Handle null language
    const primaryLanguage = data.language === null ? undefined : data.language;

    return {
      stars: data.stargazers_count,
      description,
      primaryLanguage,
      lastUpdated: data.updated_at,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      lastRelease: undefined, // Will be populated by separate API call
      license: data.license?.name
    };
  }
}