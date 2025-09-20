---
title: "Handling Large Transactions"
order: 3
description: "Patterns for working with FoundationDB's 5-second transaction limit"
---

# Handling Large Transactions

## The 5-Second Rule

FoundationDB enforces a strict 5-second limit on all transactions. This constraint, while initially seeming restrictive, actually encourages better system design by preventing long-running operations from blocking other work. However, some operations legitimately require more time - bulk imports, large data migrations, or complex computations.

SNAPs handle these scenarios through a pattern we call "prepare and flip" - performing heavy work outside the critical transaction path, then atomically switching to the new state.

## The Prepare and Flip Pattern

The core idea is simple:
1. **Prepare Phase**: Do expensive work in a temporary directory, possibly across multiple transactions
2. **Flip Phase**: Atomically switch from old to new state in a single, fast transaction

This pattern maintains ACID guarantees while working within FoundationDB's constraints.

## Implementation Strategy

### Step 1: Create a Temporary Working Directory

```java
public class LargeBatchProcessor {
    private final DirectorySubspace snapDirectory;
    private final DirectorySubspace tempDirectory;

    public CompletableFuture<Void> prepareLargeBatch(BatchData data) {
        // Create a unique temp directory for this operation
        String tempId = UUID.randomUUID().toString();

        return db.runAsync(tx ->
            tempDirectory.create(tx, Arrays.asList("batch", tempId))
        ).thenCompose(workDir -> {

            // Process data in chunks, each in its own transaction
            CompletableFuture<Void> processing = CompletableFuture.completedFuture(null);
            for (DataChunk chunk : data.getChunks()) {
                processing = processing.thenCompose(v ->
                    db.runAsync(tx -> {
                        processChunk(tx, workDir, chunk);
                        return null;
                    })
                );
            }

            // Once all preparation is complete, flip atomically
            return processing.thenCompose(v ->
                db.runAsync(tx -> {
                    flipToNewState(tx, workDir, tempId);
                    return null;
                })
            );
        });
    }
}
```

### Step 2: Process in Manageable Chunks

Break large operations into smaller pieces that fit comfortably within transaction limits:

```java
private void processChunk(Transaction tx, DirectorySubspace workDir, DataChunk chunk) {
    // Each chunk processes independently
    for (Record record : chunk.getRecords()) {
        byte[] key = workDir.pack(Tuple.from(record.getId()));
        byte[] value = serialize(record);
        tx.set(key, value);
    }

    // Track progress for potential recovery
    byte[] progressKey = workDir.pack(Tuple.from("progress", chunk.getId()));
    tx.set(progressKey, Tuple.from(chunk.getId(), System.currentTimeMillis()).pack());
}
```

### Step 3: Atomic Flip Operation

The flip operation must be simple and fast, typically just updating pointers or state markers:

```java
private void flipToNewState(Transaction tx, DirectorySubspace workDir, String tempId) {
    // Option 1: Update a pointer to the new directory
    byte[] activeKey = snapDirectory.pack(Tuple.from("active_batch"));
    tx.set(activeKey, Tuple.from(tempId).pack());

    // Option 2: Mark the batch as ready
    byte[] statusKey = workDir.pack(Tuple.from("status"));
    tx.set(statusKey, Tuple.from("ready", System.currentTimeMillis()).pack());

    // Schedule cleanup of old data (in a separate transaction)
    byte[] cleanupKey = snapDirectory.pack(Tuple.from("cleanup_queue", UUID.randomUUID()));
    tx.set(cleanupKey, Tuple.from(getPreviousBatchId()).pack());
}
```

## Cleanup and Recovery

### Automatic Cleanup

Temporary directories need cleanup to prevent unbounded growth:

