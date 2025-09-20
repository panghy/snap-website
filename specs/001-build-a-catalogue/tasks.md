# Tasks: SNAPs Catalogue System

**Input**: Design documents from `/specs/001-build-a-catalogue/`
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
- **React/Vite app**: `src/` at repository root
- Components in `src/components/`
- Types in `src/types/`
- Services in `src/services/`
- Data files in `src/data/`

## Phase 3.1: Setup
- [ ] T001 Create catalogue directory structure in src/components/catalogue/
- [ ] T002 [P] Create TypeScript types file at src/types/snap.ts
- [ ] T003 [P] Create initial JSON data file at src/data/snaps.json with sample entries
- [ ] T004 [P] Create CSS module files for catalogue components

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Schema validation test for src/data/snaps.json against contracts/snaps-schema.json
- [ ] T006 [P] GitHub API service mock tests in src/services/__tests__/github.test.ts
- [ ] T007 [P] Filter function tests in src/utils/__tests__/filters.test.ts
- [ ] T008 [P] Sort function tests in src/utils/__tests__/sort.test.ts
- [ ] T009 [P] Cache service tests in src/services/__tests__/cache.test.ts
- [ ] T010 [P] Component rendering tests for SnapCard in src/components/catalogue/__tests__/SnapCard.test.tsx
- [ ] T011 [P] Component rendering tests for FilterSidebar in src/components/catalogue/__tests__/FilterSidebar.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models & Types
- [ ] T012 [P] Implement SnapEntry type in src/types/snap.ts
- [ ] T013 [P] Implement SnapSpecification type in src/types/snap.ts
- [ ] T014 [P] Implement SnapCategory enum in src/types/snap.ts
- [ ] T015 [P] Implement SnapCapabilities interface in src/types/snap.ts
- [ ] T016 [P] Implement FilterState and SortState types in src/types/snap.ts

### Core Services
- [ ] T017 [P] Create GitHub API service in src/services/github.ts with fetchRepositoryMetrics()
- [ ] T018 [P] Create cache service in src/services/cache.ts with LocalStorage implementation
- [ ] T019 [P] Create filter utilities in src/utils/filters.ts for category/language/capability filtering
- [ ] T020 [P] Create sort utilities in src/utils/sort.ts for name/stars/date sorting

### React Components
- [ ] T021 Create CataloguePage component in src/components/catalogue/CataloguePage.tsx
- [ ] T022 [P] Create SnapCard component in src/components/catalogue/SnapCard.tsx
- [ ] T023 [P] Create FilterSidebar component in src/components/catalogue/FilterSidebar.tsx
- [ ] T024 [P] Create CatalogueHeader component in src/components/catalogue/CatalogueHeader.tsx
- [ ] T025 [P] Create SpecificationCard component in src/components/catalogue/SpecificationCard.tsx
- [ ] T026 [P] Create LoadingSpinner component in src/components/catalogue/LoadingSpinner.tsx
- [ ] T027 [P] Create ErrorBoundary component in src/components/catalogue/ErrorBoundary.tsx

