---
title: "Transaction Composability"
description: "Understanding how SNAPs achieve atomic composability through FoundationDB transactions"
---

# Transaction Composability

Transaction composability is the foundational concept that makes SNAPs effective. Unlike traditional microservices that force you to choose between consistency and composability, SNAPs enable multiple operations across different data structures to execute as a single atomic unit.

## The Promise of Atomic Composition

Imagine you're building an e-commerce platform. When a user places an order, you need to:

1. Deduct inventory from the product catalog
2. Create an order record
3. Queue payment processing
4. Update user purchase history
5. Index the order for search
6. Record analytics data

In traditional architectures, this requires complex distributed transaction handling. With SNAPs, it becomes straightforward:

```java
// One transaction, multiple SNAPs, complete atomicity
OrderResult result = db.run(tx -> {
    // Check and reserve inventory
    Product product = catalogSnap.reserveInventory(tx, productId, quantity);

    // Create the order
    Order order = orderSnap.createOrder(tx, userId, product, quantity);

    // Queue payment processing
    queueSnap.enqueue(tx, new PaymentJob(order.id, order.total));

    // Update user history
    userSnap.addPurchase(tx, userId, order);

    // Index for search
    searchSnap.indexOrder(tx, order);

    // Record analytics
    analyticsSnap.recordPurchase(tx, order);

    return new OrderResult(order, product);
});
```

Either **all** of these operations succeed, or **none** of them do. No partial states, no cleanup code, no saga patterns.

## How Transaction Composability Works

### The Transaction Parameter Pattern

Every SNAP operation that modifies state must accept a `Transaction` parameter:

```java
public interface UserSnap {
    // Correct: Accepts external transaction
    User createUser(Transaction tx, UserData userData);
    void updateUser(Transaction tx, String userId, UserUpdate update);
    void deleteUser(Transaction tx, String userId);

    // Read operations can be transactional or non-transactional
    User getUser(Transaction tx, String userId);
    User getUser(String userId); // Convenience method for single reads
}
```

### Transaction Lifecycle Management

SNAPs must **never** manage their own transaction lifecycle when composed with other SNAPs:

```java
// ❌ WRONG - This prevents composition
public class BadUserSnap {
    public User createUser(UserData userData) {
        return db.run(tx -> {
            // This transaction can't be composed with others
            return doCreateUser(tx, userData);
        });
    }
}

// ✅ CORRECT - Accepts external transaction
public class GoodUserSnap {
    public User createUser(Transaction tx, UserData userData) {
        // Uses the provided transaction
        return doCreateUser(tx, userData);
    }

    // Convenience method for standalone use
    public User createUser(UserData userData) {
        return db.run(tx -> createUser(tx, userData));
    }
}
```

### Operation Idempotency

Operations within a transaction must be idempotent to handle FoundationDB's automatic retries:

```java
public void updateUserEmail(Transaction tx, String userId, String newEmail) {
    // Get current state
    return tx.get(userKey(userId)).thenCompose(userData -> {
        if (userData == null) {
        throw new UserNotFoundException(userId);
    }

    User user = deserialize(userData);

    // Idempotent update - safe to retry
    user.setEmail(newEmail);
    user.setUpdatedAt(Instant.now());

    tx.set(userKey(userId), serialize(user));
}
```

## Composition Patterns

### Multi-SNAP Workflows

Complex business operations often span multiple domains. SNAPs make these workflows atomic:

```java
public class OrderService {
    private final InventorySnap inventory;
    private final OrderSnap orders;
    private final PaymentQueueSnap paymentQueue;
    private final NotificationQueueSnap notifications;
    private final Database db;

    public OrderResult placeOrder(PlaceOrderRequest request) {
        return db.run(tx -> {
            // Atomic workflow across multiple SNAPs
            Product product = inventory.checkAvailability(tx,
                request.getProductId(), request.getQuantity());

            if (!product.hasStock(request.getQuantity())) {
                throw new InsufficientInventoryException();
            }

            // Reserve inventory
            inventory.reserve(tx, product.getId(), request.getQuantity());

            // Create order
            Order order = orders.create(tx, Order.builder()
                .userId(request.getUserId())
                .productId(product.getId())
                .quantity(request.getQuantity())
                .total(product.getPrice().multiply(request.getQuantity()))
                .build());

            // Queue payment processing
            paymentQueue.enqueue(tx, PaymentJob.builder()
                .orderId(order.getId())
                .amount(order.getTotal())
                .userId(order.getUserId())
                .build());

            // Queue order confirmation email
            notifications.enqueue(tx, OrderConfirmationEmail.builder()
                .orderId(order.getId())
                .userEmail(request.getUserEmail())
                .build());

            return OrderResult.success(order);
        });
    }
}
```

### Error Handling and Rollbacks

Transaction composability includes automatic rollback on any failure:

```java
public UserAccountResult createUserAccount(CreateAccountRequest request) {
    try {
        return db.run(tx -> {
            // Validate email uniqueness
            if (userSnap.emailExists(tx, request.getEmail())) {
                throw new EmailAlreadyExistsException(request.getEmail());
            }

            // Create user
            User user = userSnap.createUser(tx, request.getUserData());

            // Create user profile
            Profile profile = profileSnap.createProfile(tx, user.getId(),
                request.getProfileData());

            // Set up user preferences
            preferencesSnap.initializeDefaults(tx, user.getId());

            // Queue welcome email
            emailSnap.queueWelcomeEmail(tx, user);

            // If any operation fails, ALL operations roll back
            return UserAccountResult.success(user, profile);
        });
    } catch (EmailAlreadyExistsException e) {
        return UserAccountResult.emailTaken(e.getEmail());
    } catch (Exception e) {
        return UserAccountResult.error(e.getMessage());
    }
}
```