```java
public class CleanupService {
    public void runCleanup(Transaction tx) {
        // Find abandoned temp directories (older than threshold)
        long cutoffTime = System.currentTimeMillis() - CLEANUP_THRESHOLD_MS;

        Range cleanupRange = snapDirectory.range(Tuple.from("cleanup_queue"));
        for (KeyValue kv : tx.getRange(cleanupRange)) {
            String batchId = Tuple.fromBytes(kv.getValue()).getString(0);

            // Remove in a separate transaction to avoid timeout
            scheduleRemoval(batchId);
            tx.clear(kv.getKey());
        }
    }

    private void scheduleRemoval(String batchId) {
        // Each removal in its own transaction
        CompletableFuture.runAsync(() -> {
            db.run(tx -> {
                return tempDirectory.openAsync(tx, Arrays.asList("batch", batchId))
                    .thenCompose(oldDir -> {
                        if (oldDir != null) {
                            return tempDirectory.removeAsync(tx, Arrays.asList("batch", batchId));
                        }
                        return CompletableFuture.completedFuture(null);
                    });
                return null;
            });
        });
    }
}
```

### Recovery from Interruption

If processing is interrupted, the temporary directory provides a checkpoint:

```java
public CompletableFuture<Void> recoverIncomplete() {
    // List all temp directories
    return db.runAsync(tx ->
        tempDirectory.listAsync(tx, Arrays.asList("batch"))
    ).thenCompose(tempDirs -> {
        CompletableFuture<Void> recovery = CompletableFuture.completedFuture(null);

        for (String batchId : tempDirs) {
            recovery = recovery.thenCompose(v ->
                db.runAsync(tx ->
                    tempDirectory.openAsync(tx, Arrays.asList("batch", batchId))
                ).thenCompose(workDir -> {
                    // Check if this batch is complete but not flipped
                    return db.runAsync(tx -> {
                        byte[] statusKey = workDir.pack(Tuple.from("status"));
                        return tx.get(statusKey).thenApply(value ->
                            value != null ? Tuple.fromBytes(value).getString(0) : "incomplete"
                        );
                    }).thenCompose(status -> {

                        if ("complete".equals(status)) {
                            // Retry the flip operation
                            return db.runAsync(tx -> {
                                flipToNewState(tx, workDir, batchId);
                                return null;
                            });
                        } else {
                            // Resume processing or mark for cleanup
                            return resumeOrCleanup(workDir, batchId);
                        }
                    });
                })
            );
        }
        return recovery;
    });
}
```

## Composability with Other SNAPs

The prepare-and-flip pattern maintains composability by exposing the flip operation as a transaction function:

```java
public interface BulkImporter {
    // Preparation phase - handles its own transactions
    CompletableFuture<String> prepareBulkImport(ImportData data);

    // Flip phase - composable with other operations
    void activateImport(Transaction tx, String importId);

    // Cleanup - runs asynchronously
    CompletableFuture<Void> cleanupOldImports();
}
```

This allows other SNAPs to coordinate with bulk operations:

```java
db.run(tx -> {
    // Atomic operation across multiple SNAPs
    String importId = preparedImportId;
    bulkImporter.activateImport(tx, importId);
    auditLog.recordImportActivation(tx, importId, userId);
    notificationQueue.enqueue(tx, new ImportCompleteEvent(importId));
    return importId;
});
```

## Best Practices

### 1. Keep Flip Operations Minimal
The flip operation should only update pointers or state markers. Avoid any computation or data transformation during the flip.

### 2. Use Time-Based Cleanup
Implement automatic cleanup of temporary directories older than a reasonable threshold (e.g., 24 hours for daily batches).

### 3. Make Operations Idempotent
Both preparation and flip operations should be idempotent, allowing safe retries after failures.

### 4. Monitor Progress
Track progress during preparation to enable resumption after interruptions:

```java
private void trackProgress(Transaction tx, DirectorySubspace workDir,
                          String phase, int completed, int total) {
    byte[] key = workDir.pack(Tuple.from("progress", phase));
    byte[] value = Tuple.from(completed, total, System.currentTimeMillis()).pack();
    tx.set(key, value);
}
```

### 5. Validate Before Flipping
Always validate the prepared data before flipping to the new state:

```java
private CompletableFuture<Boolean> validatePreparedData(Transaction tx, DirectorySubspace workDir) {
    // Check completeness
    byte[] completeKey = workDir.pack(Tuple.from("complete"));
    return tx.get(completeKey).thenCompose(completeValue -> {
        if (completeValue == null) {
            return CompletableFuture.completedFuture(false);
        }

        // Verify data integrity
        byte[] checksumKey = workDir.pack(Tuple.from("checksum"));
        return tx.get(checksumKey).thenApply(expectedChecksum -> {
            byte[] actualChecksum = computeChecksum(tx, workDir);
            return Arrays.equals(expectedChecksum, actualChecksum);
        });
    });
}
```

## Example: Bulk User Import

Here's a complete example of importing millions of users:

```java
public class UserBulkImporter {
    private static final int BATCH_SIZE = 10000;
    private final DirectorySubspace userSnap;
    private final DirectorySubspace tempSpace;

    public CompletableFuture<String> importUsers(InputStream csvStream) {
        String importId = UUID.randomUUID().toString();
        return db.runAsync(tx ->
            tempSpace.createOrOpenAsync(tx, Arrays.asList("import", importId))
        ).thenCompose(importDir -> {

        return CompletableFuture.supplyAsync(() -> {
            try (CSVReader reader = new CSVReader(csvStream)) {
                List<User> batch = new ArrayList<>();
                User user;
                int batchNum = 0;

                while ((user = reader.nextUser()) != null) {
                    batch.add(user);

                    if (batch.size() >= BATCH_SIZE) {
                        final int currentBatch = batchNum++;
                        final List<User> toProcess = new ArrayList<>(batch);

                        db.run(tx -> {
                            processBatch(tx, importDir, currentBatch, toProcess);
                            return null;
                        });

                        batch.clear();
                    }
                }

                // Process remaining
                if (!batch.isEmpty()) {
                    final int currentBatch = batchNum;
                    final List<User> toProcess = batch;

                    db.run(tx -> {
                        processBatch(tx, importDir, currentBatch, toProcess);
                        return null;
                    });
                }

                // Mark as complete
                db.run(tx -> {
                    byte[] key = importDir.pack(Tuple.from("status"));
                    tx.set(key, Tuple.from("ready").pack());
                    return null;
                });

                return importId;
            } catch (Exception e) {
                // Mark as failed for cleanup
                db.run(tx -> {
                    byte[] key = importDir.pack(Tuple.from("status"));
                    tx.set(key, Tuple.from("failed", e.getMessage()).pack());
                    return null;
                });
                throw new RuntimeException("Import failed", e);
            }
        });
    }

    public void activateImport(Transaction tx, String importId) {
        // Simple flip - just update the active import pointer
        byte[] activeKey = userSnap.pack(Tuple.from("active_import"));
        String previousId = getCurrentImportId(tx);

        tx.set(activeKey, Tuple.from(importId).pack());

        // Schedule cleanup of previous import
        if (previousId != null) {
            byte[] cleanupKey = userSnap.pack(
                Tuple.from("cleanup", System.currentTimeMillis())
            );
            tx.set(cleanupKey, Tuple.from(previousId).pack());
        }
    }

    private void processBatch(Transaction tx, DirectorySubspace importDir,
                              int batchNum, List<User> users) {
        for (User user : users) {
            byte[] key = importDir.pack(Tuple.from("users", user.getId()));
            byte[] value = serializeUser(user);
            tx.set(key, value);
        }

        // Track progress
        byte[] progressKey = importDir.pack(Tuple.from("progress", batchNum));
        tx.set(progressKey, Tuple.from(users.size(), System.currentTimeMillis()).pack());
    }
}
```

## Limitations and Considerations

### Transaction Size Limits
Even with chunking, each transaction still has a 10MB size limit. Design your chunks accordingly.

### Visibility During Preparation
Data in temporary directories is invisible to other operations until the flip. This is usually desirable but requires careful consideration of consistency requirements.

### Cleanup Overhead
Regular cleanup is essential but adds operational overhead. Consider scheduling cleanup during low-activity periods.

### Storage During Preparation
Temporary directories consume storage during preparation. For very large imports, this temporarily doubles storage requirements.

## Next Steps

- Learn about [Directory Usage](#core-concepts-02-directories) for namespace management
- Review [Transaction Composability](#core-concepts-01-transactions) for coordination patterns
- Study the [Task Queue Example](#examples-01-task-queue) for practical implementation