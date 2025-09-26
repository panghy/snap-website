import { describe, it, expect } from 'vitest';
import { parseRepositoryURL, validateGitLabURL, validateGitHubURL, detectPlatform } from './url-parser';
import { RepositoryPlatform } from '../types/repository';

describe('URL Parser', () => {
  describe('GitLab URL validation', () => {
    it('should validate standard GitLab repository URLs', () => {
      expect(validateGitLabURL('https://gitlab.com/user/project')).toBe(true);
      expect(validateGitLabURL('https://gitlab.com/group/subgroup/project')).toBe(true);
    });

    it('should reject invalid GitLab URLs', () => {
      expect(validateGitLabURL('https://github.com/user/repo')).toBe(false);
      expect(validateGitLabURL('gitlab.com/user/repo')).toBe(false);
      expect(validateGitLabURL('https://gitlab.com/')).toBe(false);
      expect(validateGitLabURL('https://gitlab.com/user')).toBe(false);
    });

    it('should handle GitLab URLs with special characters', () => {
      expect(validateGitLabURL('https://gitlab.com/user-name/project-name')).toBe(true);
      expect(validateGitLabURL('https://gitlab.com/user.name/project.name')).toBe(true);
      expect(validateGitLabURL('https://gitlab.com/user_name/project_name')).toBe(true);
    });
  });

  describe('GitHub URL validation', () => {
    it('should validate standard GitHub repository URLs', () => {
      expect(validateGitHubURL('https://github.com/user/repo')).toBe(true);
      expect(validateGitHubURL('https://github.com/org/repo')).toBe(true);
    });

    it('should reject invalid GitHub URLs', () => {
      expect(validateGitHubURL('https://gitlab.com/user/repo')).toBe(false);
      expect(validateGitHubURL('github.com/user/repo')).toBe(false);
      expect(validateGitHubURL('https://github.com/')).toBe(false);
      expect(validateGitHubURL('https://github.com/user')).toBe(false);
    });

    it('should handle GitHub URLs with special characters', () => {
      expect(validateGitHubURL('https://github.com/user-name/repo-name')).toBe(true);
      expect(validateGitHubURL('https://github.com/user.name/repo.name')).toBe(true);
      expect(validateGitHubURL('https://github.com/user_name/repo_name')).toBe(true);
    });
  });

  describe('Platform detection', () => {
    it('should detect GitHub platform from URL', () => {
      expect(detectPlatform('https://github.com/user/repo')).toBe(RepositoryPlatform.GITHUB);
    });

    it('should detect GitLab platform from URL', () => {
      expect(detectPlatform('https://gitlab.com/user/repo')).toBe(RepositoryPlatform.GITLAB);
      expect(detectPlatform('https://gitlab.com/group/subgroup/project')).toBe(RepositoryPlatform.GITLAB);
    });

    it('should return null for unsupported platforms', () => {
      expect(detectPlatform('https://bitbucket.org/user/repo')).toBeNull();
      expect(detectPlatform('https://example.com/user/repo')).toBeNull();
    });
  });

  describe('Repository URL parsing', () => {
    it('should parse GitHub repository URLs', () => {
      const result = parseRepositoryURL('https://github.com/facebook/react');
      expect(result).toEqual({
        platform: RepositoryPlatform.GITHUB,
        owner: 'facebook',
        name: 'react'
      });
    });

    it('should parse GitLab repository URLs', () => {
      const result = parseRepositoryURL('https://gitlab.com/gitlab-org/gitlab');
      expect(result).toEqual({
        platform: RepositoryPlatform.GITLAB,
        owner: 'gitlab-org',
        name: 'gitlab'
      });
    });

    it('should parse GitLab group/subgroup repository URLs', () => {
      const result = parseRepositoryURL('https://gitlab.com/group/subgroup/project');
      expect(result).toEqual({
        platform: RepositoryPlatform.GITLAB,
        owner: 'group/subgroup',
        name: 'project'
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseRepositoryURL('not-a-url')).toBeNull();
      expect(parseRepositoryURL('https://example.com/user/repo')).toBeNull();
    });
  });
});