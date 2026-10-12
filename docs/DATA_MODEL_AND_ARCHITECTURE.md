# RANKERZ — SYSTEM ARCHITECTURE & DATA MODEL SPECIFICATION
## VIT-AP University | School of Computer Science & Engineering (SCOPE)
### CSE3009 — NoSQL Databases | Course Instructor: Prof. Harapriya Kar
#### Project 5: Real-Time Contest & Exam Leaderboard Platform

---

## 1. High-Level System Architecture

The following diagram illustrates the complete end-to-end data flow of **Rankerz**, connecting client browsers, WebSocket streams, Express backend, Redis 5 in-memory engine, and MongoDB persistent document storage.

```mermaid
graph TD
    Client[Web Browser / React + Tailwind CSS]
    Socket[Socket.IO Client]
    Express[Express.js REST API Server]
    SubService[Score Submission Pipeline Service]
    RedisPubSubSub[Redis Dedicated Subscriber]
    RedisPubSubPub[Redis Publisher Client]
    RedisZset[(Redis Sorted Sets ZSET In-Memory Skip-List)]
    MongoDB[(MongoDB Persistent Store - Collections & Indexes)]
    AggEngine[MongoDB Aggregation Pipeline Engine]

    Client -->|1. Submit Score HTTP POST| Express
    Express -->|2. Validate & Authorize| SubService
    SubService -->|3. Save Submission & Update Participation| MongoDB
    SubService -->|4. Update Composite Score ZADD| RedisZset
    SubService -->|5. Publish Score Event| RedisPubSubPub
    RedisPubSubPub -->|6. Publish to contest:id:updates| RedisPubSubSub
    RedisPubSubSub -->|7. Forward Event to Socket.IO| Express
    Express -->|8. Broadcast room event score_update| Socket
    Socket -->|9. Instant UI Update without Page Reload| Client
    Client -->|Read Leaderboard O log N| Express
    Express -->|ZREVRANGE & ZREVRANK| RedisZset
    Client -->|Request Analytics| Express
    Express -->|Run Aggregations $bucket, $group| AggEngine
    AggEngine --> MongoDB
```

---

## 2. MongoDB Data Model (Entity Relationship Diagram)

```mermaid
erDiagram
    USER ||--o{ CONTEST : "creates (admin)"
    USER ||--o{ SUBMISSION : "submits"
    USER ||--o{ PARTICIPATION : "enrolls in"
    CONTEST ||--o{ SUBMISSION : "contains"
    CONTEST ||--o{ PARTICIPATION : "tracks"
    SUBMISSION ||--o| PARTICIPATION : "latestSubmissionId"

    USER {
        ObjectId _id PK
        string name
        string email UK "Indexed"
        string passwordHash
        string role "admin | student"
        string studentIdCode "Indexed (e.g. 23BCE1001)"
        string department "CSE, ECE, AI&ML, BDS, IT..."
        date createdAt
    }

    CONTEST {
        ObjectId _id PK
        string title
        string description
        string contestType "exam | coding_contest"
        ObjectId createdBy FK
        date startTime
        date endTime
        number durationMinutes
        string status "draft | scheduled | live | completed | cancelled"
        number maxParticipants
        number maxScore
        string scoringRule "best_attempt | latest_attempt"
        string tieBreakingRule "earlier_submission | fewest_attempts"
        boolean isArchived
    }

    SUBMISSION {
        ObjectId _id PK
        ObjectId contestId FK "Compound Indexed"
        ObjectId studentId FK "Compound Indexed"
        number score
        number maximumScore
        number percentage
        number completionTimeMs
        number attemptNumber
        string status "evaluated"
        string idempotencyKey UK "Sparse Unique"
        date submittedAt "Indexed"
    }

    PARTICIPATION {
        ObjectId _id PK
        ObjectId contestId FK "Compound Unique UK"
        ObjectId studentId FK "Compound Unique UK"
        number currentScore "Indexed"
        number bestScore
        number attemptsCount
        ObjectId latestSubmissionId FK
        string participationStatus
        date registeredAt
        date lastUpdatedAt
    }
```

---

## 3. Redis Key Namespacing & Data Structures

| Key Pattern | Redis Type | Internal Data Structure | Operations Used | Purpose in Rankerz |
| :--- | :--- | :--- | :--- | :--- |
| `contest:{contestId}:leaderboard` | **Sorted Set (ZSET)** | Skip-List + Hash Map | `ZADD`, `ZREVRANGE`, `ZREVRANK`, `ZSCORE`, `ZCARD`, `ZREM` | Ultra-fast ranking computation in $O(\log N)$ time complexity. |
| `contest:{contestId}:updates` | **Pub/Sub Channel** | Pub/Sub Message Bus | `PUBLISH`, `PSUBSCRIBE` (pattern: `contest:*:updates`) | Live event streaming between backend and Socket.IO. |

### Deterministic Tie-Breaking Score Formula
$$\text{CompositeScore} = \text{RawScore} + \left(1 - \frac{\text{CompletionTimeMs}}{100,000,000}\right) \times 0.001$$
- **Primary:** Score (Integer points).
- **Secondary:** Lower completion time receives higher fractional bonus ($0.00000001$ to $0.00099999$).
- Preserves clean integer points in display while ensuring deterministic ordering in Redis!

---

## 4. Two-Tier Consistency & Self-Healing Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Server as Rankerz Express API
    participant Mongo as MongoDB (Durable Source of Truth)
    participant Redis as Redis 5 (In-Memory Skip-List)

    Note over Server,Redis: SCENARIO: Redis Cache Eviction or Server Restart
    Admin->>Server: POST /api/contests/:id/rebuild-leaderboard
    Server->>Mongo: Participation.find({ contestId })
    Mongo-->>Server: Returns all valid participant standings
    Server->>Redis: DEL contest:{id}:leaderboard
    Server->>Redis: ZADD contest:{id}:leaderboard (Batch insert all members)
    Redis-->>Server: OK (Restored N members)
    Server-->>Admin: 200 OK (Cache rebuilt, 0 data loss)
```