## Transaction Boundaries and Performance

### Optimal Transaction Size

Keep transactions focused and reasonably sized:

```java
// ✅ Good - Focused transaction
public void updateUserProfile(String userId, ProfileUpdate update) {
    db.run(tx -> {
        profileSnap.updateProfile(tx, userId, update);
        searchSnap.reindexUser(tx, userId);
        return null;
    });
}

// ❌ Avoid - Transaction too large
public void processBulkUserUpdates(List<UserUpdate> updates) {
    db.run(tx -> {
        // Processing thousands of updates in one transaction
        // Can cause conflicts and performance issues
        for (UserUpdate update : updates) {
            userSnap.updateUser(tx, update);
        }
        return null;
    });
}
```

### Conflict Avoidance

Design operations to minimize transaction conflicts:

```java
// ✅ Good - Reads specific keys only
public UserProfile getUserProfile(Transaction tx, String userId) {
    return profileSnap.getProfile(tx, userId);
}

// ❌ Avoid - Reads large ranges unnecessarily
public List<UserProfile> getAllProfiles(Transaction tx) {
    // This creates conflicts with any other profile operation
    return profileSnap.scanAllProfiles(tx);
}
```

## Cross-Language Composition

SNAPs written in different languages can compose seamlessly:

```python
# Python service
def process_image_upload(user_id: str, image_data: bytes) -> ProcessingResult:
    @fdb.transactional
    def txn_func(tr):
        # Python SNAP stores the image
        blob_id = blob_snap.store_blob(tr, image_data)

        # Queue processing job for Java service
        queue_snap.enqueue(tr, {
            'type': 'image_processing',
            'blob_id': blob_id,
            'user_id': user_id,
            'timestamp': time.time()
        })

        # Update user's image list
        user_snap.add_user_image(tr, user_id, blob_id)

        return ProcessingResult(blob_id=blob_id)

    return db.transact(txn_func)
```

```java
// Java service processes the queued work
public void processImageQueue() {
    while (running) {
        db.run(tx -> {
            // Dequeue work created by Python service
            Optional<QueueItem> item = queueSnap.dequeue(tx, "image_processing");

            if (item.isPresent()) {
                ImageProcessingJob job = parseJob(item.orElse(null));

                // Process the image
                ProcessedImage result = imageProcessor.process(
                    blobSnap.getBlob(tx, job.getBlobId())
                );

                // Store processed result
                String processedId = blobSnap.store(tx, result.getData());

                // Update user record
                userSnap.setProcessedImage(tx, job.getUserId(), processedId);

                // Notify completion
                notificationSnap.notify(tx, job.getUserId(),
                    "Image processing complete");
            }

            return null;
        });
    }
}
```

## Best Practices

### 1. Design for Composability

Always think about how your SNAP will be used with others:

```java
// ✅ Good - Composable design
public interface TaskQueueSnap {
    void enqueue(Transaction tx, Task task);
    Optional<Task> dequeue(Transaction tx, String queueName);
    void complete(Transaction tx, String taskId);
}

// ❌ Poor - Forces transaction management
public interface TaskQueueSnap {
    void enqueue(Task task);
    Optional<Task> dequeue(String queueName);
    void complete(String taskId);
}
```

### 2. Provide Convenience Methods

Offer both transactional and non-transactional interfaces:

```java
public class UserSnap {
    // Transactional interface for composition
    public User createUser(Transaction tx, UserData userData) {
        // Implementation
    }

    // Convenience method for standalone use
    public User createUser(UserData userData) {
        return db.run(tx -> createUser(tx, userData));
    }
}
```

### 3. Handle Retry Logic Properly

Let FoundationDB handle retries, make operations idempotent:

```java
public CompletableFuture<Void> incrementCounter(Transaction tx, String counterId) {
    return tx.get(counterKey(counterId)).thenAccept(currentBytes -> {
        long current = currentBytes != null ? deserializeLong(currentBytes) : 0L;

    // Idempotent increment
    tx.set(counterKey(counterId), serializeLong(current + 1));
}
```

## Common Pitfalls

### 1. Managing Transaction Lifecycle

```java
// ❌ WRONG - Breaks composability
public void updateUser(String userId, UserUpdate update) {
    db.run(tx -> {
        // Can't compose with other operations
        doUpdate(tx, userId, update);
        return null;
    });
}
```

### 2. Non-Idempotent Operations

```java
// ❌ WRONG - Not idempotent
public void addToCart(Transaction tx, String userId, String productId) {
    List<String> cart = getCart(tx, userId);
    cart.add(productId); // Adds duplicate on retry
    setCart(tx, userId, cart);
}

// ✅ CORRECT - Idempotent
public void addToCart(Transaction tx, String userId, String productId) {
    Set<String> cart = getCartAsSet(tx, userId);
    cart.add(productId); // Set prevents duplicates
    setCart(tx, userId, cart);
}
```

### 3. Large Transaction Scope

```java
// ❌ WRONG - Transaction too large
public void processBatch(List<Task> tasks) {
    db.run(tx -> {
        for (Task task : tasks) { // Could be thousands
            processTask(tx, task);
        }
        return null;
    });
}

// ✅ CORRECT - Batched processing
public void processBatch(List<Task> tasks) {
    for (List<Task> chunk : partition(tasks, 100)) {
        db.run(tx -> {
            for (Task task : chunk) {
                processTask(tx, task);
            }
            return null;
        });
    }
}
```

## Next Steps

- Learn about [Directory Usage](#core-concepts-02-directories) for namespace isolation
- Review [Compliance Requirements](#requirements-01-compliance)
- Explore the [Task Queue Example](#examples-01-task-queue) implementation