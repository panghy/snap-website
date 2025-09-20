# Research Findings: SNAPs Catalogue System

## GitHub API Integration

### Decision: GitHub REST API v3 with client-side caching
**Rationale**:
- REST API v3 is simpler and sufficient for repository metadata needs
- No authentication required for public repository data
- Client-side caching mitigates rate limit concerns

**Alternatives considered**:
- GraphQL API v4: More complex, requires authentication even for public data
- Server-side proxy: Adds infrastructure complexity, not needed for MVP

**Implementation notes**:
- Endpoint: `https://api.github.com/repos/{owner}/{repo}`
- Rate limit: 60 requests/hour for unauthenticated
- Cache strategy: LocalStorage with 1-hour TTL
- Fields needed: stargazers_count, updated_at, default_branch, releases

## Client-Side Filtering Performance

### Decision: In-memory filtering with React useMemo
**Rationale**:
- 100-500 items can be filtered instantly in-memory
- No need for virtualization at this scale
- useMemo prevents unnecessary re-computations

**Alternatives considered**:
- Virtual scrolling: Overkill for <500 items
- IndexedDB: Unnecessary complexity for static JSON data
- Web Workers: Not needed for simple filter operations

**Performance targets**:
- Filter response: <16ms (single frame)
- Initial render: <100ms for 100 items
- Memory usage: ~500KB for 500 SNAPs

## JSON Schema Design

### Decision: Flat structure with enums for controlled vocabularies
**Rationale**:
- Easy for contributors to edit manually
- Git diff-friendly for PR reviews
- TypeScript can generate types from schema

**Schema structure**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "snaps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "description", "category", "repository"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "category": { "enum": ["queue", "blobstore", "search", "graph", "timeseries", "other"] },
          "repository": { "type": "string", "format": "uri" },
          "specificationRepository": { "type": "string", "format": "uri" },
          "languages": { "type": "array", "items": { "type": "string" } },
          "capabilities": {
            "type": "object",
            "properties": {
              "otelMetrics": { "type": "boolean" },
              "otelTracing": { "type": "boolean" },
              "multiTenancy": { "type": "boolean" }
            }
          },
          "platforms": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "version": { "type": "string" }
              }
            }
          },
          "specificationVersion": { "type": "string" },
          "maintainers": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "specifications": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "description", "repository"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "repository": { "type": "string", "format": "uri" },
          "implementations": {
            "type": "array",
            "items": { "type": "string", "description": "Reference to SNAP id" }
          }
        }
      }
    }
  }
}
```

**Alternatives considered**:
- Nested structure: Harder to edit manually
- Separate files per SNAP: Too many files to manage
- YAML: Less familiar to web developers

## React Router Integration

### Decision: No React Router needed - single component integration
**Rationale**:
- Existing site doesn't use React Router
- Catalogue can be a component rendered conditionally
- Simpler integration with existing navigation

**Alternatives considered**:
- React Router v6: Would require refactoring entire app
- Hash routing: Breaks existing URL structure
- Manual URL handling: Unnecessary complexity

**Implementation approach**:
- Add catalogue link to existing Header component
- Conditionally render CataloguePage component in App.tsx
- Use React state for view management (SNAPs vs Specifications)

## Styling Approach

### Decision: CSS modules matching existing patterns
**Rationale**:
- Existing site uses CSS modules
- Maintains consistency with current codebase
- No new build tool configuration needed

**Design decisions**:
- Light background: #f8f9fa (contrast with dark landing)
- Card shadows: subtle box-shadow for depth
- Purple accent colors matching existing theme
- Responsive breakpoints: 768px (tablet), 1024px (desktop)

## Edit Workflow

### Decision: Direct GitHub web editor link
**Rationale**:
- Lowest barrier to contribution
- GitHub handles authentication and permissions
- PR creation built into GitHub UI

**Implementation**:
- Edit button links to: `https://github.com/{owner}/{repo}/edit/main/src/data/snaps.json`
- Instructions in JSON comments
- Contribution guide linked from catalogue header

## Data Refresh Strategy

### Decision: Build-time static + runtime GitHub API
**Rationale**:
- Static JSON ensures catalogue always loads
- Runtime API calls for fresh metrics
- Graceful degradation if API fails

**Implementation**:
- Static: name, description, capabilities (from JSON)
- Dynamic: stars, last commit, release info (from API)
- Loading states for dynamic data
- Error boundaries for API failures

## Clarifications Resolved

All NEEDS CLARIFICATION items from the spec have been addressed:

1. **Default sort order**: By name alphabetically, with option to sort by stars or last update
2. **Filter categories**: Language, Category, Capabilities (with multi-select)
3. **Stale SNAPs handling**: Show "last updated" badge, allow filtering by activity
4. **Validation rules**: JSON schema validation on build, PR checks for required fields
5. **Refresh frequency**: On page load with 1-hour cache

## Next Steps

With research complete, we can proceed to Phase 1 (Design & Contracts) with confidence in our technical approach. All unknowns have been resolved and implementation patterns identified.