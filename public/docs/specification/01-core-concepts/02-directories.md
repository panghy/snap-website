---
title: "Directory-Based Namespace Isolation"
description: "How SNAPs use FoundationDB directories to achieve complete namespace isolation and multi-tenancy"
---

# Directory-Based Namespace Isolation

FoundationDB's Directory layer is fundamental to SNAP design. It provides hierarchical namespace organization, automatic key generation, and the foundation for multi-tenant isolation. Understanding directories is crucial for building compliant SNAPs.

## Why Directories Matter

In traditional key-value stores, developers manually construct keys, leading to:

- **Key Collisions**: Different components accidentally using the same keys
- **Namespace Pollution**: Difficulty organizing related data
- **Multi-Tenancy Challenges**: Complex manual key prefixing schemes
- **Migration Difficulties**: Changing key structures requires careful coordination

FoundationDB's Directory layer solves these problems by providing:

- **Automatic Key Generation**: Directories map to unique binary prefixes
- **Hierarchical Organization**: Natural tree structure for organizing data
- **Isolation Guarantees**: Complete separation between directory subspaces
- **Multi-Tenancy Support**: Built-in tenant isolation through directory paths

## Directory Configuration Requirement

### Mandatory Directory Parameter

**CRITICAL REQUIREMENT**: Every SNAP MUST accept its operating directory as a configuration parameter (either through constructor or configuration class). This design principle ensures:

- **Multiple Instances**: Users can instantiate multiple SNAPs operating on different directories
- **Complete Isolation**: Each SNAP instance operates entirely within its assigned directory
- **State Portability**: An entire SNAP's state can be moved/copied by relocating its directory
- **Testing Flexibility**: Tests can use separate directories without interference
- **Disaster Recovery**: SNAPs can be re-opened on different directories for backup/restore

```java
// ✅ CORRECT - Directory provided as parameter
public class UserSnap {
    private final DirectorySubspace snapDirectory;

    public UserSnap(Database db, List<String> directoryPath) {
        this.snapDirectory = DirectoryLayer.getDefault()
            .createOrOpen(db, directoryPath)
            .get();
    }

    // Alternative: Configuration object approach
    public UserSnap(Database db, SnapConfig config) {
        this.snapDirectory = DirectoryLayer.getDefault()
            .createOrOpen(db, config.getDirectoryPath())
            .get();
    }
}

// ❌ WRONG - Hardcoded directory path
public class UserSnap {
    private final DirectorySubspace snapDirectory;

    public UserSnap(Database db) {
        // Never hardcode directory paths!
        this.snapDirectory = DirectoryLayer.getDefault()
            .createOrOpen(db, List.of("users"))  // BAD!
            .get();
    }
}
```

### Benefits of Directory Configuration

This requirement enables powerful operational patterns:

```java
// Multiple isolated instances of the same SNAP
UserSnap productionUsers = new UserSnap(db, List.of("prod", "users"));
UserSnap stagingUsers = new UserSnap(db, List.of("staging", "users"));
UserSnap testUsers = new UserSnap(db, List.of("test", "users"));

// Move/copy entire SNAP state by directory operations
DirectoryLayer.getDefault().move(db,
    List.of("tenants", "old-tenant", "users"),
    List.of("archive", "2024", "old-tenant", "users")
).get();

// Re-open SNAP on moved directory
UserSnap archivedUsers = new UserSnap(db,
    List.of("archive", "2024", "old-tenant", "users"));
```

## Directory Fundamentals

### Directory Structure

Directories form a hierarchical tree structure, similar to file systems:

```
Root Directory
├── tenants/
│   ├── tenant-a/
│   │   ├── users/
│   │   ├── orders/
│   │   └── queues/
│   └── tenant-b/
│       ├── users/
│       ├── orders/
│       └── queues/
└── system/
    ├── metadata/
    └── analytics/
```

### Directory Creation

SNAPs must use the Directory layer API for all key operations:

