---
title: "SNAP Compliance Requirements"
description: "Comprehensive requirements for SNAP certification and catalogue inclusion"
---

# SNAP Compliance Requirements

This document defines the comprehensive requirements for SNAP certification. All SNAPs submitted to the official catalogue must meet these requirements to ensure compatibility, reliability, and maintainability.

## Core Architectural Requirements

### 1. Directory Layer Usage

**Requirement**: SNAPs MUST use FoundationDB's Directory layer exclusively for all key operations AND accept their operating directory as a configuration parameter.

**Verification**:
- ✅ All key operations use `DirectorySubspace.pack()` and `DirectorySubspace.unpack()`
- ✅ No raw key construction (e.g., string concatenation, manual byte arrays)
- ✅ Directory paths follow consistent naming conventions
- ✅ Multi-tenant isolation through directory prefixing
- ✅ **CRITICAL**: Directory path MUST be provided as constructor or configuration parameter
- ✅ No hardcoded directory paths allowed

```java
// ✅ COMPLIANT - Directory provided as parameter
public class UserSnap {
    private final DirectorySubspace userDir;

    public UserSnap(Database db, List<String> directoryPath) {
        this.userDir = DirectoryLayer.getDefault()
            .createOrOpen(db, directoryPath).get();
    }
}

// Usage enables multiple isolated instances
UserSnap prodUsers = new UserSnap(db, List.of("prod", "users"));
UserSnap testUsers = new UserSnap(db, List.of("test", "users"));

// ❌ NON-COMPLIANT - Hardcoded directory
public class UserSnap {
    public UserSnap(Database db) {
        // Never hardcode paths - prevents isolation and portability!
        this.userDir = DirectoryLayer.getDefault()
            .createOrOpen(db, List.of("users")).get();
    }
}
```

**Rationale for Directory Configuration**:
- Enables multiple SNAP instances with complete isolation
- Allows moving/copying entire SNAP state via directory operations
- Facilitates testing with separate directory namespaces
- Supports backup/restore and disaster recovery scenarios
- Enables gradual migrations between SNAP versions

### 2. Transaction Composability

**Requirement**: All state-modifying operations MUST accept external FoundationDB transactions.

**Verification**:
- ✅ All public write operations accept `Transaction` parameter
- ✅ No internal transaction management when composed
- ✅ Operations are idempotent within a transaction
- ✅ Proper exception handling for transaction failures

```java
// ✅ COMPLIANT
public User createUser(Transaction tx, UserData userData) {
    // Uses provided transaction
}

// ❌ NON-COMPLIANT
public User createUser(UserData userData) {
    return db.run(tx -> {
        // Manages own transaction - prevents composition
    });
}
```

### 3. Minimal Dependencies

**Requirement**: SNAPs MUST have minimal external dependencies.

**Allowed Dependencies**:
- FoundationDB client libraries
- Standard logging frameworks (SLF4J, logback, etc.)
- Metrics/telemetry libraries (Micrometer, Dropwizard Metrics)
- Serialization libraries (Jackson, Protocol Buffers, MessagePack)
- Language standard libraries
- Testing frameworks (for tests only)

**Forbidden Dependencies**:
- Web frameworks (Spring Boot, Express, Flask)
- Application servers
- ORM frameworks
- Database drivers (other than FoundationDB)
- Heavy runtime dependencies

### 4. Language-Agnostic Data Formats

**Requirement**: Data formats MUST be language-agnostic for cross-language compatibility.

**Verification**:
- ✅ Uses standard serialization formats (JSON, Protocol Buffers, MessagePack)
- ✅ Documented byte ordering and encoding standards
- ✅ Version compatibility matrix provided
- ✅ Cross-language compatibility tests

## Documentation Requirements

### 1. API Documentation

**Required Sections**:
- Complete API reference with parameter descriptions
- Return value specifications
- Exception conditions and error handling
- Thread safety guarantees
- Performance characteristics

**Example Structure**:
```markdown
## createUser(Transaction tx, UserData userData)

Creates a new user within the provided transaction.

**Parameters:**
- `tx` (Transaction): FoundationDB transaction for atomic operations
- `userData` (UserData): User information to store

**Returns:**
- `User`: Created user object with generated ID

**Throws:**
- `DuplicateEmailException`: If email already exists
- `ValidationException`: If user data is invalid

**Thread Safety:** Thread-safe when using different transactions
**Performance:** O(1) write operation
```

