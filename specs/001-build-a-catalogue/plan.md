# Implementation Plan: SNAPs Catalogue System

**Branch**: `001-build-a-catalogue` | **Date**: 2025-09-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-a-catalogue/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a browsable catalogue of SNAP components for the existing React/TypeScript/Vite website. The catalogue will display GitHub repository metadata (stars, last commit), SNAP properties (capabilities, platform requirements), and support PR-based submissions. A single JSON file will drive the catalogue data, with client-side filtering and dynamic GitHub API integration for real-time metrics.

## Technical Context
**Language/Version**: TypeScript 5.8.3 / React 19.1.1
**Primary Dependencies**: Vite 7.1.2, React, TypeScript
**Storage**: JSON file (static data), GitHub API (dynamic metrics)
**Testing**: To be determined based on project conventions
**Target Platform**: Web browser (modern browsers supporting ES6+)
**Project Type**: web - Single-page application integrated into existing site
**Performance Goals**: <200ms initial load, <100ms filter response time
**Constraints**: Client-side only, GitHub API rate limits (60/hour unauthenticated)
**Scale/Scope**: ~50-100 initial SNAP entries, growing to 500+

**User-provided implementation details**:
- Light background color scheme (contrast with dark landing page)
- Same general styling as existing site
- JSON file drives catalogue data (editable by anyone)
- Dynamic REST calls to GitHub API for real-time metrics
- Client-side filtering
- Links open in new windows
- Toggle between SNAPs and SNAP Specifications
- Left nav bar for filtering/switching
- Right-hand list view with subtle cards (full width, variable height)
- Direct GitHub edit link for JSON file

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment:
- ✅ **Specification-First Development**: Catalogue will enforce SNAP specification compliance display
- ✅ **Transaction Composability**: N/A for catalogue, but displays this information
- ✅ **Namespace Isolation**: N/A for catalogue display
- ✅ **Language-Agnostic Interoperability**: Catalogue shows multi-language implementations
- ✅ **Minimal Dependencies**: Using existing React/Vite stack, no new frameworks
- ✅ **Multi-Tenancy by Design**: N/A for catalogue display

### Quality Standards:
- ✅ **Documentation Requirements**: Will display documentation links for each SNAP
- ✅ **Testing Discipline**: Will implement tests for catalogue components
- ✅ **Versioning Standards**: Catalogue will display version compatibility

### Website Catalogue Standards:
- ✅ **SNAP Submission Requirements**: Enforced via JSON schema
- ✅ **Catalogue Entry Format**: Defined in data model

## Project Structure

### Documentation (this feature)
```
specs/001-build-a-catalogue/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Existing structure (Option 2: Web application)
src/
├── components/
│   ├── catalogue/       # NEW - Catalogue components
│   │   ├── CataloguePage.tsx
│   │   ├── SnapCard.tsx
│   │   ├── FilterSidebar.tsx
│   │   └── CatalogueHeader.tsx
│   └── [existing components]
├── data/                # NEW - Static data
│   └── snaps.json
├── services/           # NEW - API services
│   └── github.ts
├── types/              # NEW - TypeScript types
│   └── snap.ts
└── [existing files]

public/
└── [existing files]
```

**Structure Decision**: Extend existing web application structure (Option 2 variant)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - GitHub API rate limiting strategies
   - Optimal JSON schema for SNAP data
   - Client-side filtering performance patterns
   - React Router integration for catalogue page

2. **Generate and dispatch research agents**:
   ```
   Task 1: Research GitHub API v3/v4 for repository metrics fetching
   Task 2: Research client-side filtering patterns for 100-500 items
   Task 3: Research JSON schema best practices for community contributions
   Task 4: Research React Router integration with existing Vite app
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - SNAP Entry entity with all attributes
   - SNAP Category enumeration
   - SNAP Capability enumeration
   - Platform Requirement structure
   - Specification Repository reference

2. **Generate API contracts** from functional requirements:
   - JSON schema for snaps.json file
   - GitHub API response types
   - Filter/sort parameter interfaces
   - Output to `/contracts/`

3. **Generate contract tests** from contracts:
   - JSON schema validation tests
   - GitHub API mock response tests
   - Filter function tests

4. **Extract test scenarios** from user stories:
   - Browse catalogue scenario
   - Filter SNAPs scenario
   - Submit new SNAP scenario
   - View SNAP details scenario

5. **Update agent file incrementally** (O(1) operation):
   - Add catalogue-specific context to CLAUDE.md
   - Include JSON file location and schema
   - Add GitHub API integration notes

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md updates

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Create catalogue page route and integration
- Implement JSON data structure and sample data
- Build FilterSidebar component with category/capability filters
- Create SnapCard component for list display
- Implement GitHub API service with caching
- Add client-side filtering logic
- Create edit guidance with GitHub link
- Style with light theme matching existing design
- Add toggle for SNAPs vs Specifications view
- Implement sorting (name, stars, last update)

**Ordering Strategy**:
- TypeScript types and interfaces first
- JSON structure and sample data
- Core components (page, cards, sidebar)
- GitHub API integration
- Filtering and sorting logic
- Polish and styling

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations identified - using existing stack and patterns*

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
- [x] Complexity deviations documented (none found)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*