```java
public class UserSnap {
    private final DirectorySubspace userDir;

    public UserSnap(Database db, List<String> directoryPath) {
        // Create or open directory subspace
        this.userDir = DirectoryLayer.getDefault()
            .createOrOpen(db, directoryPath)
            .get();
    }

    public void storeUser(Transaction tx, String userId, User user) {
        // Use directory subspace to generate keys
        byte[] key = userDir.pack(userId);
        tx.set(key, serialize(user));
    }

    public User getUser(Transaction tx, String userId) {
        byte[] key = userDir.pack(userId);
        byte[] data = tx.get(key).get();
        return data != null ? deserialize(data) : null;
    }
}
```

### Key Generation

Never construct raw keys manually. Always use directory subspaces:

```java
// ❌ WRONG - Manual key construction
public void storeUser(Transaction tx, String userId, User user) {
    String rawKey = "users/" + userId;
    tx.set(rawKey.getBytes(), serialize(user));
}

// ✅ CORRECT - Directory-based keys
public void storeUser(Transaction tx, String userId, User user) {
    byte[] key = userDir.pack(userId);
    tx.set(key, serialize(user));
}
```

## Multi-Tenant Architecture

### Tenant Isolation Pattern

Each tenant gets its own directory tree, ensuring complete isolation:

```java
public class TenantAwareUserSnap {
    private final Database db;
    private final DirectoryLayer dirLayer;

    public TenantAwareUserSnap(Database db) {
        this.db = db;
        this.dirLayer = DirectoryLayer.getDefault();
    }

    // Get tenant-specific directory
    private CompletableFuture<DirectorySubspace> getTenantUserDir(Transaction tx, String tenantId) {
        return dirLayer.createOrOpenAsync(tx,
            List.of("tenants", tenantId, "users"));
    }

    public User createUser(Transaction tx, String tenantId,
                          String userId, UserData userData) {
        DirectorySubspace tenantDir = getTenantUserDir(tenantId);
        byte[] key = tenantDir.pack(userId);

        User user = new User(userId, userData);
        tx.set(key, serialize(user));
        return user;
    }

    public User getUser(Transaction tx, String tenantId, String userId) {
        DirectorySubspace tenantDir = getTenantUserDir(tenantId);
        byte[] key = tenantDir.pack(userId);
        byte[] data = tx.get(key).get();
        return data != null ? deserialize(data) : null;
    }
}
```

### Tenant-Scoped Operations

All operations are automatically scoped to the tenant's directory:

```java
public List<User> listUsers(Transaction tx, String tenantId) {
    DirectorySubspace tenantDir = getTenantUserDir(tenantId);

    // Range scan is automatically scoped to tenant
    List<User> users = new ArrayList<>();
    for (KeyValue kv : tx.getRange(tenantDir.range())) {
        // Only sees data for this tenant
        users.add(deserialize(kv.getValue()));
    }
    return users;
}
```

## Directory Best Practices

### 1. Consistent Path Structure

Establish and follow consistent directory path conventions:

```java
// ✅ Consistent structure
List.of("tenants", tenantId, "users")           // User data
List.of("tenants", tenantId, "orders")          // Order data
List.of("tenants", tenantId, "queues", queueName) // Queue data

// ❌ Inconsistent structure
List.of("tenant", tenantId, "user-data")        // Different naming
List.of("tenants", tenantId, "order")           // Singular vs plural
List.of(tenantId, "queue", queueName)           // Missing tenant prefix
```

### 2. Lazy Directory Creation

Create directories on-demand to avoid unnecessary metadata:

```java
public class LazyUserSnap {
    private final ConcurrentMap<String, DirectorySubspace> dirCache
        = new ConcurrentHashMap<>();

    private DirectorySubspace getUserDir(String tenantId) {
        return dirCache.computeIfAbsent(tenantId, id ->
            DirectoryLayer.getDefault()
                .createOrOpen(db, List.of("tenants", id, "users"))
                .get()
        );
    }
}
```

### 3. Directory Path Validation

Validate tenant identifiers to prevent directory traversal:

```java
public void validateTenantId(String tenantId) {
    if (tenantId == null || tenantId.trim().isEmpty()) {
        throw new IllegalArgumentException("Tenant ID cannot be null or empty");
    }

    // Prevent directory traversal attacks
    if (tenantId.contains("..") || tenantId.contains("/") ||
        tenantId.contains("\\")) {
        throw new IllegalArgumentException("Invalid tenant ID: " + tenantId);
    }

    // Enforce reasonable length limits
    if (tenantId.length() > 100) {
        throw new IllegalArgumentException("Tenant ID too long");
    }
}
```

