# Claude Code Context - SNAPs Website

## Project Overview
This is a React/TypeScript/Vite website for SNAPs (Subspace-Native Atomic Pieces) - a specification for composable FoundationDB layers.

## Recent Changes (2025-09-19)
- Added SNAPs catalogue feature (browse/filter SNAP components)
- Implemented light-theme catalogue page contrasting with dark landing
- Added GitHub API integration for real-time repository metrics

## Current Tech Stack
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2
- **Styling**: CSS Modules
- **State**: React hooks (useState, useMemo)

## Project Structure
```
src/
├── components/
│   ├── catalogue/        # Catalogue components (NEW)
│   │   ├── CataloguePage.tsx
│   │   ├── SnapCard.tsx
│   │   └── FilterSidebar.tsx
│   ├── HeroSection.tsx   # Landing page hero
│   ├── ProblemSection.tsx # Animated problem demo
│   ├── SnapSection.tsx   # SNAPs specification
│   └── SolutionSection.tsx # FoundationDB solution
├── data/
│   └── snaps.json        # Catalogue data (editable)
├── services/
│   └── github.ts         # GitHub API client
└── types/
    └── snap.ts           # TypeScript definitions
```

## Key Features

### SNAPs Catalogue
- **Data Source**: `src/data/snaps.json` - community-editable JSON
- **GitHub Integration**: Fetches stars, last commit, releases from GitHub API
- **Caching**: LocalStorage with 1-hour TTL to respect rate limits
- **Filtering**: Client-side by category, language, capabilities
- **Edit Flow**: Direct GitHub edit link for contributions

### Styling Patterns
- Dark theme for landing page (#0a0e1a background)
- Light theme for catalogue (#f8f9fa background)
- Purple accent colors (#667eea, #764ba2)
- CSS Modules for component isolation

## Common Tasks

### Add a new SNAP to catalogue
1. Edit `src/data/snaps.json`
2. Follow the JSON schema (see inline comments)
3. Submit PR with validation

### Update GitHub metrics cache
- Cache TTL: 1 hour
- Clear cache: `localStorage.clear()` in console
- Rate limit: 60 requests/hour (unauthenticated)

### Run locally
```bash
npm install
npm run dev     # Development server
npm run build   # Production build
npm run lint    # ESLint check
```

## Important Files
- `src/data/snaps.json` - Catalogue data
- `specs/001-build-a-catalogue/` - Feature specification
- `.specify/memory/constitution.md` - Project principles

## API Endpoints Used
- GitHub REST API v3: `https://api.github.com/repos/{owner}/{repo}`
- No authentication required (public repos only)
- Cached client-side to avoid rate limits

## Testing Approach
- Component testing for catalogue features
- JSON schema validation for data integrity
- Manual testing via quickstart guide

## Performance Targets
- Initial catalogue load: <200ms
- Filter operations: <100ms
- Support for 500+ SNAP entries

## Deployment
- Vercel recommended for static hosting
- Environment variables: None required (all client-side)
- Build command: `npm run build`
- Output directory: `dist/`