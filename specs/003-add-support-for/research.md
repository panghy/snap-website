# Research: GitLab.com Repository Support

## GitLab API Research

### Decision: GitLab REST API v4
**Rationale**: GitLab provides a comprehensive REST API v4 that allows public access to project information without authentication for public repositories.
**Alternatives considered**:
- GraphQL API - More complex, requires different client setup
- Web scraping - Unreliable, against ToS

### Public Project Endpoint
- **Endpoint**: `GET https://gitlab.com/api/v4/projects/:id`
- **Project ID**: URL-encoded path (e.g., `gitlab-org%2Fgitlab` for gitlab.com/gitlab-org/gitlab)
- **No authentication required** for public projects
- **Rate limits**: 300 requests per minute for unauthenticated requests

### Field Mappings: GitLab → GitHub Equivalents

| GitHub Field | GitLab Field | Notes |
|-------------|--------------|-------|
| `stargazers_count` | `star_count` | Direct equivalent |
| `description` | `description` | Direct equivalent |
| `language` | N/A | GitLab uses `languages` API separately |
| `updated_at` | `last_activity_at` | Similar purpose |
| `forks_count` | `forks_count` | Direct equivalent |
| `open_issues_count` | `open_issues_count` | Direct equivalent |
| `default_branch` | `default_branch` | Direct equivalent |
| `html_url` | `web_url` | Repository web URL |
| `name` | `name` | Project name |
| `full_name` | `path_with_namespace` | Full path |

### Languages API (Additional Call)
- **Endpoint**: `GET https://gitlab.com/api/v4/projects/:id/languages`
- Returns percentage breakdown of languages
- Primary language = highest percentage

## GitLab URL Patterns

### Standard Repository URLs
1. **User/Personal Projects**: `https://gitlab.com/username/project-name`
2. **Group Projects**: `https://gitlab.com/group/subgroup/project-name`
3. **Self-hosted**: Not supported (gitlab.com only per requirements)

### URL Validation Pattern
```regex
^https?:\/\/gitlab\.com\/[\w\-\.]+(?:\/[\w\-\.]+)*$
```

### URL to API ID Conversion
- Take path after `gitlab.com/`
- URL encode the full path
- Example: `gitlab.com/gitlab-org/gitlab` → `gitlab-org%2Fgitlab`

## Current GitHub Implementation Analysis

### Current Structure (from codebase inspection)
- SNAPs data stored in `public/data/snaps.json`
- Repository URLs stored directly in JSON
- GitHub metadata fetched at runtime (pattern to follow)
- Repository links are simple anchor tags to external URLs

### Implementation Pattern
Following the existing GitHub pattern:
1. Runtime client-side fetching with loading states
2. CORS handling for cross-origin API requests
3. Graceful degradation when API unavailable

**Decision**: Runtime fetching (matching GitHub pattern)
**Rationale**:
- Consistency with existing GitHub implementation
- Real-time data freshness
- No build process dependencies
- Dynamic updates without rebuild
- User expects similar behavior for both platforms

## Error Handling Patterns

### API Failure Scenarios
1. **404 Not Found**: Repository doesn't exist or is private
   - Show repository URL without metadata
2. **Rate Limited (429)**: Too many requests
   - Use cached/static data if available
   - Show degraded experience
3. **Network Error**: GitLab unreachable
   - Fallback to URL-only display
4. **Invalid URL Format**: Malformed GitLab URL
   - Validation error in data entry

## Security Considerations

### No Authentication Required
- Only public repository data
- No API tokens in client code
- No user-specific data access

### CORS Considerations
- GitLab API supports CORS for public endpoints
- Direct browser calls supported for public repos
- May need proxy for certain edge cases

## Performance Considerations

### Caching Strategy
- Runtime: In-memory cache with TTL (5 minutes)
- LocalStorage for persistent cache across sessions
- Stale-while-revalidate pattern for better UX

### Rate Limiting
- 300 requests/minute unauthenticated
- ~5-10 SNAPs currently = well within limits
- Client-side rate limit handling with exponential backoff
- Future scale: May need request batching for >100 SNAPs

## Implementation Recommendations

1. **Abstract Repository Service**: Create service layer that handles both GitHub and GitLab
2. **URL Parser Utility**: Unified parser that identifies platform and extracts repo path
3. **React Hooks**: Custom hooks for runtime data fetching with loading states
4. **Cache Layer**: In-memory and localStorage caching with TTL
5. **Fallback UI**: Design degraded state for when metadata unavailable
6. **Platform Indicators**: Visual indicators (icons) for GitHub vs GitLab
7. **Loading States**: Skeleton loaders for metadata being fetched

## Next Steps
- Create TypeScript interfaces for repository abstraction
- Design unified repository metadata type
- Implement platform detection from URL
- Create React hooks for runtime fetching
- Implement caching strategy with TTL