## Advanced Directory Patterns

### Hierarchical Data Organization

Use directory hierarchies to organize related data:

```java
public class OrderSnap {
    private final DirectoryLayer dirLayer;

    // Organize orders by year/month for efficient queries
    private DirectorySubspace getOrderDir(String tenantId, LocalDate orderDate) {
        String year = String.valueOf(orderDate.getYear());
        String month = String.format("%02d", orderDate.getMonthValue());

        return dirLayer.createOrOpen(db,
            List.of("tenants", tenantId, "orders", year, month)
        ).get();
    }

    public void storeOrder(Transaction tx, String tenantId, Order order) {
        DirectorySubspace orderDir = getOrderDir(tenantId, order.getDate());
        byte[] key = orderDir.pack(order.getId());
        tx.set(key, serialize(order));
    }

    // Efficient range queries within a month
    public List<Order> getOrdersForMonth(Transaction tx, String tenantId,
                                        int year, int month) {
        LocalDate date = LocalDate.of(year, month, 1);
        DirectorySubspace orderDir = getOrderDir(tenantId, date);

        List<Order> orders = new ArrayList<>();
        for (KeyValue kv : tx.getRange(orderDir.range())) {
            orders.add(deserialize(kv.getValue()));
        }
        return orders;
    }
}
```

### Cross-SNAP Directory Coordination

Different SNAPs can share directory structures while maintaining isolation:

```java
public class EcommerceDirectoryStructure {
    public static final String TENANTS_ROOT = "tenants";

    // User-related directories
    public static List<String> userPath(String tenantId) {
        return List.of(TENANTS_ROOT, tenantId, "users");
    }

    public static List<String> userProfilePath(String tenantId) {
        return List.of(TENANTS_ROOT, tenantId, "user-profiles");
    }

    // Order-related directories
    public static List<String> orderPath(String tenantId) {
        return List.of(TENANTS_ROOT, tenantId, "orders");
    }

    public static List<String> orderItemsPath(String tenantId) {
        return List.of(TENANTS_ROOT, tenantId, "order-items");
    }

    // Queue directories
    public static List<String> queuePath(String tenantId, String queueName) {
        return List.of(TENANTS_ROOT, tenantId, "queues", queueName);
    }
}
```

### Directory Migration Patterns

Handle directory structure evolution gracefully:

```java
public class MigratableUserSnap {
    private static final String CURRENT_VERSION = "v2";

    private DirectorySubspace getUserDir(String tenantId) {
        // Try current version first
        try {
            return DirectoryLayer.getDefault()
                .open(db, List.of("tenants", tenantId, "users", CURRENT_VERSION))
                .get();
        } catch (NoSuchDirectoryException e) {
            // Fall back to migration if needed
            return migrateUserDirectory(tenantId);
        }
    }

    private DirectorySubspace migrateUserDirectory(String tenantId) {
        return db.run(tx -> {
            // Check for old version
            List<String> oldPath = List.of("tenants", tenantId, "users");
            DirectorySubspace oldDir;
            try {
                oldDir = DirectoryLayer.getDefault().open(tx, oldPath).get();
            } catch (NoSuchDirectoryException e) {
                // No old data, create new
                return DirectoryLayer.getDefault()
                    .createOrOpen(tx, List.of("tenants", tenantId, "users", CURRENT_VERSION))
                    .get();
            }

            // Create new directory
            DirectorySubspace newDir = DirectoryLayer.getDefault()
                .createOrOpen(tx, List.of("tenants", tenantId, "users", CURRENT_VERSION))
                .get();

            // Migrate data
            for (KeyValue kv : tx.getRange(oldDir.range())) {
                Tuple key = oldDir.unpack(kv.getKey());
                byte[] newKey = newDir.pack(key);
                tx.set(newKey, kv.getValue());
            }

            // Remove old directory
            DirectoryLayer.getDefault().remove(tx, oldPath);

            return newDir;
        });
    }
}
```

