# Feature Specification: SNAPs Catalogue System

**Feature Branch**: `001-build-a-catalogue`
**Created**: 2025-09-19
**Status**: Draft
**Input**: User description: "build a catalogue of SNAPs that includes a link to their GitHub repo, popularity based on stars and last commit date (last release etc.), some properties (such as OTel metrics emission, OTel span emission, etc.), target platform version (e.g. Java SDK version), etc. The FE should integrate with the existing website (including current placeholder links), users should be able to easily file a PR to add/edit/remove SNAPs. SNAPs can optionally include a public spec repo that contains nothing but documentation for others to implement the same SNAP against it for other languages (so one could implement, for instance, leader election in Java, provide a separate repo for the spec so that someone could implement the same in Rust for instance)."

## Execution Flow (main)
```
1. Parse user description from Input
   ’ If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   ’ Identify: actors, actions, data, constraints
3. For each unclear aspect:
   ’ Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   ’ If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   ’ Each requirement must be testable
   ’ Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   ’ If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   ’ If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ¡ Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer looking for FoundationDB components, I want to browse a catalogue of available SNAPs so that I can find and evaluate components that meet my project needs. I should be able to see key information about each SNAP including its popularity, maintenance status, capabilities, and platform requirements.

As a SNAP author, I want to submit my component to the catalogue so that other developers can discover and use it. I should be able to provide all relevant metadata and optionally link to a language-agnostic specification repository.

### Acceptance Scenarios
1. **Given** a visitor is on the SNAPs website, **When** they navigate to the catalogue section, **Then** they see a browsable list of available SNAPs with filtering and sorting options
2. **Given** a user is viewing the catalogue, **When** they select a SNAP entry, **Then** they see detailed information including GitHub link, stars, last commit date, properties, and platform requirements
3. **Given** a SNAP author wants to add their component, **When** they follow the contribution process, **Then** they can submit a pull request with their SNAP metadata
4. **Given** a SNAP has a specification repository, **When** users view the SNAP details, **Then** they can access both the implementation and specification repositories
5. **Given** the catalogue is displayed, **When** a user applies filters (e.g., by platform, capabilities), **Then** only matching SNAPs are shown

### Edge Cases
- What happens when a GitHub repository becomes unavailable or is deleted?
- How does the system handle SNAPs with no recent activity (abandoned projects)?
- What if multiple implementations exist for the same SNAP specification?
- How are naming conflicts resolved when two SNAPs have similar names?
- What happens when GitHub API rate limits are reached?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display a catalogue of SNAP components with their basic information
- **FR-002**: Each SNAP entry MUST include a link to its GitHub repository
- **FR-003**: System MUST show popularity metrics including star count and last commit/release date
- **FR-004**: Each SNAP MUST display its properties/capabilities (e.g., OpenTelemetry metrics support, OpenTelemetry span emission)
- **FR-005**: Each SNAP MUST show its target platform requirements (e.g., Java SDK version, Python version)
- **FR-006**: System MUST integrate the catalogue seamlessly with the existing website navigation
- **FR-007**: System MUST provide a documented process for users to submit new SNAPs via pull requests
- **FR-008**: System MUST support editing existing SNAP entries through pull requests
- **FR-009**: System MUST support removing deprecated SNAPs through pull requests
- **FR-010**: SNAPs MAY include an optional link to a specification repository separate from implementation
- **FR-011**: System MUST clearly distinguish between implementation and specification repositories when both exist
- **FR-012**: Catalogue MUST be sortable by [NEEDS CLARIFICATION: default sort order - by name, stars, last update?]
- **FR-013**: Catalogue MUST be filterable by [NEEDS CLARIFICATION: which filter categories - language, category, capabilities?]
- **FR-014**: System MUST handle [NEEDS CLARIFICATION: how to handle stale/unmaintained SNAPs - hide after X months, mark as archived?]
- **FR-015**: System MUST validate [NEEDS CLARIFICATION: what validation rules for SNAP submissions - required fields, naming conventions?]
- **FR-016**: Catalogue MUST refresh repository metadata [NEEDS CLARIFICATION: refresh frequency - real-time, daily, weekly?]

### Key Entities *(include if feature involves data)*
- **SNAP Entry**: Represents a single SNAP component in the catalogue, containing metadata about the implementation
  - Attributes: name, description, category, repository URL, specification URL (optional), star count, last commit date, last release info, supported platforms, capabilities/properties, maintainer info
- **SNAP Category**: Classification of SNAPs by their primary function (e.g., Queue, Blob Store, Search, Graph Database)
- **SNAP Capability**: Specific features or integrations a SNAP supports (e.g., OTel metrics, OTel spans, multi-tenancy)
- **Platform Requirement**: Technical requirements for running a SNAP (e.g., Java 11+, Python 3.8+, FoundationDB 7.1+)
- **Specification Repository**: Optional separate repository containing language-agnostic documentation for implementing the same SNAP in other languages

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed (has clarifications needed)

---