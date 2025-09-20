# Quickstart: Add Formal SNAP Specification

## Overview
This guide walks through the implementation of the SNAP specification page feature, from setup to verification.

## Prerequisites
- Node.js 18+ and npm installed
- Existing snap-website repository cloned
- Development server running (`npm run dev`)

## Step 1: Install Dependencies
```bash
npm install react-markdown remark-gfm react-syntax-highlighter gray-matter
npm install -D @types/react-syntax-highlighter
```

## Step 2: Create Specification Directory Structure
```bash
mkdir -p docs/specification/{00-overview,01-core-concepts,02-requirements,03-examples}
```

## Step 3: Create Sample Specification Content
Create `docs/specification/metadata.json`:
```json
{
  "specVersion": "0.1.0",
  "releaseDate": "2025-01-19",
  "status": "draft",
  "authors": ["SNAP Community"],
  "license": "MIT"
}
```

Create `docs/specification/00-overview/01-introduction.md`:
```markdown
---
title: "Introduction to SNAPs"
version: "0.1.0"
date: "2025-01-19"
status: "draft"
---

# Introduction to SNAPs

SNAPs (Subspace-Native Atomic Pieces) are composable FoundationDB layers that provide production-ready implementations of common data structures and patterns.

## Core Principles

1. **Transaction Composability**: All operations execute as atomic transactions
2. **Namespace Isolation**: Complete separation via FoundationDB directories
3. **Language Agnostic**: Interoperable across programming languages
```

## Step 4: Implement Components

### Create Specification Service
`src/services/specification.ts`:
```typescript
import matter from 'gray-matter';
import type { SpecificationDocument, TableOfContents } from '../types/specification';

export class SpecificationService {
  async loadSpecification() {
    // Load metadata.json
    const metadata = await fetch('/docs/specification/metadata.json')
      .then(r => r.json());

    // Build TOC structure
    const toc = await this.buildTableOfContents();

    return { metadata, toc };
  }

  async loadDocument(path: string): Promise<SpecificationDocument> {
    const response = await fetch(`/docs/specification/${path}`);
    const content = await response.text();
    const { data, content: markdown } = matter(content);

    return {
      id: path.replace(/\//g, '-').replace('.md', ''),
      path,
      title: data.title,
      version: data.version,
      date: data.date,
      status: data.status,
      content: markdown,
      headings: this.extractHeadings(markdown),
      metadata: data,
    };
  }
}
```

### Create Specification Page Component
`src/components/specification/SpecificationPage.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { TOCSidebar } from './TOCSidebar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SpecificationService } from '../../services/specification';
import styles from './SpecificationPage.module.css';

export const SpecificationPage = () => {
  const [toc, setToc] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isTocVisible, setIsTocVisible] = useState(true);

  useEffect(() => {
    const service = new SpecificationService();
    service.loadSpecification().then(({ toc }) => {
      setToc(toc);
      // Load first document by default
      if (toc.sections[0]?.documents[0]) {
        selectDocument(toc.sections[0].documents[0]);
      }
    });
  }, []);

  const selectDocument = async (documentId: string) => {
    const service = new SpecificationService();
    const doc = await service.loadDocument(documentId);
    setCurrentDocument(doc);
  };

  return (
    <div className={styles.specificationPage}>
      {toc && (
        <TOCSidebar
          toc={toc}
          currentDocumentId={currentDocument?.id}
          onDocumentSelect={selectDocument}
          isVisible={isTocVisible}
        />
      )}
      <div className={styles.content}>
        {currentDocument && (
          <MarkdownRenderer document={currentDocument} />
        )}
      </div>
    </div>
  );
};
```

## Step 5: Add Routing
Update `src/App.tsx`:
```typescript
import { SpecificationPage } from './components/specification/SpecificationPage';

// In the routing logic
{showSpecification && <SpecificationPage />}

// Update navigation handler
const handleSpecificationClick = () => {
  setShowSpecification(true);
  setShowCatalogue(false);
};
```

## Step 6: Update Navigation Links
Update `src/components/Header.tsx`:
```typescript
<a
  href="#specification"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    onSpecificationClick?.();
  }}
>
  Specification
</a>
```

## Step 7: Test the Implementation

### Verify Basic Functionality
1. Click "Specification" link in navigation
2. Confirm specification page loads
3. Verify TOC displays on the left
4. Click a TOC item and verify content loads

### Test Mobile Responsiveness
1. Open browser developer tools
2. Switch to mobile view (< 768px width)
3. Verify TOC collapses to hamburger menu
4. Test TOC toggle functionality

### Test Navigation
1. Click on different sections in TOC
2. Verify smooth scrolling to headings
3. Test browser back/forward buttons
4. Verify URL updates with hash fragments

### Test Markdown Rendering
1. Verify headings render correctly
2. Check code blocks have syntax highlighting
3. Verify links work properly
4. Test pseudocode rendering

## Step 8: Performance Verification

### Check Load Times
```javascript
// In browser console
performance.mark('spec-start');
// Navigate to specification page
performance.mark('spec-end');
performance.measure('spec-load', 'spec-start', 'spec-end');
console.log(performance.getEntriesByName('spec-load'));
// Should be < 3 seconds
```

### Verify Smooth Scrolling
- TOC navigation should not cause janky scrolling
- Page should remain responsive during markdown rendering

## Step 9: Accessibility Check
1. Test keyboard navigation (Tab, Enter, Arrow keys)
2. Verify screen reader compatibility
3. Check color contrast ratios
4. Test focus indicators

## Step 10: Content Creation
Create initial specification content by:
1. Synthesizing from README.md
2. Extracting from landing page content
3. Using taskqueue examples for code demonstrations
4. Adding pseudocode for algorithm explanations

## Validation Checklist

### Functional Requirements
- [ ] FR-001: Dedicated specification page exists
- [ ] FR-002: "Specification" navigation link works
- [ ] FR-003: Complete specification content displays
- [ ] FR-004: Navigable table of contents works
- [ ] FR-005: Mobile responsive design
- [ ] FR-006: Consistent styling with site
- [ ] FR-007: All essential sections included
- [ ] FR-008: No authentication required
- [ ] FR-009: Page loads within 3 seconds
- [ ] FR-010: Browser search (Ctrl+F) works
- [ ] FR-011: Version information displayed
- [ ] FR-012: Internal links navigate correctly
- [ ] FR-013: Direct URL access works

### User Acceptance
- [ ] Developer can find specification from navigation
- [ ] All specification sections are accessible
- [ ] TOC navigation is intuitive
- [ ] Content is readable on all devices
- [ ] Code examples render with highlighting

## Troubleshooting

### Issue: Markdown files not loading
**Solution**: Ensure files are in public directory or use proper import strategy

### Issue: TOC not generating correctly
**Solution**: Check heading hierarchy in markdown files

### Issue: Syntax highlighting not working
**Solution**: Verify react-syntax-highlighter is properly configured

### Issue: Mobile TOC not collapsing
**Solution**: Check CSS media queries and breakpoint values

## Next Steps
1. Add search functionality
2. Implement print stylesheet
3. Add PDF export capability
4. Create more specification content
5. Add version comparison feature

## Support
For issues or questions:
- Check the implementation in `/specs/002-add-formal-snap/`
- Review the contracts in `/specs/002-add-formal-snap/contracts/`
- Consult the data model documentation