## Performance Considerations

### Directory Caching

Cache directory subspaces to avoid repeated lookups:

```java
public class CachedDirectorySnap {
    private final LoadingCache<String, DirectorySubspace> dirCache;

    public CachedDirectorySnap(Database db) {
        this.dirCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(1, TimeUnit.HOURS)
            .build(tenantId -> createUserDirectory(tenantId));
    }

    private DirectorySubspace createUserDirectory(String tenantId) {
        return DirectoryLayer.getDefault()
            .createOrOpen(db, List.of("tenants", tenantId, "users"))
            .get();
    }

    public DirectorySubspace getUserDir(String tenantId) {
        return dirCache.get(tenantId);
    }
}
```

### Efficient Range Operations

Leverage directory structure for efficient queries:

```java
// Efficient: Scoped to specific directory
public List<User> getUsersInTenant(Transaction tx, String tenantId) {
    DirectorySubspace userDir = getUserDir(tenantId);
    // Range scan only within tenant's user directory
    return streamRange(tx, userDir.range())
        .map(this::deserializeUser)
        .collect(toList());
}

// Inefficient: Scans across all tenants
public List<User> findUsersByEmail(Transaction tx, String email) {
    // This would require scanning all tenant directories
    // Better to use a dedicated email index
}
```

## Multi-Language Considerations

### Consistent Path Construction

Ensure all language implementations use identical directory paths:

```java
// Java
List.of("tenants", tenantId, "users")
```

```python
# Python
["tenants", tenant_id, "users"]
```

```go
// Go
[]string{"tenants", tenantID, "users"}
```

### Cross-Language Directory Access

Different language implementations can access the same directories:

```python
# Python code writing data
import fdb
fdb.api_version(730)

def store_user(db, tenant_id: str, user_id: str, user_data: dict):
    @fdb.transactional
    def txn_func(tr):
        dir_layer = fdb.directory
        user_dir = dir_layer.create_or_open(
            tr, ("tenants", tenant_id, "users")
        )
        key = user_dir.pack((user_id,))
        tr[key] = json.dumps(user_data).encode('utf-8')

    db.transact(txn_func)
```

```java
// Java code reading the same data
public User getUser(Transaction tx, String tenantId, String userId) {
    DirectorySubspace userDir = DirectoryLayer.getDefault()
        .open(tx, List.of("tenants", tenantId, "users"))
        .get();

    byte[] key = userDir.pack(userId);
    byte[] data = tx.get(key).get();

    if (data != null) {
        String json = new String(data, StandardCharsets.UTF_8);
        return parseUserFromJson(json);
    }
    return null;
}
```

## Common Directory Pitfalls

### 1. Manual Key Construction

```java
// ❌ WRONG - Bypasses directory isolation
public void storeUser(Transaction tx, String tenantId, String userId, User user) {
    String key = "tenant_" + tenantId + "_user_" + userId;
    tx.set(key.getBytes(), serialize(user));
}
```

### 2. Inconsistent Path Structure

```java
// ❌ WRONG - Inconsistent paths
List.of("tenant", tenantId, "user", userId)      // Sometimes singular
List.of("tenants", tenantId, "users", userId)    // Sometimes plural
```

### 3. Missing Tenant Isolation

```java
// ❌ WRONG - No tenant isolation
List.of("users", userId)  // All tenants share same space

// ✅ CORRECT - Proper tenant isolation
List.of("tenants", tenantId, "users", userId)
```

### 4. Directory Handle Leaks

```java
// ❌ WRONG - Creates new directory handle every time
public User getUser(Transaction tx, String tenantId, String userId) {
    DirectorySubspace userDir = DirectoryLayer.getDefault()
        .createOrOpen(tx, List.of("tenants", tenantId, "users"))
        .get();
    // ... rest of method
}

// ✅ CORRECT - Cache directory handles
private final DirectorySubspace userDir = // initialized once
```

## Next Steps

- Review [Compliance Requirements](#requirements-01-compliance) for directory usage requirements
- Explore the [Task Queue Example](#examples-01-task-queue) to see directories in practice
- Learn about [Transaction Composability](#core-concepts-01-transactions) for combining SNAPs