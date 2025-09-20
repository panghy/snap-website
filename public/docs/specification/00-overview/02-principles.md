---
title: "Core Principles of SNAPs"
description: "Fundamental principles that guide SNAP development and ensure composability"
---

# Core Principles of SNAPs

These principles form the foundation of the SNAP ecosystem. Every SNAP implementation must adhere to these principles to ensure composability and maintain the guarantees that make SNAPs effective.

## I. Specification-First Development

Every SNAP implementation must adhere strictly to the SNAPs specification. The specification defines the contract for composability, ensuring that any SNAP can be combined atomically with any other SNAP regardless of language or implementation details.

### Requirements
- Documentation must clearly indicate specification version compliance
- Any deviations from the specification must be explicitly noted and justified
- Breaking changes require specification version updates
- Implementation decisions must prioritize specification compliance over convenience

### Why This Matters
Without strict specification adherence, the promise of atomic composability breaks down. A SNAP that deviates from the specification may work in isolation but fail when composed with other SNAPs, defeating the entire purpose of the ecosystem.

## II. Language-Agnostic Specifications

SNAP specifications MUST live independently of any specific language implementation. This separation enables the specification to evolve through community discussion and allows multiple implementations across different languages and paradigms.

### Requirements
- Specifications should be maintained in a language-neutral format (e.g., markdown, OpenAPI, Protocol Buffers)
- The specification repository should be separate from implementation repositories
- Specifications must define behavior, not implementation details
- Multiple implementations of the same specification are encouraged

### Benefits of Separation
- **Independent Evolution**: Specifications can evolve based on community needs without being tied to a specific implementation's release cycle
- **Multiple Implementations**: The same specification can have multiple implementations in the same language (e.g., futures-based vs reactive Java implementations)
- **Cross-Language Consistency**: Teams can choose their preferred language while maintaining compatibility
- **Community Discussion**: Specification changes can be discussed without implementation bias

### Example Repository Structure

Each specification and implementation lives in its own repository:

**Specification Repository:**
```
github.com/example/snap-taskqueue-spec
├── README.md                    # Overview and compliance requirements
├── specification.md             # Detailed behavior specification
├── data-format.proto            # Language-neutral data format
├── test-cases.json              # Standard test cases
└── CHANGELOG.md                 # Specification version history
```

**Java Implementation:**
```
github.com/example/snap-taskqueue-java
├── README.md                    # Links to spec repo & version 1.2.0
├── pom.xml                      # Dependencies on FoundationDB
└── src/main/java/               # Implementation
```

**Alternative Java Implementation (Reactive):**
```
github.com/reactive/snap-taskqueue-java
├── README.md                    # Links to spec repo & version 1.2.0
├── build.gradle                 # Reactive dependencies
└── src/main/java/               # Reactive-style implementation
```

**Python Implementation:**
```
github.com/pythonic/snap-taskqueue-python
├── README.md                    # Links to spec repo & version 1.2.0
├── requirements.txt             # FoundationDB client dependency
└── src/                         # Pythonic implementation
```

### Catalogue Integration
The SNAP catalogue supports this model by:
- Allowing submission of standalone specifications
- Associating multiple implementations with a single specification
- Tracking specification version compliance for each implementation
- Enabling discovery of alternative implementations for the same specification

## III. Transaction Composability

All SNAPs MUST expose operations as transaction functions that accept external FoundationDB transactions. This enables the fundamental promise of SNAPs: multiple operations across different layers executing as a single atomic unit.

### Requirements
- All public operations must accept a `Transaction` parameter
- SNAPs must never manage their own transaction lifecycle when composed
- Operations must be idempotent within a transaction
- Retry logic must be handled at the transaction level, not within SNAPs

### Example
```java
// Correct: Always expose transaction as a parameter for composability
public User createUser(Transaction tx, UserData userData) {
    // Implementation uses provided transaction
}

// Also correct: Convenience overload that creates its own transaction
public User createUser(UserData userData) {
    return db.run(tx -> createUser(tx, userData));
}

// Incorrect: Only provides method without transaction parameter
public User createUserOnly(UserData userData) {
    return db.run(tx -> {
        // This prevents composition with other SNAPs
        // because no transaction parameter is exposed
    });
}
```

## IV. Namespace Isolation via Directories

SNAPs MUST use FoundationDB's Directory layer exclusively - never raw keys. This ensures complete namespace isolation between SNAPs and enables safe multi-tenancy.

