# Tasks: Add Formal SNAP Specification

**Input**: Design documents from `/specs/002-add-formal-snap/`
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
- **React app**: `src/` at repository root
- TypeScript interfaces in `src/types/`
- Services in `src/services/`
- Components in `src/components/specification/`
- Markdown content in `docs/specification/`

## Phase 3.1: Setup
- [x] T001 Install markdown rendering dependencies: `npm install react-markdown remark-gfm react-syntax-highlighter gray-matter @types/react-syntax-highlighter`
- [x] T002 Create specification directory structure: `mkdir -p docs/specification/{00-overview,01-core-concepts,02-requirements,03-examples}`
- [x] T003 [P] Create TypeScript interfaces in `src/types/specification.ts` from contracts/specification-api.ts
- [x] T004 [P] Create initial metadata.json in `docs/specification/metadata.json` with version 0.1.0

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### Contract Tests
- [x] T005 [P] Create test file `src/services/__tests__/specification.test.ts` for SpecificationService contract
- [x] T006 [P] Create test file `src/components/specification/__tests__/SpecificationPage.test.tsx` for page component
- [x] T007 [P] Create test file `src/components/specification/__tests__/TOCSidebar.test.tsx` for TOC component
- [x] T008 [P] Create test file `src/components/specification/__tests__/MarkdownRenderer.test.tsx` for markdown renderer

### Integration Tests
- [x] T009 [P] Create integration test `src/components/specification/__tests__/specification.integration.test.tsx` for basic functionality scenario
- [x] T010 [P] Create integration test for mobile responsiveness scenario
- [x] T011 [P] Create integration test for navigation scenario (TOC clicks, smooth scrolling)
- [x] T012 [P] Create integration test for markdown rendering scenario (headings, code blocks, links)

## Phase 3.3: Core Implementation

### Data Models & Types
- [x] T013 Implement SpecificationDocument type in `src/types/specification.ts`
- [x] T014 Implement Heading type in `src/types/specification.ts`
- [x] T015 Implement SpecificationSection type in `src/types/specification.ts`
- [x] T016 Implement TableOfContents type in `src/types/specification.ts`
- [x] T017 Implement SpecificationMetadata type in `src/types/specification.ts`

### Services
- [x] T018 Create SpecificationService class in `src/services/specification.ts` with loadSpecification method
- [x] T019 Implement loadDocument method in SpecificationService for fetching markdown files
- [x] T020 Implement parseDocument method using gray-matter for frontmatter extraction
- [x] T021 Implement extractHeadings method to parse markdown AST for TOC generation
- [x] T022 Implement buildTableOfContents method to construct navigation structure

### Components
- [x] T023 Create SpecificationPage component in `src/components/specification/SpecificationPage.tsx`
- [x] T024 Create TOCSidebar component in `src/components/specification/TOCSidebar.tsx` with collapsible sections
- [x] T025 Create MarkdownRenderer component in `src/components/specification/MarkdownRenderer.tsx` with react-markdown
- [x] T026 Create SpecificationHeader component in `src/components/specification/SpecificationHeader.tsx` with version display
- [x] T027 Create ScrollToAnchor component for hash-based navigation

### Styling
- [x] T028 [P] Create `src/components/specification/SpecificationPage.module.css` with layout styles
- [x] T029 [P] Create `src/components/specification/TOCSidebar.module.css` matching catalogue sidebar patterns
- [x] T030 [P] Create `src/components/specification/MarkdownRenderer.module.css` for prose and code block styling
- [x] T031 [P] Create mobile responsive styles with 768px breakpoint

## Phase 3.4: Integration

### Routing & Navigation
- [x] T032 Update `src/App.tsx` to add specification route and state management
- [x] T033 Update `src/components/Header.tsx` to wire specification link click handler
- [x] T034 Update `src/components/Footer.tsx` to wire specification link in footer
- [x] T035 Implement URL persistence for specification page with query params