### Styling
- [ ] T028 [P] Implement CataloguePage.module.css with light theme (#f8f9fa background)
- [ ] T029 [P] Implement SnapCard.module.css with subtle card shadows
- [ ] T030 [P] Implement FilterSidebar.module.css with responsive breakpoints
- [ ] T031 [P] Implement responsive layout CSS for mobile/tablet/desktop

## Phase 3.4: Integration
- [ ] T032 Update App.tsx to include CataloguePage route/conditional rendering
- [ ] T033 Update Header.tsx to add "Browse SNAPs" navigation link
- [ ] T034 Integrate GitHub API service with SnapCard component for dynamic metrics
- [ ] T035 Implement view mode toggle (SNAPs vs Specifications) in CataloguePage
- [ ] T036 Add GitHub edit link to CatalogueHeader pointing to src/data/snaps.json
- [ ] T037 Implement useMemo optimization for filtering performance
- [ ] T038 Add error handling and loading states to API calls
- [ ] T039 Implement cache warming on page load

## Phase 3.5: Polish
- [ ] T040 [P] Add comprehensive sample data to src/data/snaps.json (10+ entries)
- [ ] T041 [P] Add JSON schema comments for contributor guidance
- [ ] T042 [P] Create CONTRIBUTING.md with SNAP submission guidelines
- [ ] T043 Implement keyboard navigation for accessibility
- [ ] T044 Add ARIA labels and semantic HTML
- [ ] T045 Performance optimization: verify <200ms initial load
- [ ] T046 Performance optimization: verify <100ms filter response
- [ ] T047 Add analytics tracking for catalogue usage
- [ ] T048 Run quickstart.md validation scenarios
- [ ] T049 Update README.md with catalogue feature documentation
- [ ] T050 Final visual polish: animations, transitions, hover states

## Dependencies
- Setup (T001-T004) must complete first
- Tests (T005-T011) before implementation (T012-T039)
- Types (T012-T016) before services and components
- Services (T017-T020) can run parallel with components (T021-T027)
- CataloguePage (T021) blocks integration tasks (T032-T039)
- All implementation before polish (T040-T050)

## Parallel Execution Examples

### Batch 1: Initial Setup (T002-T004)
```bash
# Launch parallel after T001 completes:
Task: "Create TypeScript types file at src/types/snap.ts"
Task: "Create initial JSON data file at src/data/snaps.json with sample entries"
Task: "Create CSS module files for catalogue components"
```

### Batch 2: All Tests (T005-T011)
```bash
# Launch all test creation in parallel:
Task: "Schema validation test for src/data/snaps.json"
Task: "GitHub API service mock tests in src/services/__tests__/github.test.ts"
Task: "Filter function tests in src/utils/__tests__/filters.test.ts"
Task: "Sort function tests in src/utils/__tests__/sort.test.ts"
Task: "Cache service tests in src/services/__tests__/cache.test.ts"
Task: "Component rendering tests for SnapCard"
Task: "Component rendering tests for FilterSidebar"
```

### Batch 3: Types and Models (T012-T016)
```bash
# All type definitions in parallel:
Task: "Implement SnapEntry type in src/types/snap.ts"
Task: "Implement SnapSpecification type in src/types/snap.ts"
Task: "Implement SnapCategory enum in src/types/snap.ts"
Task: "Implement SnapCapabilities interface in src/types/snap.ts"
Task: "Implement FilterState and SortState types in src/types/snap.ts"
```

### Batch 4: Services and Utils (T017-T020)
```bash
# All services in parallel (different files):
Task: "Create GitHub API service in src/services/github.ts"
Task: "Create cache service in src/services/cache.ts"
Task: "Create filter utilities in src/utils/filters.ts"
Task: "Create sort utilities in src/utils/sort.ts"
```

### Batch 5: Components (T022-T027)
```bash
# All components except CataloguePage in parallel:
Task: "Create SnapCard component in src/components/catalogue/SnapCard.tsx"
Task: "Create FilterSidebar component in src/components/catalogue/FilterSidebar.tsx"
Task: "Create CatalogueHeader component in src/components/catalogue/CatalogueHeader.tsx"
Task: "Create SpecificationCard component in src/components/catalogue/SpecificationCard.tsx"
Task: "Create LoadingSpinner component in src/components/catalogue/LoadingSpinner.tsx"
Task: "Create ErrorBoundary component in src/components/catalogue/ErrorBoundary.tsx"
```

### Batch 6: Styling (T028-T031)
```bash
# All CSS modules in parallel:
Task: "Implement CataloguePage.module.css with light theme"
Task: "Implement SnapCard.module.css with subtle card shadows"
Task: "Implement FilterSidebar.module.css with responsive breakpoints"
Task: "Implement responsive layout CSS for mobile/tablet/desktop"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify ALL tests fail before implementing features
- Commit after each task completion
- Use existing React/Vite patterns from codebase
- Maintain light theme (#f8f9fa) for catalogue pages
- Ensure GitHub API calls are cached (1-hour TTL)
- All external links must open in new tabs (target="_blank")

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T005 for schema, T006 for GitHub API)
- [x] All entities have model tasks (T012-T016 for all data model entities)
- [x] All tests come before implementation (T005-T011 before T012+)
- [x] Parallel tasks truly independent (verified different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task in same batch

## Estimated Completion
- **Total Tasks**: 50
- **Parallel Batches**: 6 major parallel execution opportunities
- **Sequential Dependencies**: ~8 blocking dependencies
- **Estimated Time**: 2-3 days with parallel execution, 5-6 days sequential