### Requirements
- Use `DirectorySubspace` for all key operations
- Never construct raw keys directly
- Support directory prefixing for multi-tenancy
- Maintain clear boundaries between SNAP subspaces

### Directory Structure
```
/tenant-1/
  /user-snap/
    user data...
  /queue-snap/
    queue data...
/tenant-2/
  /user-snap/
    user data...
  /queue-snap/
    queue data...
```

### Why Directories Matter
- **Isolation**: Complete separation between SNAPs and tenants
- **Safety**: No risk of key collisions
- **Composability**: Multiple SNAPs can coexist safely
- **Multi-tenancy**: Built-in support for tenant isolation

## V. Language-Agnostic Interoperability

While implementations should be idiomatic to each language, data formats and protocols MUST be language-agnostic. A SNAP written in Java must be able to read data written by a SNAP in Python.

### Requirements
- Use standard serialization formats (e.g., Protocol Buffers, msgpack)
- Define byte ordering and encoding standards
- Document data format specifications
- Provide cross-language compatibility tests

### Implementation Guidelines
- Choose serialization formats with wide language support
- Avoid language-specific features in stored data
- Use standard encodings (UTF-8 for strings, little-endian for numbers)
- Version all data formats for future evolution

## VI. Minimal Dependencies

SNAPs MUST depend only on FoundationDB and essential APIs (logging, telemetry, serialization). Framework lock-in is explicitly forbidden.

### Allowed Dependencies
- FoundationDB client libraries
- Standard logging frameworks
- Telemetry/metrics libraries
- Serialization libraries
- Language-standard libraries

### Forbidden Dependencies
- Web frameworks
- Application servers
- ORM frameworks
- Heavy runtime dependencies
- Platform-specific libraries

### Why Minimal Dependencies Matter
- **Composability**: SNAPs work in any application architecture
- **Longevity**: Fewer dependencies mean fewer breaking changes
- **Flexibility**: Teams can choose their preferred stack
- **Performance**: Lighter weight with faster startup times

## VII. Multi-Tenancy by Design

SNAPs MUST support concurrent access by multiple tenants through directory prefixing. Isolation between tenants must be complete - no shared state, no cross-tenant data leakage, and no performance interference.

### Requirements
- Support tenant-specific directory subspaces
- Implement complete isolation between tenants
- Ensure no shared mutable state
- Provide tenant-scoped operations

### Implementation Pattern
```java
public class UserSnap {
    private final DirectorySubspace tenantDir;

    public UserSnap(Database db, String tenantId) {
        this.tenantDir = DirectoryLayer.getDefault()
            .createOrOpen(db, List.of("tenants", tenantId, "users"))
            .get();
    }

    public User getUser(Transaction tx, String userId) {
        // All operations scoped to tenant directory
        byte[] userData = tx.get(tenantDir.pack(userId)).get();
        // ...
    }
}
```

### Benefits of Multi-Tenancy
- **Resource Efficiency**: Multiple tenants share infrastructure
- **Isolation**: Complete separation between tenant data
- **Scalability**: Add tenants without architectural changes
- **Cost Effectiveness**: Shared operational overhead

## Quality Standards

### Documentation Requirements
- Comprehensive API documentation
- Usage examples demonstrating transaction composition
- Performance characteristics and limitations
- Migration guides for version upgrades
- Clear specification version compatibility matrix

### Testing Discipline
- Unit tests for all public APIs
- Integration tests demonstrating multi-SNAP transactions
- Deterministic simulation tests where applicable
- Performance benchmarks with documented baselines
- Multi-tenancy isolation verification tests

### Versioning Standards
- Semantic versioning (MAJOR.MINOR.PATCH) is mandatory
- MAJOR changes indicate specification incompatibility
- MINOR changes add functionality while maintaining compatibility
- PATCH changes are bug fixes with no API changes
- Breaking changes require migration documentation

## Enforcement

These principles are not suggestions - they are requirements for SNAP certification. SNAPs that violate these principles will not be accepted into the official catalogue, regardless of their functionality or quality.

The community maintains automated and manual verification processes to ensure compliance with these principles.

## Next Steps

- Review [Transaction Composability](#core-concepts-01-transactions) for implementation details
- Understand [Directory Usage](#core-concepts-02-directories) for namespace isolation
- Check [Compliance Requirements](#requirements-01-compliance) for certification criteria