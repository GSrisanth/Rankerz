# RANKERZ — VIVA & ORAL EXAMINATION PREPARATION GUIDE
## VIT-AP University | School of Computer Science & Engineering (SCOPE)
### CSE3009 — NoSQL Databases | Course Instructor: Prof. Harapriya Kar
#### Project 5: Real-Time Contest & Exam Leaderboard Platform

This guide provides precise, academically rigorous answers to potential viva questions based on the actual implementation of **Rankerz**.

---

### Q1: What is a NoSQL database and why are they classified into different models?
**Answer:**
A NoSQL ("Not Only SQL") database is a non-relational data store designed to handle massive data volumes, low-latency queries, flexible or schema-less structures, and horizontal scalability without the rigid tabular schemas, joins, and ACID lock bottlenecks of traditional relational RDBMS.
They are categorized into four primary data models based on their core access patterns:
1. **Key-Value Stores (e.g., Redis):** Simple key-to-value lookups; extremely fast in-memory execution.
2. **Document Stores (e.g., MongoDB):** Self-describing, hierarchical JSON/BSON documents supporting rich ad-hoc querying and embedded structures.
3. **Columnar / Wide-Column Stores (e.g., MonetDB, Cassandra):** Column-oriented storage optimized for OLAP aggregations over billions of rows.
4. **Graph Databases (e.g., Neo4j):** Nodes, edges, and properties optimized for relationship traversals and index-free adjacency.

---

### Q2: Why did you choose both Redis and MongoDB for Rankerz (Project 5)?
**Answer:**
Rankerz requires two fundamentally conflicting database capabilities:
1. **Live High-Throughput Rank Computation ($O(\log N)$):** During active contests, hundreds of students submit scores simultaneously. Redis Sorted Sets (in-memory skip-lists) compute real-time global ranks and reverse ranges in sub-millisecond time without scanning disk tables.
2. **Durable Historical Persistence & Complex Analytics:** Contest regulations demand immutable submission attempt audit trails, student profiles, and multi-stage analytical aggregations (score distribution histograms, standard deviation, department comparisons). MongoDB's flexible BSON document model and aggregation framework fulfill this requirement.

---

### Q3: What is a Redis Sorted Set (ZSET) and how does it work internally?
**Answer:**
A Redis Sorted Set is an in-memory collection of unique string members, where each member is associated with a floating-point score.
Internally, Redis implements a Sorted Set using a dual data structure:
- **Hash Map:** Maps each member to its score in $O(1)$ time for fast lookups.
- **Skip-List:** A probabilistic alternative to balanced trees that maintains elements sorted by score. It enables insertion (`ZADD`), score updates, rank lookups (`ZREVRANK`), and range retrieval (`ZREVRANGE`) in average $O(\log N)$ time complexity.

---

### Q4: How does `ZREVRANK` work in Redis?
**Answer:**
`ZREVRANK key member` traverses the internal skip-list in descending order (highest score to lowest score) to locate the element and returns its 0-based index. If the member exists, it executes in $O(\log N)$ time. If the member does not exist, it returns `nil`.

---

