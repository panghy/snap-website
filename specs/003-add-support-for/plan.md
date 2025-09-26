# Implementation Plan: GitLab.com Repository Support

**Branch**: `003-add-support-for` | **Date**: 2025-09-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-add-support-for/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
Enable GitLab.com repository support in the SNAP catalogue website, allowing SNAP maintainers to link to GitLab-hosted implementations alongside GitHub repositories. The system will fetch and display the same metadata fields from GitLab as it currently does from GitHub (stars, description, language, etc.) using only public APIs without authentication requirements.

## Technical Context
**Language/Version**: TypeScript 5.x / React 19 (existing codebase)
**Primary Dependencies**: React, Vite, react-markdown (existing)
**Storage**: JSON files in public/data/ (existing pattern)
**Testing**: Vitest, React Testing Library (existing)
**Target Platform**: Web browsers (modern evergreen)
**Project Type**: web (frontend React application)
**Performance Goals**: Same as GitHub - fetch metadata at runtime on-demand
**Constraints**: No authentication required, public API access only
**Scale/Scope**: ~5-10 SNAPs in catalogue currently, expected <100

**Clarifications from user**:
- Metadata fields to retrieve from GitLab should match GitHub exactly
- All metadata fetching should work without authentication (public APIs only)
- No current caching implementation exists
- No current rate limiting handling exists
- Fallback behavior should match GitHub's current implementation
- **UPDATE**: Fetch GitLab data at runtime (similar to GitHub pattern)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### SNAPs Principles Compliance
- [x] **Specification-First Development**: N/A - This is a website feature, not a SNAP implementation
- [x] **Transaction Composability**: N/A - Website feature, not SNAP
- [x] **Namespace Isolation**: N/A - Website feature
- [x] **Language-Agnostic Interoperability**: N/A - Website feature
- [x] **Minimal Dependencies**: ✅ No new dependencies required, using existing fetch API
- [x] **Multi-Tenancy by Design**: N/A - Website feature

### Website Catalogue Standards
- [x] **Repository Support**: ✅ Expanding to support both GitHub and GitLab
- [x] **Catalogue Entry Format**: ✅ Maintaining existing format, adding platform indicator
- [x] **Public Repository Access**: ✅ Using only public APIs
- [x] **Documentation Requirements**: Will update docs for GitLab URL format

## Project Structure

### Documentation (this feature)
```
specs/003-add-support-for/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (existing structure)
src/
├── components/
│   └── catalogue/       # Existing catalogue components
├── services/
│   └── repository/      # New service for repository metadata
├── types/
│   └── repository.ts    # Repository types (GitHub/GitLab)
└── utils/
    └── url-parser.ts    # URL validation utilities

public/
└── data/
    └── snaps.json       # Existing SNAP catalogue data
```

**Structure Decision**: Option 2 (Web application) - matches existing codebase structure

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - GitLab API endpoints for public repository data
   - GitLab URL format patterns for validation
   - GitLab metadata field mappings to GitHub equivalents
   - Current GitHub implementation patterns in codebase

2. **Research tasks**:
   - Research GitLab REST API v4 for public project endpoints
   - Document GitLab repository URL patterns (gitlab.com/user/repo vs groups)
   - Map GitLab API fields to GitHub equivalents (stars→star_count, etc.)
   - Analyze current GitHub implementation in codebase

3. **Consolidate findings** in `research.md`

**Output**: research.md with GitLab API documentation and field mappings

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Repository entity with platform field
   - Repository metadata with normalized fields
   - Platform-specific URL validators
   - Loading and error states for runtime fetching

2. **Generate API contracts** from functional requirements:
   - Repository URL validation contract
   - Runtime metadata fetch contract (client-side)
   - CORS-compatible API wrapper contract
   - Unified repository display contract
   - Output TypeScript interfaces to `/contracts/`

3. **Generate contract tests**:
   - GitLab URL validation tests
   - Runtime GitLab API fetch tests with mocks
   - Loading state transition tests
   - Mixed platform display tests
   - CORS error handling tests

4. **Extract test scenarios** from user stories:
   - Adding GitLab repository to catalogue
   - Runtime fetching with loading states
   - Viewing mixed GitHub/GitLab repositories
   - Handling GitLab API failures at runtime

5. **Update agent file incrementally**:
   - Add GitLab runtime API integration context
   - Note repository abstraction pattern for runtime fetching

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md updates

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Repository service abstraction tasks [P]
- GitLab URL parser implementation [P]
- Runtime GitLab API client with CORS handling [P]
- React hooks for runtime data fetching
- Loading state components
- UI component updates for platform indicators
- Catalogue data schema updates (URLs only, no metadata)
- Integration tests for runtime fetching

**Ordering Strategy**:
- Types and interfaces first
- URL parser and validators
- API clients with CORS handling (can be parallel)
- React hooks for data fetching
- Service abstraction layer
- Loading/error UI components
- Integration tests last

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md)
**Phase 5**: Validation (run tests, verify GitLab repos display correctly)

## Complexity Tracking
*No violations - feature follows existing patterns and requires no complex abstractions*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*