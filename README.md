# SNAPs: Subspace-Native Atomic Pieces

## Why We're Building This

For decades, we've been told that distributed systems require trade-offs. That consistency, availability, and partition tolerance form an impossible trinity. That microservices mean accepting eventual consistency as the price of scale. That coordinating work across services requires complex saga patterns, distributed tracing to debug failures, and acceptance that some operations will leave our systems in inconsistent states.

**We reject this premise entirely.**

## The Problem with Modern Architecture

Today's microservices architecture has become a Rube Goldberg machine of complexity:

- **REST/gRPC endpoints** that can fail independently, leaving partial state everywhere
- **Message queues** that process out of order, duplicate work, or lose messages
- **Distributed transactions** that are so complex, most teams just give up and accept inconsistency
- **Debugging nightmares** where a single business operation spans dozens of services and thousands of log entries
- **Race conditions** that only appear under load, in production, at 3 AM

We've normalized failure. We've accepted that "distributed" means "eventually consistent" means "sometimes broken."

## Enter FoundationDB: The Planet-Scale I/O Layer

FoundationDB isn't just another database. It's a breakthrough in distributed systems—a transactional, ordered key-value store that scales to planet-size while maintaining **strict ACID guarantees**. 

Think of it as the missing primitive in computing: a reliable, distributed storage layer that acts like a single, consistent machine no matter how large it grows.

### What Makes FoundationDB Revolutionary

1. **True ACID Transactions** - Not eventual consistency. Not "mostly consistent." Real, multi-key transactions with serializable isolation.
2. **Ordered Keys** - Natural data locality and efficient range operations
3. **Automatic Sharding & Rebalancing** - It just scales. No manual intervention required.
4. **Battle-Tested at Planet Scale** - See who trusts their infrastructure to FoundationDB below
5. **Deterministic Simulation Testing** - FoundationDB has been tested against millions of failure scenarios

### Who's Already Building on This Foundation

**Apple** — Powers CloudKit and iCloud, managing billions of independent databases for every user of every application. The FoundationDB Record Layer serves hundreds of millions of users, providing the backbone for Apple's cloud services with extreme multi-tenancy.

**Snowflake** — The heart of every Snowflake deployment is a FoundationDB cluster managing all metadata operations. It orchestrates catalog information, user management, table statistics, and enables Snowflake's time-travel and zero-copy cloning capabilities across AWS, Azure, and Google Cloud.

**VMware (Wavefront)** — One of the largest production users with over 50 clusters spanning petabytes of data. Wavefront relies on FoundationDB for its distributed systems monitoring and analytics platform.

**Epic Games** — Runs FoundationDB on thousands of machines to support their gaming infrastructure, handling the massive scale required for global gaming platforms.

These aren't startups experimenting—these are companies operating at planetary scale, trusting FoundationDB with their most critical infrastructure.

## SNAPs: Subspace-Native Atomic Pieces

SNAPs are composable building blocks that leverage FoundationDB's guarantees to create reliable distributed systems. They're not libraries in the traditional sense—they're **architectural components** that snap together to form complete systems.

### SNAP Specification Core Principles

1. **Directories, Not Keys**: SNAPs must use FoundationDB's Directory layer, never touching raw keys directly. This ensures namespace isolation and composability.

2. **Minimal Dependencies**: SNAPs should depend only on FoundationDB and essential APIs (logging, telemetry, serialization). No framework lock-in.

3. **Transaction Composability**: SNAPs must expose operations as transaction functions that accept external transactions. Multiple SNAPs must be combinable in a single atomic operation.

4. **Multi-Tenancy by Design**: SNAPs must support multiple tenants accessing their subspace simultaneously through directory prefixing.

5. **Language-Native**: Implementations should be idiomatic to each language while maintaining cross-language compatibility for data formats.

## A New Way to Build

Imagine this scenario:

```java
// One transaction, multiple SNAPs, complete atomicity
db.run(tx -> {
    // Create a user account
    User user = userSnap.create(tx, userData);
    
    // Store their profile image
    blobSnap.store(tx, user.id, profileImage);
    
    // Queue welcome email
    queueSnap.enqueue(tx, new WelcomeEmail(user));
    
    // Index for search
    searchSnap.index(tx, user);
    
    // Update analytics
    analyticsSnap.recordSignup(tx, user);
    
    return user;
});
```

Either **all** of this succeeds, or **none** of it does. No partial states. No cleanup code. No saga patterns. No distributed tracing to figure out what went wrong.

### The Microservices Paradox Resolved

You can still have microservices! But instead of each service managing its own inconsistent state:

- Services become **stateless compute nodes**
- All state lives in FoundationDB, partitioned by SNAPs
- Any service can coordinate work across multiple domains atomically
- Horizontal scaling without sacrificing consistency

A signup service can atomically coordinate user creation, blob storage, and queue operations. A thumbnail service can pick up queued work and process it. Both use the same SNAPs, both maintain consistency, both scale independently.

## The SNAP Catalogue Website

This website serves as a community catalogue for discovering SNAP-compliant layers:

- **Browse SNAPs** by category: Task Queues, Blob Stores, Search Indices, Graph Databases, Time-Series stores, and more
- **Filter by language**: Java, Python, Go, Rust, C++, and growing
- **GitHub Integration**: See stars, latest releases, and activity
- **Direct Repository Links**: Each SNAP links to its own repository
- **Community Driven**: Submit your SNAP via pull request

**Note**: The website is a catalogue only—all SNAPs are hosted in their own repositories and maintained by their respective authors.

## The Future We're Building

We envision a world where:

- **Distributed systems are simple** because the hard problems are solved at the storage layer
- **Consistency is the default**, not a luxury
- **Components are truly reusable** across teams, companies, and industries
- **Scale isn't scary** because the foundation handles it
- **Business logic is clear** without being obscured by distributed systems plumbing

## Getting Started

### Using SNAPs

1. Browse the catalogue at [snaps.dev](https://snaps.dev)
2. Find SNAPs that solve your problems
3. Install them from their respective repositories
4. Compose them together in atomic transactions

### Building SNAPs

1. Read the full SNAP specification (docs/specification.md)
2. Build your layer following the standards
3. Publish to your repository
4. Submit a PR to add your SNAP to the catalogue

### Contributing to the Specification

The SNAP specification is open source and evolves with community input:

- Open issues for specification discussions
- Submit PRs for specification improvements
- Share patterns and best practices
- Help define language-specific requirements

**Build atomic. Build composable. Build SNAPs.**

---

*Built with FoundationDB. Composed with SNAPs. Designed for developers who refuse to accept that distributed must mean broken.*