### 2. Usage Examples

**Required Examples**:
- Basic usage demonstration
- Multi-SNAP transaction composition
- Error handling patterns
- Multi-tenancy setup

```java
// Required: Basic usage example
UserSnap userSnap = new UserSnap(db, List.of("tenants", "acme", "users"));
User user = db.run(tx -> userSnap.createUser(tx, userData));

// Required: Composition example
db.run(tx -> {
    User user = userSnap.createUser(tx, userData);
    profileSnap.createProfile(tx, user.getId(), profileData);
    queueSnap.enqueue(tx, new WelcomeEmailTask(user));
    return user;
});
```

### 3. Migration Documentation

**Required for Major Versions**:
- Breaking changes summary
- Step-by-step migration guide
- Backward compatibility notes
- Data migration scripts if needed

## Testing Requirements

### 1. Unit Tests

**Coverage Requirements**:
- ✅ Minimum 80% code coverage
- ✅ All public API methods tested
- ✅ Error conditions tested
- ✅ Edge cases covered

**Required Test Categories**:
```java
@Test
public void testCreateUser_ValidData_ReturnsUser() {
    // Test normal operation
}

@Test
public void testCreateUser_DuplicateEmail_ThrowsException() {
    // Test error conditions
}

@Test
public void testCreateUser_NullTransaction_ThrowsException() {
    // Test parameter validation
}
```

### 2. Integration Tests

**Requirements**:
- ✅ Multi-SNAP transaction composition tests
- ✅ Concurrent access tests
- ✅ Large dataset performance tests
- ✅ Multi-tenancy isolation verification

```java
@Test
public void testMultiSnapComposition() {
    db.run(tx -> {
        User user = userSnap.createUser(tx, userData);
        Order order = orderSnap.createOrder(tx, user.getId(), orderData);
        queueSnap.enqueue(tx, new ProcessOrderTask(order.getId()));
        // All operations must succeed or all must fail
        return user;
    });
}
```

### 3. Performance Benchmarks

**Required Benchmarks**:
- Single operation throughput
- Multi-operation transaction performance
- Memory usage under load
- Concurrent access scalability

**Benchmark Documentation**:
```markdown
## Performance Characteristics

**Single User Creation:**
- Throughput: 10,000 ops/sec (single thread)
- Latency: P50: 2ms, P95: 5ms, P99: 10ms

**Multi-SNAP Transactions:**
- User + Profile + Queue: P95: 8ms
- Memory: ~100KB per 1000 operations

**Test Environment:**
- FoundationDB 7.3.0
- 3-node cluster
- AWS m5.large instances
```

## Multi-Tenancy Requirements

### 1. Tenant Isolation

**Requirements**:
- ✅ Complete data isolation between tenants
- ✅ No shared mutable state
- ✅ Performance isolation (no tenant interference)
- ✅ Secure tenant ID validation

```java
// Required: Tenant validation
public void validateTenantId(String tenantId) {
    if (tenantId == null || tenantId.trim().isEmpty()) {
        throw new IllegalArgumentException("Tenant ID required");
    }
    if (tenantId.contains("..") || tenantId.length() > 100) {
        throw new SecurityException("Invalid tenant ID");
    }
}
```

### 2. Tenant-Scoped Operations

**Requirements**:
- ✅ All operations scoped to tenant directory
- ✅ Range scans limited to tenant data
- ✅ No cross-tenant data leakage
- ✅ Tenant-specific metrics and monitoring

## Versioning and Compatibility

### 1. Semantic Versioning

**Requirements**:
- ✅ Follow semantic versioning (MAJOR.MINOR.PATCH)
- ✅ MAJOR: Breaking changes (specification incompatibility)
- ✅ MINOR: New features (backward compatible)
- ✅ PATCH: Bug fixes (no API changes)

### 2. Compatibility Matrix

**Required Documentation**:

Each SNAP implementation must maintain a compatibility matrix showing which versions target which specification:

```markdown
## Compatibility Matrix

### UserSNAP for Java

| Implementation Version | SNAP Spec Version | FoundationDB | Java | Status |
|------------------------|-------------------|--------------|------|--------|
| 1.0.x                  | 0.1.0             | 7.1+         | 11+  | Stable |
| 1.1.x                  | 0.1.0             | 7.1+         | 11+  | Stable |
| 2.0.x                  | 0.2.0             | 7.3+         | 17+  | Beta   |

### UserSNAP for Python

| Implementation Version | SNAP Spec Version | FoundationDB | Python | Status |
|------------------------|-------------------|--------------|--------|--------|
| 0.8.x                  | 0.1.0             | 7.1+         | 3.8+   | Stable |
| 1.0.x                  | 0.2.0             | 7.3+         | 3.9+   | Stable |
```

**Important**:
- Each released version of a SNAP implementation targets exactly one SNAP specification version
- Different language implementations maintain independent version numbers
- Major version changes may indicate specification version changes, but this is not required

## Quality Assurance

### 1. Code Quality

**Requirements**:
- ✅ Consistent code style (language-specific guidelines)
- ✅ Comprehensive error handling
- ✅ Proper logging and instrumentation
- ✅ Security best practices

### 2. Security

**Requirements**:
- ✅ Input validation and sanitization
- ✅ Protection against injection attacks
- ✅ Secure tenant isolation
- ✅ No hardcoded credentials or secrets

```java
// Required: Input validation
public User getUser(Transaction tx, String tenantId, String userId) {
    validateTenantId(tenantId);
    validateUserId(userId);
    // Implementation...
}
```

## Catalogue Submission Requirements

### 1. Repository Structure

**Required Files**:
```
your-snap-repo/
├── README.md                    # Project overview and quick start
├── LICENSE                      # Open source license
├── CHANGELOG.md                 # Version history
├── docs/
│   ├── api-reference.md         # Complete API documentation
│   ├── examples.md              # Usage examples
│   └── migration-guide.md       # Version migration guide
├── src/                         # Source code
├── tests/                       # Test suites
└── benchmarks/                  # Performance benchmarks
```

### 2. README Requirements

**Required Sections**:
- Project description and purpose
- SNAP specification version compliance
- Installation instructions
- Quick start example
- Link to full documentation
- Contribution guidelines
- License information

### 3. Catalogue Entry Format

**Required Metadata**:
```yaml
name: "User Management SNAP"
description: "User account management with profile support"
category: "User Management"
languages:
  - java: "11+"
  - python: "3.8+"
repository: "https://github.com/example/user-snap"
documentation: "https://github.com/example/user-snap/docs"
license: "Apache-2.0"
specification_version: "1.0"
foundationdb_version: "7.1+"
maintainers:
  - name: "Jane Doe"
    email: "jane@example.com"
    github: "janedoe"
```

## Compliance Verification Process

### 1. Automated Checks

**Repository Analysis**:
- ✅ Required files present
- ✅ Documentation completeness
- ✅ Test coverage analysis
- ✅ Dependency analysis

### 2. Manual Review

**Code Review**:
- ✅ Architecture compliance
- ✅ API design quality
- ✅ Documentation accuracy
- ✅ Example correctness

### 3. Community Feedback

**Public Review Period**:
- 7-day community review period
- Issue tracking for feedback
- Required fixes before approval
- Final maintainer approval

## Compliance Checklist

Use this checklist before submitting your SNAP:

### Architecture
- [ ] Uses Directory layer exclusively
- [ ] Directory path provided as constructor/config parameter (not hardcoded)
- [ ] All write operations accept Transaction parameter
- [ ] Minimal dependencies only
- [ ] Language-agnostic data formats

### Documentation
- [ ] Complete API reference
- [ ] Usage examples provided
- [ ] Migration guide (if applicable)
- [ ] Performance characteristics documented

### Testing
- [ ] Unit tests with 80%+ coverage
- [ ] Integration tests included
- [ ] Performance benchmarks provided
- [ ] Multi-tenancy tests pass

### Quality
- [ ] Code follows style guidelines
- [ ] Security best practices followed
- [ ] Proper error handling
- [ ] Input validation implemented

### Repository
- [ ] All required files present
- [ ] README follows template
- [ ] License included
- [ ] Changelog maintained

## Next Steps

- Review the [Task Queue Example](#examples-01-task-queue) for a compliant implementation
- Study [Core Principles](#overview-02-principles) for architectural guidance
- Explore [Transaction Composability](#core-concepts-01-transactions) for implementation patterns