### Markdown Rendering Features
- [x] T036 Configure react-syntax-highlighter with Prism theme in MarkdownRenderer
- [x] T037 Implement custom code block component with language detection
- [x] T038 Add pseudocode language support for algorithm demonstrations
- [x] T039 Implement smooth scrolling behavior for TOC navigation
- [x] T040 Add active heading highlighting in TOC based on scroll position

### Content Creation
- [x] T041 [P] Create `docs/specification/00-overview/01-introduction.md` synthesizing from README
- [x] T042 [P] Create `docs/specification/00-overview/02-principles.md` from constitution
- [x] T043 [P] Create `docs/specification/01-core-concepts/01-transactions.md` with composability explanation
- [x] T044 [P] Create `docs/specification/01-core-concepts/02-directories.md` with namespace isolation
- [x] T045 [P] Create `docs/specification/02-requirements/01-compliance.md` with SNAP requirements
- [x] T046 [P] Create `docs/specification/03-examples/01-task-queue.md` from taskqueue examples

## Phase 3.5: Polish

### Performance & UX
- [ ] T047 Implement memoization for MarkdownRenderer component to prevent re-renders
- [ ] T048 Add loading states and skeletons during document fetching
- [ ] T049 Implement error boundaries for graceful failure handling
- [ ] T050 Add keyboard navigation support (arrow keys for TOC)

### Testing & Validation
- [ ] T051 Run all contract tests and ensure they pass
- [ ] T052 Run all integration tests and verify scenarios work
- [ ] T053 Test on mobile devices (iOS Safari, Android Chrome)
- [ ] T054 Validate accessibility with keyboard navigation and screen readers
- [ ] T055 Performance testing: verify <3 second page load

### Documentation
- [ ] T056 [P] Update README.md with specification page documentation
- [ ] T057 [P] Create SPECIFICATION.md with content authoring guidelines
- [ ] T058 [P] Document markdown frontmatter format and requirements

## Dependency Tree
```
Setup (T001-T004)
    ↓
Tests (T005-T012) [Can run in parallel]
    ↓
Types (T013-T017) [Sequential - same file]
    ↓
Services (T018-T022) [Sequential - depends on types]
    ↓
Components (T023-T027) [Can run in parallel after services]
    ↓
Styling (T028-T031) [Can run in parallel]
    ↓
Integration (T032-T046) [T041-T046 content creation can run in parallel]
    ↓
Polish (T047-T058) [T056-T058 docs can run in parallel]
```

## Parallel Execution Examples

### After Setup Complete
```bash
# Run all test file creation in parallel (different files)
Task agent "Create specification test files" &
Task agent "Create TOC test files" &
Task agent "Create markdown test files" &
Task agent "Create integration test files" &
wait
```

### After Types Complete
```bash
# Run component creation in parallel (different files)
Task agent "Create SpecificationPage component" &
Task agent "Create TOCSidebar component" &
Task agent "Create MarkdownRenderer component" &
wait
```

### Content Creation
```bash
# Create all markdown content in parallel (different files)
Task agent "Create introduction.md from README" &
Task agent "Create principles.md from constitution" &
Task agent "Create transactions.md" &
Task agent "Create directories.md" &
wait
```

### Documentation
```bash
# Update all documentation in parallel (different files)
Task agent "Update README.md" &
Task agent "Create SPECIFICATION.md" &
Task agent "Document frontmatter format" &
wait
```

## Success Criteria
- All 58 tasks completed
- All tests passing (contract and integration)
- Specification page loads in <3 seconds
- TOC navigation works smoothly
- Mobile responsive design functional
- Version 0.1.0 specification content created
- Code syntax highlighting working
- URL persistence functional

## Notes
- Tasks marked [P] can be executed in parallel as they work on different files
- Sequential tasks within the same file are not marked with [P]
- Content creation tasks (T041-T046) are independent and can all run in parallel
- Style files (T028-T031) are independent and can all run in parallel
- Test file creation (T005-T012) can all run in parallel as they're different files