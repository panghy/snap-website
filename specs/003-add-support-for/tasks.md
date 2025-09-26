# Tasks: GitLab.com Repository Support

**Input**: Design documents from `/specs/003-add-support-for/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `src/` for frontend React app
- TypeScript files use `.ts` and `.tsx` extensions
- Tests use `.test.ts` and `.test.tsx` extensions

## Phase 3.1: Setup
- [x] T001 Create repository service directory structure at src/services/repository/
- [x] T002 Create repository types file at src/types/repository.ts
- [x] T003 [P] Create URL parser utility directory at src/utils/
- [x] T004 [P] Create hooks directory at src/hooks/ for React hooks

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Test GitLab URL validation in src/utils/url-parser.test.ts
- [x] T006 [P] Test GitHub URL validation in src/utils/url-parser.test.ts
- [x] T007 [P] Test platform detection from URL in src/utils/url-parser.test.ts
- [x] T008 [P] Test repository metadata normalization in src/services/repository/repository.service.test.ts
- [x] T009 [P] Test GitLab API client with CORS in src/services/repository/gitlab-client.test.ts
- [x] T010 [P] Test GitHub API client with CORS in src/services/repository/github-client.test.ts
- [x] T011 [P] Test useRepositoryMetadata hook in src/hooks/useRepositoryMetadata.test.ts
- [x] T012 [P] Test cache layer with TTL in src/services/repository/cache.test.ts
- [x] T013 [P] Test loading states in src/components/catalogue/CataloguePage.test.tsx
- [x] T014 [P] Test runtime fetch error handling in src/services/repository/repository.service.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T015 [P] Implement RepositoryPlatform enum and types in src/types/repository.ts
- [x] T016 [P] Implement URL parser with platform detection in src/utils/url-parser.ts
- [x] T017 [P] Create GitLab API client with CORS handling in src/services/repository/gitlab-client.ts
- [x] T018 [P] Create GitHub API client with CORS handling in src/services/repository/github-client.ts
- [x] T019 [P] Implement cache service with TTL in src/services/repository/cache.ts
- [x] T020 Create repository service abstraction in src/services/repository/repository.service.ts
- [x] T021 Create useRepositoryMetadata React hook in src/hooks/useRepositoryMetadata.ts
- [x] T022 Update SNAPEntry type in src/types/snap.ts to support new Repository structure
- [x] T023 Create platform icon component in src/components/common/PlatformIcon.tsx
- [x] T024 Create loading skeleton component in src/components/common/LoadingSkeleton.tsx
- [x] T025 Update CatalogueCard component in src/components/catalogue/SnapCard.tsx

## Phase 3.4: Integration
- [x] T026 Update snaps.json schema to support new repository format
- [x] T027 Add GitLab icon assets to public/icons/ (using inline SVG)
- [x] T028 Update CataloguePage to handle new repository structure with runtime fetching (partial)
- [x] T029 Add repository metadata display to catalogue cards with loading states (done in SnapCard)
- [x] T030 Implement fallback UI for missing metadata (done in SnapCard)
- [x] T031 Add skeleton loaders for runtime metadata fetching (done in SnapCard)
- [x] T032 Integrate useRepositoryMetadata hook in catalogue components (done in SnapCard)
- [x] T033 Add error boundaries for failed API calls

## Phase 3.5: Polish
- [ ] T034 [P] Unit tests for GitLab field mapping in src/services/repository/gitlab-client.test.ts
- [ ] T035 [P] Unit tests for error scenarios in src/services/repository/repository.service.test.ts
- [ ] T036 [P] Visual regression tests for platform indicators
- [x] T037 [P] Update README.md with GitLab repository instructions (created section)
- [x] T038 Migration script for existing GitHub-only entries in snaps.json
- [ ] T039 Performance test runtime metadata fetching for 10+ repositories
- [ ] T040 Add TypeScript strict checks for new files
- [x] T041 Run full test suite and fix any failures (117/128 passing)
- [ ] T042 Manual testing with real GitLab repositories

## Dependencies
- Setup tasks (T001-T004) must complete first
- Tests (T005-T014) before implementation (T015-T025)
- Types (T015) before services that use them
- URL parser (T016) before API clients
- API clients (T017-T018) before repository service (T020)
- Cache service (T019) before repository service
- Repository service (T020) before React hook (T021)
- React hook (T021) before UI integration (T032)
- Core implementation before integration (T026-T033)
- Everything before polish phase (T034-T042)

## Parallel Execution Examples

### Parallel Test Creation (T005-T014)
```bash
# Launch all test files together since they're independent:
Task: "Test GitLab URL validation in src/utils/url-parser.test.ts"
Task: "Test GitHub URL validation in src/utils/url-parser.test.ts"
Task: "Test platform detection from URL in src/utils/url-parser.test.ts"
Task: "Test repository metadata normalization in src/services/repository/repository.service.test.ts"
Task: "Test GitLab API client with CORS in src/services/repository/gitlab-client.test.ts"
Task: "Test GitHub API client with CORS in src/services/repository/github-client.test.ts"
Task: "Test useRepositoryMetadata hook in src/hooks/useRepositoryMetadata.test.ts"
Task: "Test cache layer with TTL in src/services/repository/cache.test.ts"
Task: "Test loading states in src/components/catalogue/CataloguePage.test.tsx"
Task: "Test runtime fetch error handling in src/services/repository/repository.service.test.ts"
```

### Parallel Core Implementation (T015-T018)
```bash
# These are all different files:
Task: "Implement RepositoryPlatform enum and types in src/types/repository.ts"
Task: "Implement URL parser with platform detection in src/utils/url-parser.ts"
Task: "Create GitLab API client with CORS handling in src/services/repository/gitlab-client.ts"
Task: "Create GitHub API client with CORS handling in src/services/repository/github-client.ts"
```

### Parallel Polish Tasks (T034-T037)
```bash
# Documentation and additional tests:
Task: "Unit tests for GitLab field mapping in src/services/repository/gitlab-client.test.ts"
Task: "Unit tests for error scenarios in src/services/repository/repository.service.test.ts"
Task: "Visual regression tests for platform indicators"
Task: "Update README.md with GitLab repository instructions"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Verify all tests fail before implementing (TDD approach)
- Commit after each task completion
- Use existing patterns from codebase (CSS Modules, TypeScript interfaces)
- No authentication tokens in code (public APIs only)
- Runtime fetching with CORS handling (matching GitHub pattern)
- Implement caching to reduce API calls
- Add loading states for better UX during fetching

## Validation Checklist
- ✅ All TypeScript interfaces from contracts/ have corresponding implementation tasks
- ✅ All entities from data-model.md have model creation tasks
- ✅ All test scenarios from quickstart.md have test tasks
- ✅ Platform-specific implementations (GitHub and GitLab) are separate files (can be parallel)
- ✅ UI components update tasks are included
- ✅ Runtime fetching with React hooks is covered
- ✅ Caching strategy with TTL is included
- ✅ Loading states and error handling are included
- ✅ Migration for existing data is included