### Q5: Why is the rank returned by `ZREVRANK` zero-based, and how is it handled in Rankerz?
**Answer:**
Like standard C arrays and zero-based indexing in computer science, Redis returns 0 for the highest-scoring member (index 0).
In Rankerz:
In `RedisLeaderboardService.getRank(contestId, studentId)`, the service explicitly adds `+ 1` to the returned integer (`zeroBasedRank + 1`), ensuring that educators and students see standard 1-based ranks (#1, #2, #3, etc.) in the user interface and APIs.

---

### Q6: What is Redis Pub/Sub?
**Answer:**
Redis Pub/Sub is an in-memory publish/subscribe messaging paradigm. Senders (publishers) push messages onto designated string channels (e.g., `contest:{id}:updates`) without knowing who the receivers are. Subscribers listen on these channels asynchronously.
In Rankerz:
When `ScoreSubmissionService` commits a score, it publishes a JSON event payload to Redis channel `contest:{contestId}:updates`.

---

### Q7: Why is Socket.IO required in addition to Redis Pub/Sub?
**Answer:**
Redis Pub/Sub operates exclusively over raw TCP connections on the server side between database clients and backend services. Web browsers in client machines cannot directly open raw TCP connections to Redis due to browser security sandbox constraints and protocol incompatibility.
Socket.IO acts as the real-time bridge:
A dedicated background Redis subscriber client listens to `contest:*:updates` on the Node.js server. When an update arrives, Socket.IO broadcasts the message to the corresponding WebSocket room (`contest:{contestId}`), enabling connected web browsers to update their podiums and tables without refreshing the page.

---

### Q8: Why does MongoDB store historical submissions instead of only the latest score?
**Answer:**
Storing only the latest score destroys auditability. In academic exams and coding competitions:
1. Students may make multiple attempts; educators need to review progress over time.
2. Malpractice detection, time-to-completion analysis, and statistical distributions require granular attempt-level records.
3. If scoring rules change (e.g., switching from "latest attempt" to "best attempt"), all historical scores must remain intact in MongoDB to recompute standings without data loss.

---

### Q9: How does a MongoDB Aggregation Pipeline work?
**Answer:**
A MongoDB aggregation pipeline processes documents through a multi-stage sequence, where the output of each stage becomes the input to the next.
In Rankerz, we implement:
- **`$match`:** Filters documents for the selected contest.
- **`$project`:** Computes percentage scores relative to maximum contest points.
- **`$bucket`:** Partitions percentage scores into discrete statistical intervals (0-20%, 21-40%, 41-60%, 61-80%, 81-100%).
- **`$lookup`:** Joins the `participations` collection with the `users` collection to enrich records with department information.
- **`$group`:** Groups by department to compute `$avg`, `$max`, `$min`, and `$stdDevPop`.

---

### Q10: Which CRUD operations did you implement across both databases?
**Answer:**
**MongoDB:**
- **Create:** User registration (`User.create`), contest creation (`Contest.create`), submission logs (`Submission.create`), participation records (`Participation.create`).
- **Read:** Querying contests, paginated submission history, student profiles, and aggregation analytics.
- **Update:** Contest updates/status transitions (`findByIdAndUpdate`), student profile updates, participation scores (`findOneAndUpdate`).
- **Delete / Archive:** Contest soft deletion (`isArchived: true, status: 'cancelled'`).

**Redis:**
- **Create / Add:** `ZADD contest:{id}:leaderboard score studentId`.
- **Read:** `ZREVRANGE` (top 10/top 50), `ZREVRANK` (student rank), `ZSCORE` (participant score), `ZCARD` (participant count).
- **Update:** `ZADD` overwrites/updates the member's score in the Sorted Set.
- **Delete:** `ZREM contest:{id}:leaderboard studentId` (remove participant), `DEL` (clear leaderboard on contest archive).

---

### Q11: How are tied scores handled in Rankerz?
**Answer:**
In standard Redis Sorted Sets, when two members have the exact same score, Redis sorts them lexicographically by member ID, which is unfair to competitors.
Rankerz implements a deterministic **fractional composite score**:
$$\text{CompositeScore} = \text{RawScore} + \left(1 - \frac{\text{CompletionTimeMs}}{100,000,000}\right) \times 0.001$$
- The fractional bonus is strictly between $0.00000001$ and $0.00099999$.
- It never changes the raw integer points displayed to students.
- Between two students with identical raw scores (e.g., 900 points), the student who submitted earlier or took less completion time receives a higher composite score and is ranked ahead in the Redis skip-list.

---

### Q12: What happens if Redis loses its ranking data or restarts?
**Answer:**
Rankerz uses a **Two-Tiered Hybrid Consistency Strategy**:
MongoDB is the authoritative, durable source of truth. Redis acts as an ephemeral in-memory acceleration cache.
If Redis crashes or restarts:
1. No student data or submission history is lost because all records exist in MongoDB.
2. The administrator can click the **"Rebuild Cache"** button in the UI or call `POST /api/contests/:id/rebuild-leaderboard`.
3. The method `RedisLeaderboardService.rebuildLeaderboardFromMongo(contestId)` reads all current valid participation records from MongoDB and repopulates the Redis Sorted Set in $O(N)$ time.

---

### Q13: How do you prevent score manipulation?
**Answer:**
1. **Server-Side Authorization:** JWT middleware checks user roles. Students can only submit attempts for their own authenticated ID (`req.user._id`).
2. **Server-Side Contest Status Enforcement:** Submissions are rejected if contest status is not `live` or `scheduled`. Client clock tampering cannot bypass server validation.
3. **Score Boundary Checks:** Validates $0 \le \text{score} \le \text{contest.maxScore}$.
4. **Idempotency Keys:** Duplicate network requests cannot create multiple attempts.

---

### Q14: What happens if MongoDB succeeds but Redis fails during score submission?
**Answer:**
Since MongoDB and Redis are independent database engines, two-phase distributed commits are not automatically supported.
In Rankerz:
- If MongoDB commits the submission to disk but Redis connection drops, the submission is safely recorded in the persistent log.
- An error is logged, and the fallback allows the administrator or recovery worker to execute `rebuildLeaderboardFromMongo()` to bring the Redis Sorted Set back into full consistency.
- Historical data integrity is never compromised.

---

### Q15: Why not use only MongoDB?
**Answer:**
Calculating real-time ranks in MongoDB requires running a `$count` query for documents with scores greater than the current student's score, or maintaining an index and sorting all records ($O(N \log N)$).
Under high write concurrency (hundreds of live contest submissions per second), constant disk-backed re-sorting degrades query response times. Redis performs the same operation in-memory in $O(\log N)$ time ($< 1\text{ ms}$).

---

### Q16: Why not use only Redis?
**Answer:**
Redis is an in-memory store. Storing full multi-attempt submission histories, student metadata, department records, and multi-stage analytical aggregations in Redis would consume excessive expensive RAM and lacks complex relational query semantics (like `$lookup` joins and `$bucket` histograms).

---

### Q17: How does Redis differ from MongoDB in data storage and persistence?
**Answer:**
| Feature | Redis | MongoDB |
| :--- | :--- | :--- |
| **Primary Location** | RAM (In-Memory) | Disk (with WiredTiger memory cache) |
| **Data Model** | Key-Value, Sorted Sets, Hashes | Hierarchical BSON Documents |
| **Read Latency** | $< 1\text{ ms}$ | $5 - 15\text{ ms}$ |
| **Persistence Options** | RDB snapshots / AOF append log | Write-ahead journaling + multi-node replication |
| **Query Complexity** | Predefined key access, Skip-List commands | Rich ad-hoc query language, secondary indexes, aggregations |

---

### Q18: Explain the CAP Theorem and how it applies to Rankerz.
**Answer:**
The CAP Theorem (Eric Brewer) states that in any distributed data store, during a **Network Partition (P)**, the system can guarantee either **Consistency (C)** or **Availability (A)**, but not both.
In Rankerz:
- **MongoDB** is configured as a **CP** system. In a replica set partition, a primary steps down if it cannot reach the majority quorum, guaranteeing no stale or conflicting exam submissions are accepted.
- **Redis** operates as an in-memory accelerator. If network partitions isolate a Redis node, Rankerz treats it as a fast cache that can always be resynchronized from MongoDB.
- Cross-database consistency is maintained through a hybrid two-tier model with administrative reconciliation.

---

### Q19: What are the current limitations of Rankerz?
**Answer:**
1. Cross-database synchronization between MongoDB and Redis is currently handled synchronously in application code rather than via an asynchronous transactional outbox with Kafka or RabbitMQ.
2. Redis is configured as a single instance rather than a Redis Sentinel or Redis Cluster with automatic failover.
3. Scoring currently handles direct points and completion times; automated code sandboxing (e.g., Judge0 or Docker test runner) is external.

---

### Q20: How could Rankerz scale to 100,000 concurrent participants?
**Answer:**
1. **Redis Cluster with Key Sharding:** Shard sorted sets across Redis Cluster nodes using contest hash tags (`{contestId}:leaderboard`).
2. **Transactional Outbox & Message Broker:** Decouple score ingestion using Apache Kafka or RabbitMQ so score events are queued and processed asynchronously.
3. **MongoDB Sharded Cluster:** Shard the `submissions` and `participations` collections on `{ contestId: 1, studentId: 1 }`.
4. **Read Replicas & Socket.IO Redis Adapter:** Run multiple Node.js Socket.IO instances behind an Nginx load balancer connected via `@socket.io/redis-adapter`.
