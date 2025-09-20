import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock Prism for syntax highlighting
vi.mock('prismjs', () => ({
  default: {
    highlight: vi.fn((code, lang) => `<span class="highlighted-${lang}">${code}</span>`),
    languages: {
      javascript: {},
      typescript: {},
      python: {},
      rust: {},
      go: {},
      json: {},
      yaml: {},
      bash: {},
      pseudocode: {},
    },
  },
}));

// Mock DOMPurify for HTML sanitization
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html) => html.replace(/<script[^>]*>.*?<\/script>/gi, '')),
  },
}));

// Mock MathJax for mathematical expressions
global.MathJax = {
  typesetPromise: vi.fn().mockResolvedValue(undefined),
  tex2svg: vi.fn().mockReturnValue({
    innerHTML: '<svg>Math Expression</svg>',
  }),
};

// Mock mermaid for diagrams
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue('<svg>Mermaid Diagram</svg>'),
  },
}));

describe('Specification Page Integration - Markdown Rendering (T012)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock specification metadata
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('metadata.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            specVersion: '0.1.0',
            releaseDate: '2025-01-19',
            status: 'draft',
            sections: [
              {
                id: '00-overview',
                title: 'Overview',
                description: 'Introduction to SNAPs',
                order: 0,
                documents: ['01-comprehensive.md', '02-formatting.md'],
              },
              {
                id: '01-technical',
                title: 'Technical Documentation',
                description: 'Technical details with code examples',
                order: 1,
                documents: ['01-code-examples.md', '02-diagrams.md'],
              },
            ],
          }),
        });
      }

      if (url.includes('.md')) {
        const fileName = url.split('/').pop();
        let content = '';

        if (fileName === '01-comprehensive.md') {
          content = `---
title: Comprehensive Markdown Features
version: 0.1.0
date: 2025-01-19
status: draft
author: SNAP Team
tags: [markdown, formatting, documentation]
---

# Comprehensive Markdown Features

This document demonstrates all supported markdown features.

## Text Formatting

### Basic Formatting

This is **bold text** and this is *italic text*.
You can also use __bold__ and _italic_ syntax.
~~Strikethrough~~ text is also supported.
Use \`inline code\` for code snippets.

### Advanced Formatting

==Highlighted text== stands out.
H~2~O is a chemical formula with subscript.
X^2^ is mathematical notation with superscript.

## Headings Structure

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Lists

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deep nested item 2.2.1
- Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

### Task Lists

- [x] Completed task
- [ ] Pending task
- [x] Another completed task
- [ ] Another pending task

## Code Examples

### Inline Code

Use the \`console.log()\` function to print output.

### Code Blocks

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

const user = "Alice";
greetUser(user);
\`\`\`

### TypeScript Example

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  findUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}
\`\`\`

### Python Example

\`\`\`python
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 Fibonacci numbers
fib_sequence = [fibonacci(i) for i in range(10)]
print(f"Fibonacci sequence: {fib_sequence}")
\`\`\`

### Rust Example

\`\`\`rust
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    name: String,
    version: String,
    features: HashMap<String, bool>,
}

impl Config {
    fn new(name: &str, version: &str) -> Self {
        Config {
            name: name.to_string(),
            version: version.to_string(),
            features: HashMap::new(),
        }
    }
}
\`\`\`

## Tables

### Simple Table

| Name    | Age | Role      |
|---------|-----|-----------|
| Alice   | 30  | Developer |
| Bob     | 25  | Designer  |
| Charlie | 35  | Manager   |

### Complex Table

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Authentication | ✅ Complete | High | OAuth 2.0 implemented |
| Authorization | 🔄 In Progress | High | RBAC system |
| Logging | ❌ Pending | Medium | Need structured logging |
| Metrics | ✅ Complete | Low | Prometheus integration |

## Links and References

### External Links

Visit [GitHub](https://github.com) for source code.
Check out [MDN Web Docs](https://developer.mozilla.org/) for web standards.

### Internal Links

See the [Code Examples](#code-examples) section above.
Reference the [Tables](#tables) for data formatting.

### Reference-style Links

This is a [reference link][ref1] and another [reference][ref2].

[ref1]: https://example.com "Example website"
[ref2]: https://docs.example.com "Documentation site"

## Images

### Standard Images

![SNAP Logo](https://example.com/snap-logo.png "SNAP Protocol Logo")

### Images with Links

[![Build Status](https://example.com/build-badge.svg)](https://example.com/build-status)

## Blockquotes

> This is a simple blockquote.

> This is a multi-line blockquote.
> It can span multiple lines and contain **formatting**.
>
> > Nested blockquotes are also supported.

### Quote with Attribution

> "The best way to predict the future is to invent it."
>
> — Alan Kay

## Mathematical Expressions

### Inline Math

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.

### Block Math

$$
\\begin{align}
E &= mc^2 \\\\
F &= ma \\\\
PV &= nRT
\\end{align}
$$

## Horizontal Rules

Content above the rule.

---

Content below the rule.

## Footnotes

This text has a footnote[^1] and another one[^2].

[^1]: This is the first footnote.
[^2]: This is the second footnote with more details.

## Definition Lists

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Another definition for term 2

## Abbreviations

*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

HTML and CSS are essential web technologies.

## Special Syntax

### Keyboard Keys

Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy.
Use <kbd>Alt</kbd>+<kbd>Tab</kbd> to switch windows.

### Marks and Highlights

This text has ==highlighted== sections.
Use <mark>mark tags</mark> for emphasis.

### Admonitions

!!! note "Important Note"
    This is an important note that readers should pay attention to.

!!! warning "Warning"
    This is a warning about potential issues.

!!! tip "Pro Tip"
    This is a helpful tip for users.

## Comments

<!-- This is a comment that won't be visible in the rendered output -->

## Escape Characters

Use backslashes to escape special characters: \\* \\_ \\# \\[`;
        } else if (fileName === '02-formatting.md') {
          content = `---
title: Advanced Formatting
version: 0.1.0
date: 2025-01-19
status: draft
---

# Advanced Formatting

## Custom Components

### Alert Boxes

::: alert info
This is an info alert with important information.
:::

::: alert warning
This is a warning alert about potential issues.
:::

::: alert error
This is an error alert for critical problems.
:::

::: alert success
This is a success alert for positive feedback.
:::

## Emoji Support

Happy coding! 😄 🚀 ✨
Reactions: 👍 👎 ❤️ 🎉 🤔

## Embedded Content

### YouTube Video

[![Video Title](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

### Code Pen Embed

\`\`\`codepen
user: example-user
slug: example-pen
height: 400
\`\`\``;
        } else if (fileName === '01-code-examples.md') {
          content = `---
title: Code Examples and Syntax Highlighting
version: 0.1.0
date: 2025-01-19
status: draft
---

# Code Examples and Syntax Highlighting

## Programming Languages

### Go Example

\`\`\`go
package main

import (
    "fmt"
    "net/http"
    "encoding/json"
)

type Response struct {
    Message string \`json:"message"\`
    Status  int    \`json:"status"\`
}

func handler(w http.ResponseWriter, r *http.Request) {
    response := Response{
        Message: "Hello, SNAP!",
        Status:  200,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func main() {
    http.HandleFunc("/", handler)
    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}
\`\`\`

### JSON Configuration

\`\`\`json
{
  "name": "@snap/core",
  "version": "1.0.0",
  "description": "SNAP Protocol Core Library",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "crypto": "^1.0.1",
    "ws": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "jest": "^29.0.0",
    "@types/node": "^18.0.0"
  }
}
\`\`\`

### YAML Configuration

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: snap-config
  namespace: snap-system
data:
  config.yaml: |
    server:
      port: 8080
      host: 0.0.0.0
      tls:
        enabled: true
        cert: /certs/server.crt
        key: /certs/server.key
    database:
      driver: postgres
      host: postgres.example.com
      port: 5432
      name: snapdb
      ssl: require
    logging:
      level: info
      format: json
      outputs:
        - console
        - file
\`\`\`

### Shell Script

\`\`\`bash
#!/bin/bash

# SNAP Protocol Setup Script
set -euo pipefail

SNAP_VERSION="1.0.0"
INSTALL_DIR="/opt/snap"
CONFIG_DIR="/etc/snap"

echo "Installing SNAP Protocol v\${SNAP_VERSION}..."

# Create directories
sudo mkdir -p "\${INSTALL_DIR}" "\${CONFIG_DIR}"

# Download and extract
curl -L "https://releases.snap.io/v\${SNAP_VERSION}/snap-\${SNAP_VERSION}.tar.gz" | \\
    sudo tar -xz -C "\${INSTALL_DIR}"

# Set permissions
sudo chmod +x "\${INSTALL_DIR}/bin/snap"
sudo ln -sf "\${INSTALL_DIR}/bin/snap" /usr/local/bin/snap

# Generate default config
snap config init --output "\${CONFIG_DIR}/config.yaml"

echo "SNAP Protocol installed successfully!"
snap version
\`\`\`

## Pseudocode

\`\`\`pseudocode
ALGORITHM QuickSort(array A, low, high)
BEGIN
    IF low < high THEN
        pivot ← Partition(A, low, high)
        QuickSort(A, low, pivot - 1)
        QuickSort(A, pivot + 1, high)
    END IF
END

FUNCTION Partition(array A, low, high) RETURNS integer
BEGIN
    pivot ← A[high]
    i ← low - 1

    FOR j ← low TO high - 1 DO
        IF A[j] ≤ pivot THEN
            i ← i + 1
            SWAP A[i] AND A[j]
        END IF
    END FOR

    SWAP A[i + 1] AND A[high]
    RETURN i + 1
END
\`\`\`

## SQL Queries

\`\`\`sql
-- User management queries
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Sample data insertion
INSERT INTO users (username, email, password_hash) VALUES
    ('alice', 'alice@example.com', '$2b$10$...'),
    ('bob', 'bob@example.com', '$2b$10$...'),
    ('charlie', 'charlie@example.com', '$2b$10$...');

-- Complex query with joins
SELECT
    u.username,
    u.email,
    COUNT(s.id) as session_count,
    MAX(s.last_activity) as last_seen
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
WHERE u.is_active = true
    AND (s.last_activity > NOW() - INTERVAL '30 days' OR s.id IS NULL)
GROUP BY u.id, u.username, u.email
ORDER BY last_seen DESC NULLS LAST;
\`\`\``;
        } else if (fileName === '02-diagrams.md') {
          content = `---
title: Diagrams and Visual Content
version: 0.1.0
date: 2025-01-19
status: draft
---

# Diagrams and Visual Content

## Mermaid Diagrams

### Flowchart

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is user authenticated?}
    B -->|Yes| C[Load user data]
    B -->|No| D[Redirect to login]
    C --> E[Display dashboard]
    D --> F[Show login form]
    F --> G[Validate credentials]
    G -->|Valid| C
    G -->|Invalid| H[Show error]
    H --> F
    E --> I[End]
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Database

    Client->>Gateway: POST /api/login
    Gateway->>Auth: Validate credentials
    Auth->>Database: Query user
    Database-->>Auth: User data
    Auth-->>Gateway: JWT token
    Gateway-->>Client: Login response

    Note over Client,Database: Authentication flow

    Client->>Gateway: GET /api/protected
    Gateway->>Auth: Verify JWT
    Auth-->>Gateway: Token valid
    Gateway->>Database: Fetch data
    Database-->>Gateway: Protected data
    Gateway-->>Client: API response
\`\`\`

### Class Diagram

\`\`\`mermaid
classDiagram
    class User {
        -id: string
        -username: string
        -email: string
        -passwordHash: string
        +authenticate(password: string): boolean
        +updateProfile(data: ProfileData): void
        +getPermissions(): Permission[]
    }

    class Session {
        -id: string
        -userId: string
        -token: string
        -expiresAt: Date
        +isValid(): boolean
        +refresh(): void
        +revoke(): void
    }

    class Permission {
        -id: string
        -name: string
        -resource: string
        -action: string
        +implies(permission: Permission): boolean
    }

    User ||--o{ Session : has
    User ||--o{ Permission : granted
\`\`\`

### Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    USER {
        string id PK
        string username UK
        string email UK
        string password_hash
        timestamp created_at
        boolean is_active
    }

    SESSION {
        string id PK
        string user_id FK
        string token UK
        timestamp expires_at
        timestamp last_activity
    }

    PERMISSION {
        string id PK
        string name
        string resource
        string action
    }

    USER_PERMISSION {
        string user_id FK
        string permission_id FK
        timestamp granted_at
    }

    USER ||--o{ SESSION : creates
    USER ||--o{ USER_PERMISSION : has
    PERMISSION ||--o{ USER_PERMISSION : granted
\`\`\`

### State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Authenticating : login_request
    Authenticating --> Authenticated : success
    Authenticating --> Failed : error
    Failed --> Idle : retry

    Authenticated --> Active : user_activity
    Authenticated --> Idle : logout

    Active --> Authenticated : idle_timeout
    Active --> Idle : logout

    state Authenticated {
        [*] --> ValidToken
        ValidToken --> RefreshingToken : near_expiry
        RefreshingToken --> ValidToken : refresh_success
        RefreshingToken --> Idle : refresh_failed
    }
\`\`\`

## ASCII Art Diagrams

### Network Architecture

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Gateway   │    │   Services  │
│             │    │             │    │             │
│ ┌─────────┐ │    │ ┌─────────┐ │    │ ┌─────────┐ │
│ │   Web   │ │    │ │  nginx  │ │    │ │  Auth   │ │
│ │   App   │ │◄──►│ │  Proxy  │ │◄──►│ │ Service │ │
│ └─────────┘ │    │ └─────────┘ │    │ └─────────┘ │
│             │    │             │    │             │
│ ┌─────────┐ │    │ ┌─────────┐ │    │ ┌─────────┐ │
│ │ Mobile  │ │    │ │   LB    │ │    │ │  API    │ │
│ │   App   │ │◄──►│ │ (HAProxy)│◄──►│ │ Service │ │
│ └─────────┘ │    │ └─────────┘ │    │ └─────────┘ │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  External   │    │   Cache     │    │  Database   │
│  Services   │    │  (Redis)    │    │ (PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### Data Flow

\`\`\`
Request Flow:
─────────────

1. Client Request
   │
   ▼
2. Authentication Gateway
   │ ┌─── Validate Token
   │ │
   │ ▼
   └─── Rate Limiting
   │
   ▼
3. Service Router
   │ ┌─── Route Discovery
   │ │
   │ ▼
   └─── Load Balancing
   │
   ▼
4. Business Logic
   │ ┌─── Data Validation
   │ │
   │ ▼
   └─── Processing
   │
   ▼
5. Data Layer
   │ ┌─── Cache Check
   │ │
   │ ▼
   └─── Database Query
   │
   ▼
6. Response Assembly
   │
   ▼
7. Client Response
\`\`\`

## Mathematical Formulas

### Complex Equations

The SNAP protocol uses elliptic curve cryptography:

$$y^2 = x^3 + ax + b \\pmod{p}$$

Hash function security:

$$H(m) = \\text{SHA-256}(\\text{salt} \\| m \\| \\text{nonce})$$

Digital signature verification:

$$\\text{Verify}(m, s, pk) = \\begin{cases}
\\text{true} & \\text{if } s^e \\equiv H(m) \\pmod{n} \\\\
\\text{false} & \\text{otherwise}
\\end{cases}$$

## PlantUML Diagrams

\`\`\`plantuml
@startuml
!theme plain

actor User
participant "Web App" as Web
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
participant "Database" as DB

User -> Web: Login Request
Web -> Gateway: POST /auth/login
Gateway -> Auth: Validate Credentials
Auth -> DB: Query User
DB --> Auth: User Data
Auth --> Gateway: JWT Token
Gateway --> Web: Auth Response
Web --> User: Login Success

note over User, DB: Authentication Flow Complete
@enduml
\`\`\``;
        }

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should render comprehensive markdown features correctly', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Load comprehensive markdown document
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test basic text formatting
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();

    // Test headings hierarchy
    expect(screen.getByRole('heading', { level: 1, name: 'Comprehensive Markdown Features' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Text Formatting' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Basic Formatting' })).toBeInTheDocument();

    // Test inline code
    expect(screen.getByText('console.log()')).toBeInTheDocument();
    expect(screen.getByText('console.log()').tagName).toBe('CODE');
  });

  it('should render code blocks with proper syntax highlighting', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test JavaScript code block
    const jsCodeBlock = screen.getByText(/function greetUser/);
    expect(jsCodeBlock).toBeInTheDocument();
    expect(jsCodeBlock.closest('pre')).toHaveClass('language-javascript');

    // Test TypeScript code block
    const tsCodeBlock = screen.getByText(/interface User/);
    expect(tsCodeBlock).toBeInTheDocument();
    expect(tsCodeBlock.closest('pre')).toHaveClass('language-typescript');

    // Test Python code block
    const pythonCodeBlock = screen.getByText(/def fibonacci/);
    expect(pythonCodeBlock).toBeInTheDocument();
    expect(pythonCodeBlock.closest('pre')).toHaveClass('language-python');

    // Test Rust code block
    const rustCodeBlock = screen.getByText(/struct Config/);
    expect(rustCodeBlock).toBeInTheDocument();
    expect(rustCodeBlock.closest('pre')).toHaveClass('language-rust');
  });

  it('should render tables with proper formatting', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test simple table
    const simpleTable = screen.getByRole('table');
    expect(simpleTable).toBeInTheDocument();

    // Test table headers
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();

    // Test table cells
    expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '30' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Developer' })).toBeInTheDocument();

    // Test complex table with emojis and formatting
    expect(screen.getByText('✅ Complete')).toBeInTheDocument();
    expect(screen.getByText('🔄 In Progress')).toBeInTheDocument();
    expect(screen.getByText('❌ Pending')).toBeInTheDocument();
  });

  it('should render lists with proper nesting and types', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test unordered lists
    const unorderedList = screen.getByRole('list');
    expect(unorderedList).toBeInTheDocument();

    // Test nested list items
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Nested item 2.1')).toBeInTheDocument();
    expect(screen.getByText('Deep nested item 2.2.1')).toBeInTheDocument();

    // Test ordered lists
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();

    // Test task lists
    const completedTask = screen.getByText('Completed task');
    expect(completedTask.closest('li')).toHaveClass('task-list-item');

    const pendingTask = screen.getByText('Pending task');
    expect(pendingTask.closest('li')).toHaveClass('task-list-item');
  });

  it('should render links with proper attributes and behavior', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test external links
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    const mdnLink = screen.getByRole('link', { name: 'MDN Web Docs' });
    expect(mdnLink).toBeInTheDocument();
    expect(mdnLink).toHaveAttribute('href', 'https://developer.mozilla.org/');

    // Test internal links (anchor links)
    const internalLink = screen.getByRole('link', { name: 'Code Examples' });
    expect(internalLink).toBeInTheDocument();
    expect(internalLink).toHaveAttribute('href', '#code-examples');

    // Test reference-style links
    const refLink = screen.getByRole('link', { name: 'reference link' });
    expect(refLink).toBeInTheDocument();
    expect(refLink).toHaveAttribute('href', 'https://example.com');
    expect(refLink).toHaveAttribute('title', 'Example website');
  });

  it('should render images with proper attributes and lazy loading', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test standard image
    const snapLogo = screen.getByAltText('SNAP Logo');
    expect(snapLogo).toBeInTheDocument();
    expect(snapLogo).toHaveAttribute('src', 'https://example.com/snap-logo.png');
    expect(snapLogo).toHaveAttribute('title', 'SNAP Protocol Logo');
    expect(snapLogo).toHaveAttribute('loading', 'lazy');

    // Test linked image (badge)
    const buildBadge = screen.getByAltText('Build Status');
    expect(buildBadge).toBeInTheDocument();
    expect(buildBadge.closest('a')).toHaveAttribute('href', 'https://example.com/build-status');
  });

  it('should render blockquotes with proper styling and nesting', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test simple blockquote
    const simpleQuote = screen.getByText(/This is a simple blockquote/);
    expect(simpleQuote.closest('blockquote')).toBeInTheDocument();

    // Test multi-line blockquote with formatting
    const multilineQuote = screen.getByText(/This is a multi-line blockquote/);
    expect(multilineQuote.closest('blockquote')).toBeInTheDocument();
    expect(within(multilineQuote.closest('blockquote')).getByText('formatting')).toBeInTheDocument();

    // Test quote with attribution
    const attributedQuote = screen.getByText(/The best way to predict the future/);
    expect(attributedQuote.closest('blockquote')).toBeInTheDocument();
    expect(screen.getByText('— Alan Kay')).toBeInTheDocument();
  });

  it('should handle mathematical expressions with MathJax', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Test inline math
    const inlineMath = screen.getByText(/quadratic formula/);
    expect(inlineMath).toBeInTheDocument();

    // Verify MathJax processing was called
    await waitFor(() => {
      expect(global.MathJax.typesetPromise).toHaveBeenCalled();
    });

    // Test block math
    const blockMath = screen.getByTestId('math-block');
    expect(blockMath).toBeInTheDocument();
    expect(blockMath).toHaveClass('math-display');
  });

  it('should render specialized code languages correctly', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Technical Documentation'));
    await user.click(screen.getByText('01-code-examples.md'));

    await waitFor(() => {
      expect(screen.getByText('Code Examples and Syntax Highlighting')).toBeInTheDocument();
    });

    // Test Go code
    const goCode = screen.getByText(/package main/);
    expect(goCode).toBeInTheDocument();
    expect(goCode.closest('pre')).toHaveClass('language-go');

    // Test JSON
    const jsonCode = screen.getByText(/"@snap\/core"/);
    expect(jsonCode).toBeInTheDocument();
    expect(jsonCode.closest('pre')).toHaveClass('language-json');

    // Test YAML
    const yamlCode = screen.getByText(/apiVersion: v1/);
    expect(yamlCode).toBeInTheDocument();
    expect(yamlCode.closest('pre')).toHaveClass('language-yaml');

    // Test bash script
    const bashCode = screen.getByText(/set -euo pipefail/);
    expect(bashCode).toBeInTheDocument();
    expect(bashCode.closest('pre')).toHaveClass('language-bash');

    // Test pseudocode
    const pseudoCode = screen.getByText(/ALGORITHM QuickSort/);
    expect(pseudoCode).toBeInTheDocument();
    expect(pseudoCode.closest('pre')).toHaveClass('language-pseudocode');

    // Test SQL
    const sqlCode = screen.getByText(/CREATE TABLE users/);
    expect(sqlCode).toBeInTheDocument();
    expect(sqlCode.closest('pre')).toHaveClass('language-sql');
  });

  it('should render Mermaid diagrams correctly', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Technical Documentation'));
    await user.click(screen.getByText('02-diagrams.md'));

    await waitFor(() => {
      expect(screen.getByText('Diagrams and Visual Content')).toBeInTheDocument();
    });

    // Test flowchart
    const flowchartContainer = screen.getByTestId('mermaid-flowchart');
    expect(flowchartContainer).toBeInTheDocument();
    expect(flowchartContainer).toHaveClass('mermaid-diagram');

    // Test sequence diagram
    const sequenceContainer = screen.getByTestId('mermaid-sequence');
    expect(sequenceContainer).toBeInTheDocument();

    // Test class diagram
    const classContainer = screen.getByTestId('mermaid-class');
    expect(classContainer).toBeInTheDocument();

    // Verify mermaid rendering was called
    const mermaid = await import('mermaid');
    expect(mermaid.default.render).toHaveBeenCalled();
  });

  it('should handle advanced formatting features', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('02-formatting.md'));

    await waitFor(() => {
      expect(screen.getByText('Advanced Formatting')).toBeInTheDocument();
    });

    // Test custom alert components
    const infoAlert = screen.getByTestId('alert-info');
    expect(infoAlert).toBeInTheDocument();
    expect(infoAlert).toHaveClass('alert', 'alert-info');

    const warningAlert = screen.getByTestId('alert-warning');
    expect(warningAlert).toBeInTheDocument();
    expect(warningAlert).toHaveClass('alert', 'alert-warning');

    const errorAlert = screen.getByTestId('alert-error');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveClass('alert', 'alert-error');

    const successAlert = screen.getByTestId('alert-success');
    expect(successAlert).toBeInTheDocument();
    expect(successAlert).toHaveClass('alert', 'alert-success');

    // Test emoji rendering
    expect(screen.getByText('😄')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('should sanitize potentially dangerous HTML content', async () => {
    const user = userEvent.setup();

    // Mock document with potentially dangerous content
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('metadata.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            specVersion: '0.1.0',
            sections: [{
              id: '00-security',
              title: 'Security Test',
              documents: ['01-sanitization.md'],
            }],
          }),
        });
      }

      if (url.includes('01-sanitization.md')) {
        const content = `---
title: HTML Sanitization Test
---

# HTML Sanitization Test

This content has dangerous HTML:

<script>alert('XSS Attack!');</script>

<img src="x" onerror="alert('Image XSS')">

<iframe src="javascript:alert('iframe XSS')"></iframe>

Safe content should remain:

<strong>Bold text</strong>
<em>Italic text</em>
<a href="https://example.com">Safe link</a>`;

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Security Test')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Security Test'));
    await user.click(screen.getByText('01-sanitization.md'));

    await waitFor(() => {
      expect(screen.getByText('HTML Sanitization Test')).toBeInTheDocument();
    });

    // Dangerous content should be sanitized (not present)
    expect(screen.queryByText("alert('XSS Attack!');")).not.toBeInTheDocument();
    expect(screen.queryByText("alert('Image XSS')")).not.toBeInTheDocument();
    expect(screen.queryByText("alert('iframe XSS')")).not.toBeInTheDocument();

    // Safe content should remain
    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('Italic text')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Safe link' })).toBeInTheDocument();
  });

  it('should handle copy-to-clipboard functionality for code blocks', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-comprehensive.md'));

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Markdown Features')).toBeInTheDocument();
    });

    // Find and click copy button for JavaScript code block
    const copyButton = screen.getByLabelText('Copy JavaScript code');
    expect(copyButton).toBeInTheDocument();

    await user.click(copyButton);

    // Verify clipboard API was called
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('function greetUser')
    );

    // Should show feedback message
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should support line highlighting in code blocks', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Technical Documentation'));
    await user.click(screen.getByText('01-code-examples.md'));

    await waitFor(() => {
      expect(screen.getByText('Code Examples and Syntax Highlighting')).toBeInTheDocument();
    });

    // Test code block with line numbers
    const codeBlock = screen.getByTestId('code-block-go');
    expect(codeBlock).toHaveClass('line-numbers');

    // Test specific line highlighting
    const highlightedLine = within(codeBlock).getByTestId('line-5');
    expect(highlightedLine).toHaveClass('highlighted-line');
  });
});