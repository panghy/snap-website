import { RepositoryPlatform } from '../types/repository';

/**
 * Validate GitLab repository URL
 */
export function validateGitLabURL(url: string): boolean {
  // GitLab requires at least 2 path segments (owner/repo or group/subgroup/repo)
  const gitlabPattern = /^https:\/\/gitlab\.com\/[\w\-.]+(?:\/[\w\-.]+)+$/;
  return gitlabPattern.test(url);
}

/**
 * Validate GitHub repository URL
 */
export function validateGitHubURL(url: string): boolean {
  const githubPattern = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+$/;
  return githubPattern.test(url);
}

/**
 * Detect platform from repository URL
 */
export function detectPlatform(url: string): RepositoryPlatform | null {
  if (url.startsWith('https://github.com/')) {
    return RepositoryPlatform.GITHUB;
  }
  if (url.startsWith('https://gitlab.com/')) {
    return RepositoryPlatform.GITLAB;
  }
  return null;
}

/**
 * Parse repository URL and extract platform, owner, and name
 */
export function parseRepositoryURL(url: string): {
  platform: RepositoryPlatform;
  owner: string;
  name: string;
} | null {
  const platform = detectPlatform(url);

  if (!platform) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.substring(1).split('/').filter(Boolean);

    if (platform === RepositoryPlatform.GITHUB) {
      if (pathParts.length !== 2) {
        return null;
      }
      return {
        platform,
        owner: pathParts[0],
        name: pathParts[1]
      };
    }

    if (platform === RepositoryPlatform.GITLAB) {
      if (pathParts.length < 2) {
        return null;
      }
      // GitLab supports nested groups, so the last part is the project name
      // Everything else is the owner/group path
      const name = pathParts[pathParts.length - 1];
      const owner = pathParts.slice(0, -1).join('/');

      return {
        platform,
        owner,
        name
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate any repository URL (GitHub or GitLab)
 */
export function validateRepositoryURL(url: string): boolean {
  return validateGitHubURL(url) || validateGitLabURL(url);
}

/**
 * Get API endpoint for repository
 */
export function getAPIEndpoint(platform: RepositoryPlatform, owner: string, name: string): string {
  if (platform === RepositoryPlatform.GITHUB) {
    return `https://api.github.com/repos/${owner}/${name}`;
  }

  if (platform === RepositoryPlatform.GITLAB) {
    // GitLab requires URL encoding for the project path
    const projectPath = `${owner}/${name}`;
    const encodedPath = encodeURIComponent(projectPath);
    return `https://gitlab.com/api/v4/projects/${encodedPath}`;
  }

  throw new Error(`Unsupported platform: ${platform}`);
}