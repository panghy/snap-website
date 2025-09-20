# Research: Add Formal SNAP Specification

## Overview
This document consolidates research findings for implementing the formal SNAP specification page, resolving all technical unknowns identified in the planning phase.

## Key Decisions

### 1. Markdown Rendering Library
**Decision**: `react-markdown` with `remark-gfm`
**Rationale**:
- Already established in the React ecosystem with 5.8M+ weekly downloads
- 100% CommonMark compliant with GFM support via plugin
- Extensive plugin ecosystem for future enhancements
- Safe by default (no XSS vulnerabilities)
- Better suited for documentation with complex formatting needs
**Alternatives Considered**:
- `markdown-to-jsx`: Lighter (6KB vs 30KB) but less feature-rich
- `MDX`: Overkill for static specification content, adds build complexity

### 2. Syntax Highlighting for Pseudocode
**Decision**: `react-syntax-highlighter` with Prism.js theme
**Rationale**:
- Integrates seamlessly with react-markdown
- Prism.js supports custom language definitions for pseudocode
- Virtual DOM approach (no dangerouslySetInnerHTML)
- Lightweight with lazy-loaded language support
**Alternatives Considered**:
- `highlight.js`: Larger bundle, less React-friendly
- `shiki`: Better highlighting but requires WASM, complex setup

### 3. Table of Contents Generation
**Decision**: Custom implementation using `remark` AST parsing
**Rationale**:
- Full control over TOC structure and behavior
- Can extract headings during markdown parsing (single pass)
- Matches existing catalogue sidebar patterns
- No additional dependencies needed
**Alternatives Considered**:
- `react-markdown-toc`: Good but adds dependency for simple need
- `remark-toc`: Modifies content, we need separate TOC component

### 4. Frontmatter/Preamble Parsing
**Decision**: `gray-matter` for metadata extraction
**Rationale**:
- Industry standard (used by Gatsby, Next.js, etc.)
- Supports YAML frontmatter format
- Robust error handling
- Clean API with TypeScript support
**Alternatives Considered**:
- `front-matter`: Less features, smaller community
- Custom regex parsing: Error-prone, unnecessary complexity

### 5. File Organization Strategy
**Decision**: Hierarchical markdown structure in `/docs/specification/`
**Rationale**:
- Clear separation from source code
- Natural URL mapping (/specification/[section]/[topic])
- Easy to maintain and version
- Supports future expansion
**Structure**:
```
/docs/specification/
├── 00-overview/
│   ├── index.md
│   ├── introduction.md
│   └── principles.md
├── 01-core-concepts/
│   ├── index.md
│   ├── transactions.md
│   └── directories.md
├── 02-requirements/
│   ├── index.md
│   └── compliance.md
└── metadata.json  # TOC ordering and section metadata
```

### 6. Navigation and Routing
**Decision**: React Router with hash-based section navigation
**Rationale**:
- Already using React Router in the app
- Hash fragments for section deep-linking
- Smooth scrolling with `scrollIntoView`
- Browser back/forward button support
**Implementation**: Custom ScrollToAnchor component with retry logic

### 7. Performance Strategy
**Decision**: Progressive enhancement with memoization
**Rationale**:
- Initial specification (~15 files) doesn't require heavy optimization
- React.memo for markdown components
- Lazy loading for future growth
- Focus on fast initial render
**Future Optimizations** (when needed):
- Virtual scrolling for very long documents
- Chunk loading for sections
- Search indexing with Lunr.js

### 8. Version and Date Stamping
**Decision**: Frontmatter metadata with build-time injection
**Rationale**:
- Version in each file's frontmatter
- Build process injects date
- Allows per-section versioning if needed
- Git history provides audit trail
**Format**:
```yaml
---
title: "SNAP Specification"
version: "0.1.0"
date: "2025-01-19"
status: "draft"
---
```

### 9. Mobile Responsiveness
**Decision**: Collapsible TOC sidebar matching catalogue pattern
**Rationale**:
- Consistent UX with existing catalogue page
- Hamburger menu for mobile TOC
- Swipe gestures for TOC toggle
- Same breakpoints as catalogue (768px)
**Implementation**: Reuse FilterSidebar patterns

### 10. Styling Consistency
**Decision**: Extend existing CSS modules with markdown-specific styles
**Rationale**:
- Maintains design system consistency
- Light theme like catalogue page
- Typography from existing heading styles
- Code blocks with subtle backgrounds
**New Styles Needed**:
- `.markdownContent` for prose styling
- `.codeBlock` for syntax highlighted blocks
- `.pseudocode` for algorithm demonstrations
- `.specTable` for requirement tables

## Technical Architecture

### Component Structure
```typescript
// Main specification page component
SpecificationPage/
├── SpecificationPage.tsx        // Main container
├── SpecificationPage.module.css // Page-specific styles
├── TOCSidebar.tsx               // Navigation sidebar
├── MarkdownRenderer.tsx         // Content renderer
└── SpecificationProvider.tsx    // Context for spec data
```

### Data Flow
1. **Load Phase**: Read all markdown files from `/docs/specification/`
2. **Parse Phase**: Extract frontmatter and generate TOC structure
3. **Render Phase**: Display TOC and selected content
4. **Navigate Phase**: Handle section selection and scrolling

### Dependencies to Add
```json
{
  "react-markdown": "^9.0.1",
  "remark-gfm": "^4.0.0",
  "react-syntax-highlighter": "^15.5.0",
  "gray-matter": "^4.0.3",
  "@types/react-syntax-highlighter": "^15.5.11"
}
```

## Implementation Priorities

### Phase 1: Core Infrastructure
1. Set up markdown file structure
2. Implement basic markdown rendering
3. Create TOC generation logic
4. Add routing and navigation

### Phase 2: Enhanced Features
1. Add syntax highlighting
2. Implement smooth scrolling
3. Add search functionality
4. Mobile responsiveness

### Phase 3: Content Creation
1. Write initial specification sections
2. Synthesize content from README and examples
3. Add pseudocode examples
4. Version stamping

## Risks and Mitigations

### Risk 1: Large Document Performance
**Mitigation**: Start simple, monitor performance, add optimizations only when needed

### Risk 2: Content Organization Complexity
**Mitigation**: Clear file naming conventions, metadata.json for explicit ordering

### Risk 3: Markdown Rendering Edge Cases
**Mitigation**: Comprehensive test suite, use well-tested libraries

### Risk 4: Mobile TOC Usability
**Mitigation**: Follow established catalogue sidebar patterns

## Conclusion
All technical unknowns have been resolved. The approach uses proven libraries and patterns while maintaining consistency with the existing codebase. The architecture supports both immediate needs and future growth.