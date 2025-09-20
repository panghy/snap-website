---
title: "Task Queue SNAP Example"
order: 1
description: "Reference implementation of a compliant Task Queue SNAP"
---

# Task Queue SNAP Example

This document provides an example of a SNAP-compliant Task Queue implementation that demonstrates all core principles and serves as a reference for building your own SNAPs.

## Overview

A Task Queue SNAP provides reliable, transactionally-aware task queuing functionality. It supports:

- **FIFO task ordering** within each queue
- **Atomic enqueue/dequeue** operations
- **Multi-tenant isolation** via directory partitioning
- **Cross-language compatibility** through standardized data formats
- **Transaction composability** with other SNAPs

## Reference Implementation

A complete, production-ready implementation of a Task Queue SNAP is available at:

**[github.com/panghy/taskqueue](https://github.com/panghy/taskqueue)**

This reference implementation demonstrates:

- Full SNAP compliance with all core principles
- Production-ready error handling and recovery
- Comprehensive test coverage
- Real-world usage patterns and optimizations
- Language bindings for Java, Python, and Go

## Architecture

### Directory Structure

```
/tenants/
  /{tenant-id}/
    /queues/
      /{queue-name}/
        /tasks/          # Individual task storage
        /metadata/       # Queue configuration and stats
        /index/          # Order index for FIFO behavior
```

### Data Model

```java
public class Task {
    private String id;              // Unique task identifier
    private String type;            // Task type/category
    private byte[] payload;         // Serialized task data
    private Instant createdAt;      // Creation timestamp
    private Instant scheduledFor;   // When to process (default: now)
    private int retryCount;         // Number of retry attempts
    private TaskStatus status;      // PENDING, PROCESSING, COMPLETED, FAILED
}

public enum TaskStatus {
    PENDING,     // Waiting to be processed
    PROCESSING,  // Currently being processed
    COMPLETED,   // Successfully completed
    FAILED       // Failed after max retries
}
```

## Core Interface

The Task Queue SNAP exposes the following core operations:

```java
public interface TaskQueueSnap {
    // Enqueue a task for processing
    Task enqueue(Transaction tx, String queueName, TaskData taskData);

    // Dequeue the next available task
    Optional<Task> dequeue(Transaction tx, String queueName);

    // Mark a task as completed
    void complete(Transaction tx, String taskId);

    // Mark a task as failed and optionally retry
    void fail(Transaction tx, String taskId, String error, boolean retry);

    // Get task by ID
    Optional<Task> getTask(Transaction tx, String taskId);
}
```

## Usage Examples

### Basic Usage

```java
// Initialize the Task Queue SNAP with directory configuration
Database db = FDB.selectAPIVersion(730).open();
List<String> queueDirectory = List.of("tenants", "acme-corp", "queues");
TaskQueueSnap taskQueue = new FoundationDBTaskQueueSnap(db, queueDirectory);

// Enqueue a task
TaskData emailTask = TaskData.builder()
    .type("send_email")
    .payload("""
        {
            "to": "user@example.com",
            "subject": "Welcome!",
            "template": "welcome_email"
        }
        """.getBytes())
    .build();

Task task = db.run(tx -> taskQueue.enqueue(tx, "email-queue", emailTask));
System.out.println("Enqueued task: " + task.getId());

// Process tasks
while (true) {
    Optional<Task> taskOpt = db.run(tx ->
        taskQueue.dequeue(tx, "email-queue"));

    if (taskOpt.isPresent()) {
        Task task = taskOpt.get();
        try {
            // Process the task
            processEmailTask(task);

            // Mark as completed
            db.run(tx -> {
                taskQueue.complete(tx, task.getId());
                return null;
            });
        } catch (Exception e) {
            // Mark as failed with retry
            db.run(tx -> {
                taskQueue.fail(tx, task.getId(), e.getMessage(), true);
                return null;
            });
        }
    } else {
        // No tasks available, wait
        Thread.sleep(1000);
    }
}
```

### Multi-SNAP Composition

```java
// Compose with other SNAPs in a single transaction
public class OrderProcessor {
    private final UserSnap userSnap;
    private final OrderSnap orderSnap;
    private final TaskQueueSnap taskQueue;
    private final Database db;

    public OrderProcessor(Database db, String tenantId) {
        this.db = db;
        // Each SNAP gets its own directory configuration
        this.userSnap = new UserSnap(db, List.of("tenants", tenantId, "users"));
        this.orderSnap = new OrderSnap(db, List.of("tenants", tenantId, "orders"));
        this.taskQueue = new FoundationDBTaskQueueSnap(db, List.of("tenants", tenantId, "queues"));
    }

    public OrderResult processOrder(PlaceOrderRequest request) {
        return db.run(tx -> {
            // Validate user exists
            User user = userSnap.getUser(tx, request.getUserId())
                .orElseThrow(() -> new UserNotFoundException(request.getUserId()));

            // Create the order
            Order order = orderSnap.createOrder(tx, Order.builder()
                .userId(user.getId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .build());

            // Queue payment processing
            TaskData paymentTask = TaskData.builder()
                .type("process_payment")
                .payload(serialize(PaymentData.builder()
                    .orderId(order.getId())
                    .amount(order.getTotal())
                    .userId(user.getId())
                    .build()))
                .build();

            taskQueue.enqueue(tx, "payment-queue", paymentTask);

            // Queue order fulfillment
            TaskData fulfillmentTask = TaskData.builder()
                .type("fulfill_order")
                .payload(serialize(FulfillmentData.builder()
                    .orderId(order.getId())
                    .shippingAddress(request.getShippingAddress())
                    .build()))
                .scheduledFor(Instant.now().plus(Duration.ofMinutes(5))) // Delay
                .build();

            taskQueue.enqueue(tx, "fulfillment-queue", fulfillmentTask);

            // All operations succeed atomically or all fail
            return OrderResult.success(order);
        });
    }
}
```

## Key Design Decisions

### 1. FIFO Ordering with Timestamps

Uses timestamp-based ordering in the index to ensure FIFO behavior while supporting delayed execution:

```java
// Index key structure: [timestamp, taskId]
byte[] indexKey = indexDir.pack(task.getScheduledFor().toEpochMilli(), taskId);
```

### 2. Atomic Dequeue

The dequeue operation atomically removes the task from the pending index and marks it as processing, preventing duplicate processing.

### 3. Retry with Exponential Backoff

Failed tasks are automatically retried with exponential backoff, up to a maximum number of attempts.

### 4. Multi-Tenant Isolation

Each tenant has completely isolated queue namespaces through directory partitioning.

### 5. Cross-Language Compatibility

Uses JSON serialization for cross-language compatibility, though Protocol Buffers could be used for better performance.

## Performance Characteristics

### Throughput
- **Enqueue**: ~15,000 ops/sec (single thread)
- **Dequeue**: ~12,000 ops/sec (single thread)
- **Multi-queue workers**: Linear scaling up to FoundationDB limits

### Latency
- **Enqueue**: P50: 2ms, P95: 5ms, P99: 12ms
- **Dequeue**: P50: 3ms, P95: 8ms, P99: 15ms

## Best Practices

### 1. Task Idempotency

Design tasks to be idempotent since they may be retried:

```java
public class EmailTask {
    public void process(EmailTaskData data) {
        // Check if email already sent
        if (emailService.wasEmailSent(data.getUserId(), data.getEmailType())) {
            return; // Already processed, safe to skip
        }

        emailService.sendEmail(data);
        emailService.recordEmailSent(data.getUserId(), data.getEmailType());
    }
}
```

### 2. Error Handling

Distinguish between retryable and non-retryable errors:

```java
try {
    processTask(task);
    taskQueue.complete(tx, task.getId());
} catch (RetryableException e) {
    taskQueue.fail(tx, task.getId(), e.getMessage(), true);
} catch (NonRetryableException e) {
    taskQueue.fail(tx, task.getId(), e.getMessage(), false);
}
```

### 3. Queue Organization

Organize queues by priority and processing characteristics:

```java
// High-priority, time-sensitive tasks
taskQueue.enqueue(tx, "critical-queue", criticalTask);

// Background processing tasks
taskQueue.enqueue(tx, "background-queue", backgroundTask);

// Scheduled tasks with delay
TaskData scheduledTask = TaskData.builder()
    .type("scheduled_task")
    .payload(data)
    .scheduledFor(Instant.now().plus(Duration.ofHours(1)))
    .build();
taskQueue.enqueue(tx, "scheduled-queue", scheduledTask);
```

## Complete Source Code

For the full implementation including:
- Complete Java implementation
- Python and Go client libraries
- Comprehensive test suite
- Performance benchmarks
- Production deployment guides

Visit: **[github.com/panghy/taskqueue](https://github.com/panghy/taskqueue)**

## Next Steps

- Study the [Core Principles](#overview-02-principles) to understand the design rationale
- Review [Transaction Composability](#core-concepts-01-transactions) for composition patterns
- Check [Compliance Requirements](#requirements-01-compliance) for certification criteria