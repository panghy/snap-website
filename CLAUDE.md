# Claude Code Context - SNAP Website

## Tech Stack
- **Frontend**: React 19, TypeScript 5.x, Vite
- **Styling**: CSS Modules
- **Testing**: Vitest, React Testing Library
- **Data**: Static JSON files in public/data/
- **CI/CD**: GitHub Actions, Vercel deployment

## Project Structure
```
src/
├── components/
│   ├── catalogue/        # SNAP catalogue components
│   └── specification/    # Specification viewer
├── services/
│   └── repository/       # NEW: Repository abstraction
├── types/
│   └── repository.ts     # NEW: Repository types
└── utils/
    └── url-parser.ts     # NEW: URL validation

public/
├── data/
│   └── snaps.json       # SNAP catalogue data
└── docs/                # Specification content
```

## Recent Changes
1. **SNAP Specification Feature** - Interactive documentation system
2. **GitLab Support** (IN PROGRESS) - Adding GitLab.com repository support
3. **CI/CD Setup** - GitHub Actions workflows for testing and deployment

## Key Patterns
- **Repository Abstraction**: Unified interface for GitHub/GitLab
- **Runtime Fetching**: Metadata fetched on-demand (matching GitHub pattern)
- **React Hooks**: Custom hooks for data fetching with loading states
- **Platform Detection**: URL-based platform identification
- **Caching Strategy**: In-memory and localStorage with TTL
- **Graceful Degradation**: Show URLs even when metadata unavailable

## Testing Approach
- Unit tests for URL parsing and validation
- Integration tests for mixed platform display
- Mock API responses for runtime fetching
- Tests for React hooks and loading states
- Tests for cache layer with TTL
- Visual regression tests for platform indicators

## Current Task Focus
Implementing GitLab repository support with the same metadata fields as GitHub:
- stars, description, language, last updated, forks, issues, default branch
- No authentication required (public APIs only)
- Runtime metadata fetching with CORS handling
- React hooks for data fetching (useRepositoryMetadata)
- Loading states and skeleton loaders
- Platform-specific visual indicators

## Performance Considerations
- Runtime fetching with client-side caching
- In-memory cache with 5-minute TTL
- localStorage for persistent cache across sessions
- Stale-while-revalidate pattern for better UX
- Rate limit handling with exponential backoff
- Lazy loading for images and heavy components

## Important Files
- `public/data/snaps.json` - SNAP catalogue data
- `src/components/catalogue/CataloguePage.tsx` - Main catalogue component
- `src/types/repository.ts` - Repository type definitions (NEW)
- `src/services/repository/` - Repository service abstraction (NEW)
- `src/hooks/useRepositoryMetadata.ts` - React hook for fetching (NEW)
- `src/services/repository/cache.ts` - Caching layer with TTL (NEW)

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

## GitLab API Integration
- **Endpoint**: `https://gitlab.com/api/v4/projects/:id`
- **No auth required** for public repos
- **Rate limit**: 300 req/min unauthenticated
- **CORS**: GitLab API supports CORS for public endpoints
- **Runtime fetching**: Client-side API calls with loading states
- **Field mappings**: star_count→stars, web_url→html_url
- **Languages endpoint**: Secondary call for primary language

## New Components & Hooks
- **useRepositoryMetadata**: React hook for runtime fetching
- **PlatformIcon**: Visual indicator for GitHub/GitLab
- **LoadingSkeleton**: Skeleton loader during fetch
- **Repository Service**: Abstraction for both platforms
- **Cache Service**: TTL-based caching layer

---
*Updated for runtime fetching approach - specs/003-add-support-for/*