# RANKERZ — Real-Time Contest & Exam Leaderboard Platform
> **Rise through the ranks.**

[![Course](https://img.shields.io/badge/Course-CSE3009%20NoSQL%20Databases-blue.svg)](https://vitap.ac.in)
[![Institution](https://img.shields.io/badge/Institution-VIT--AP%20University-orange.svg)](https://vitap.ac.in)
[![Faculty](https://img.shields.io/badge/Faculty-Prof.%20Harapriya%20Kar-purple.svg)](https://vitap.ac.in)
[![Project](https://img.shields.io/badge/Project%20Selection-Project%205%20(Real--Time%20Leaderboard)-green.svg)](#)
[![Databases](https://img.shields.io/badge/NoSQL%20Engines-Redis%205%20%2B%20MongoDB%207-red.svg)](#)
[![Tests](https://img.shields.io/badge/Automated%20Tests-10%2F10%20Passing-brightgreen.svg)](#)

---

## 1. Project Overview & Academic Identification
**Rankerz** is a full-stack, real-time contest and exam leaderboard web platform built for **CSE3009: NoSQL Databases** under the guidance of **Prof. Harapriya Kar** at **VIT-AP University (SCOPE)**.

The project models high-throughput academic evaluations and competitive programming contests, solving the relational database bottleneck by leveraging a dual-NoSQL architecture:
- **Redis (In-Memory Key-Value & Sorted Sets):** Uses Skip-Lists to calculate live ranks in $O(\log N)$ time and streams real-time updates via Redis Pub/Sub and WebSockets.
- **MongoDB (Persistent Document Store):** Maintains immutable submission audit trails, student profiles, and multi-stage analytical aggregations (`$match`, `$group`, `$bucket`, `$lookup`).

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with Vite & TypeScript
- **Styling:** Tailwind CSS with custom design system (Outfit & Inter fonts, glassmorphism cards, podium medals)
- **Icons:** Lucide React
- **Visualizations:** Recharts (Area charts for score progression, Bar charts for score distribution histograms)
- **Real-Time Client:** Socket.IO Client (subscribes to contest rooms)
- **Routing:** React Router v7

### Backend
- **Runtime:** Node.js (v24) with Express.js & TypeScript
- **Real-Time Bridge:** Socket.IO linked to dedicated Redis subscriber
- **Validation:** Zod schemas
- **Authentication:** JWT with bcrypt password hashing (10 salt rounds)
- **Test Suite:** Vitest & Supertest (10 automated unit and integration tests)

### Databases
- **Redis 5.0+:** Sorted Sets (`ZADD`, `ZREVRANGE`, `ZREVRANK`, `ZSCORE`, `ZCARD`, `ZREM`) & Pub/Sub channels
- **MongoDB 7.0+:** Mongoose ORM with compound unique indexes and aggregation pipelines

---

## 3. Quick Start & Local Setup

### Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **MongoDB** running locally on port `27017`
- **Redis** running locally on port `6379`
- *(Optional)* **Docker** & **Docker Compose**

### Installation

```bash
# Clone or navigate to the project directory
cd "Rankerz"

# Install all dependencies (root, server, client)
npm run install:all
```

### Environment Configuration
The repository includes an environment configuration template in [`.env.example`](.env.example). Create your local environment file (`server/.env`):

```bash
cp .env.example server/.env
```

Define your environment variables securely:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/rankerz_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_secure_random_jwt_secret_here
JWT_EXPIRES_IN=7d

# Initial Admin Seed Credentials (Set your own secure credentials)
ADMIN_NAME=Prof. Harapriya Kar
ADMIN_EMAIL=admin@rankerz.edu
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_STUDENT_ID=FACULTY-001
ADMIN_DEPT=CSE
```

> **Security Note:** Real `.env` files are strictly excluded via `.gitignore` and must never be committed to source control.

---

## 4. Seeding Database & Initializing Admin

Run the automated seed script to populate sample student profiles, contests, attempts, and initial Redis Sorted Sets:

```bash
# Seeds initial demonstration datasets and provisions admin account
npm run seed
```

### Demonstration Accounts Setup
When running locally for evaluation, the seed script sets up sample accounts for testing.
- **Admin Account:** Created using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in your private `server/.env`.
- **Student Accounts:** Sample students are seeded with passwords configured in your local environment.
- **Quick Evaluation:** When running in local development mode, the login page (`/login`) includes interactive demo buttons for one-click reviewer evaluation without exposing credentials in public repositories.

---

## 5. Running the Application

### Development Mode (Concurrent Server & Client)
```bash
# Starts Express API on http://localhost:5000 and Vite React on http://localhost:3000
npm run dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Service Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 6. Running Automated Tests

Run the Vitest test suite to verify Redis ranking, deterministic tie-breaking, CRUD operations, aggregations, and real-time score submissions:

```bash
npm run test
```

### Test Suite Summary (10/10 Passed):
```
 ✓ src/tests/leaderboard.test.ts (4 tests)
   ✓ should add participants and compute ranks in descending order (ZADD, ZREVRANK)
   ✓ should dynamically update score and re-rank participant immediately
   ✓ should handle deterministic tie-breaking based on completion time
   ✓ should retrieve paginated leaderboard with limit and offset (ZREVRANGE ... WITHSCORES)

 ✓ src/tests/api.test.ts (6 tests)
   ✓ GET /api/health should report MongoDB and Redis as healthy
   ✓ GET /api/contests should list seeded contests
   ✓ GET /api/contests/:contestId/leaderboard should return top ranked students from Redis
   ✓ GET /api/analytics/contests/:contestId should compute MongoDB aggregation pipelines
   ✓ GET /api/demo/redis-ops should demonstrate real Redis Sorted Set commands live
   ✓ POST /api/contests/:contestId/submissions should persist submission and update rank
```

---

## 7. Key Application Features

1. **Top 3 Podium Display:** Visual gold (#1), silver (#2), and bronze (#3) cards with avatar badges and score comparisons.
2. **Interactive Live Leaderboard:** Dynamic search, department filtering, Top 10 / Top 50 tabs, pagination, and "Find My Rank" button.
3. **Live Simulation Engine:** Admin toolbar allows injecting live score submissions or enabling continuous auto-streaming (3s interval) to observe real-time row flashing and toast notifications.
4. **Deterministic Tie-Breaking:**
   $$\text{CompositeScore} = \text{RawScore} + \left(1 - \frac{\text{CompletionTimeMs}}{100,000,000}\right) \times 0.001$$
   Earlier submissions receive a fractional bonus, ensuring fair ranking without corrupting integer score displays.
5. **Analytics Dashboard:** Visual histograms generated via MongoDB `$bucket` and departmental performance bar charts generated via `$lookup` and `$group`.
6. **Advanced Database Demo & Viva Panel:**
   - Real Redis CLI commands executed live with execution time in milliseconds.
   - MongoDB aggregation pipeline inspector.
   - CAP Theorem comparative matrix.
   - 20-question Viva preparation guide right in the UI.

---

## 8. Academic Project Deliverables

All required submission documents are generated and available in the `docs/` folder:
- **`docs/REPORT.pdf`:** Official submission report (3 pages, well within the 8-page maximum limit).
- **`docs/REPORT.md`:** Complete Markdown source of the academic report.
- **`docs/VIVA_GUIDE.md`:** In-depth answers to all 20 viva questions.
- **`docs/DATA_MODEL_AND_ARCHITECTURE.md`:** Mermaid ER diagrams, key namespacing, and system architecture.
- **`docs/RUBRIC_COMPLIANCE_CHECKLIST.md`:** 10/10 mark allocation mapping to codebase.
