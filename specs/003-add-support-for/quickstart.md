# Quickstart: GitLab Repository Support

## Overview
This guide demonstrates how to add GitLab-hosted SNAP implementations to the catalogue alongside GitHub repositories.

## Prerequisites
- Node.js 20.x installed
- Repository cloned and dependencies installed (`npm install`)
- GitLab repository URL for your SNAP implementation

## Quick Test Scenarios

### 1. Add a GitLab Repository to Catalogue

**Step 1**: Open `public/data/snaps.json`

**Step 2**: Add a GitLab repository to an existing SNAP:
```json
{
  "name": "TaskQueueSnap",
  "implementations": [
    {
      "language": "Python",
      "repository": {
        "url": "https://gitlab.com/your-username/taskqueue-python",
        "platform": "GITLAB",
        "owner": "your-username",
        "name": "taskqueue-python"
      },
      "specVersion": "0.1.0"
    }
  ]
}
```

**Step 3**: Run the metadata fetch script (if in build-time mode):
```bash
npm run fetch:metadata
```

**Step 4**: Start the development server:
```bash
npm run dev
```

**Step 5**: Navigate to the catalogue page and verify:
- GitLab repository link is displayed
- GitLab icon/indicator is shown
- Clicking the link opens the GitLab repository

### 2. Test Mixed Platform Display

Add both GitHub and GitLab implementations to the same SNAP:

```json
{
  "implementations": [
    {
      "language": "Java",
      "repository": {
        "url": "https://github.com/user/snap-java",
        "platform": "GITHUB"
      }
    },
    {
      "language": "Python",
      "repository": {
        "url": "https://gitlab.com/user/snap-python",
        "platform": "GITLAB"
      }
    }
  ]
}
```

**Verify**:
- Both repositories display with correct platform indicators
- Both links navigate to correct external pages
- Metadata displays for both (when available)

### 3. Test URL Validation

Try adding invalid GitLab URLs and verify they're rejected:

**Invalid URLs to test**:
```json
// Wrong domain
"https://github.com/user/repo"  // Platform mismatch

// Invalid format
"gitlab.com/user/repo"  // Missing protocol
"https://gitlab.com/"   // No repository path
"https://gitlab.com/user"  // Missing repo name (for personal projects)
```

**Expected**: Validation errors in console or UI

### 4. Test Metadata Fetching

For a valid GitLab repository, verify metadata is fetched:

```bash
# Run metadata fetch for all repositories
npm run fetch:metadata

# Check the updated snaps.json
cat public/data/snaps.json | jq '.snaps[].implementations[].repository.metadata'
```

**Verify fetched fields**:
- `stars` (number)
- `description` (string or null)
- `primaryLanguage` (string or null)
- `lastUpdated` (ISO date string)
- `forks` (number)
- `openIssues` (number)
- `defaultBranch` (string)

### 5. Test Error Handling

**Scenario 1: Private Repository**
1. Add a private GitLab repository URL
2. Run metadata fetch
3. Verify: Repository displays with URL only, no metadata

**Scenario 2: Invalid Repository**
1. Add URL for non-existent repository
2. Run metadata fetch
3. Verify: Error logged, repository shows without metadata

**Scenario 3: Rate Limiting (simulated)**
1. Add many GitLab repositories (>10)
2. Run metadata fetch rapidly
3. Verify: Graceful degradation, some repos may lack metadata

## Command Reference

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm run build

# Fetch repository metadata (if implemented as build script)
npm run fetch:metadata

# Run linting
npm run lint
```

## Validation Checklist

- [ ] GitLab URLs are accepted in snaps.json
- [ ] GitLab repositories display with correct platform indicator
- [ ] Repository links navigate to GitLab.com
- [ ] Metadata fetching works for public GitLab repos
- [ ] Private/invalid repos degrade gracefully
- [ ] Mixed GitHub/GitLab implementations work correctly
- [ ] UI shows platform-specific icons/badges
- [ ] Build process completes without errors
- [ ] Tests pass with GitLab repositories included

## Troubleshooting

### Metadata not appearing
1. Check if repository is public on GitLab
2. Verify URL format is correct
3. Check console for API errors
4. Ensure fetch:metadata script was run

### Build failures
1. Check for TypeScript errors: `npm run typecheck`
2. Verify JSON structure in snaps.json
3. Check for linting errors: `npm run lint`

### Platform detection issues
1. Ensure URL includes `https://gitlab.com/`
2. Verify platform field matches URL domain
3. Check for trailing slashes or `.git` extensions

## Next Steps

After basic functionality is working:

1. **Performance Testing**: Add 10+ GitLab repos and measure fetch time
2. **UI Enhancement**: Customize GitLab repository cards with platform-specific styling
3. **Monitoring**: Set up alerts for API failures or rate limiting
4. **Documentation**: Update user documentation with GitLab examples
5. **CI/CD**: Add GitLab repos to test fixtures