---
title: "Introduction to SNAPs"
description: "Overview of Subspace-Native Atomic Pieces and their role in the FoundationDB ecosystem"
---

# Introduction to SNAPs

## What are SNAPs?

SNAPs (Subspace-Native Atomic Pieces) are a systematic approach to building distributed systems on top of FoundationDB. They are composable, production-ready implementations of common data structures and patterns that leverage FoundationDB's unique capabilities.

Unlike traditional microservices or libraries, SNAPs are designed from the ground up to be **atomically composable** - meaning multiple operations across different SNAPs can execute as a single ACID transaction.

## The Problem SNAPs Solve

Distributed systems traditionally involve challenging trade-offs:

- **Microservices** often mean accepting eventual consistency as the price of scale
- **Coordinating work** across services requires complex saga patterns and distributed tracing
- **Debugging failures** requires correlating logs across multiple systems
- **Some operations** can leave systems in inconsistent states

These trade-offs have been considered fundamental - that consistency, availability, and partition tolerance form an impossible trinity.

**SNAPs offer a different approach by leveraging FoundationDB's capabilities.**

## Why SNAPs Matter

By building on FoundationDB's transactional foundation, SNAPs enable:

### 1. True Atomic Composition
Multiple operations across different data structures execute as one transaction. Update a queue, a search index, and a blob store atomically - if any operation fails, they all roll back.

### 2. Guaranteed Consistency
No more eventual consistency, no more distributed sagas, no more reconciliation jobs. Every operation is immediately consistent across all SNAPs.

### 3. Language Agnosticism
A SNAP written in Java can coexist and interoperate with the same SNAP specification implemented in Python, Go, or Rust. While transaction composability is limited to operations within a single language runtime, different language implementations of the same SNAP can share the same data through FoundationDB.

### 4. Production Ready
Each SNAP is thoroughly tested and optimized for production use, eliminating the need to reinvent common patterns.

## Core Principles

Every SNAP adheres to these fundamental principles:

1. **Specification-First Development**: Strict adherence to the SNAP specification ensures composability
2. **Language-Agnostic Specifications**: Specifications live independently of implementations
3. **Transaction Composability**: All operations exposed as transaction functions
4. **Namespace Isolation**: Complete isolation via FoundationDB directories
5. **Language-Agnostic Interoperability**: Data formats and protocols that work across languages
6. **Minimal Dependencies**: Only FoundationDB and essential APIs
7. **Multi-Tenancy by Design**: Built-in support for concurrent access by multiple tenants

## Getting Started

To understand SNAPs, you need to understand three key concepts:

1. **Transactions**: The atomic unit of work in FoundationDB
2. **Directories**: How SNAPs achieve namespace isolation
3. **Composability**: How multiple SNAPs work together

The following sections will explore each of these concepts in detail, providing you with the foundation needed to build and use SNAPs effectively.

## Next Steps

- Learn about [Core Concepts](#core-concepts-01-transactions)
- Explore [Example Implementations](#examples-01-task-queue)
- Review the [Compliance Requirements](#requirements-01-compliance)