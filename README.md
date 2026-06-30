# CodeRoom — Collaborative Code Editor

A real-time collaborative code editor built for the **Kodex Mini Hack-Sprint**.

## 🚀 Live Demo

> [Deployed Link — Coming Soon]

## 🛠 Tech Stack

| Layer    | Technology                       |
|----------|----------------------------------|
| Frontend | Vite + React                     |
| Backend  | Node.js + Express                |
| Realtime | Socket.io                        |
| Database | MongoDB (Mongoose ODM)           |

## ⚡ Conflict Resolution Strategy

Our system uses a **custom position-shifting transform with timestamp-based Last-Write-Wins (LWW)** — no banned libraries (Yjs, ShareDB, Automerge).

1. Every edit is sent as a **delta** (`{ type: 'insert'|'delete', position, content, timestamp, baseVersion }`), never as a full document payload.
2. The server maintains a **version counter** and a **recent operations buffer** (last 100 ops).
3. When a delta arrives with a `baseVersion` older than the current version, the server **transforms** its position against all operations applied since that version — shifting insert positions forward for prior inserts, backward for prior deletes.
4. For truly simultaneous edits at the **exact same position**, `timestamp` is the tiebreaker (later timestamp is placed after the earlier one); if timestamps match, `userId` provides deterministic ordering.
5. The transformed delta is applied to the server document, the version increments, and the delta is **broadcast to all other clients** with the new version.

**Tradeoff**: In edge cases with extremely rapid concurrent edits at overlapping positions, some cursor drift may occur — but content is never silently lost or overwritten. For a 24-hour sprint scope with ≤10 users, this is an acceptable engineering tradeoff.

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas URI (or local MongoDB)

### Backend
```bash
cd backend
cp .env.example .env    # fill in MONGO_URI
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```
CodeRoom/
├── backend/
│   ├── src/
│   │   ├── config/         # env config, database connection
│   │   ├── controllers/    # REST route handlers
│   │   ├── middlewares/     # error handling, async wrapper
│   │   ├── models/         # Mongoose schemas (Room, Document)
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # business logic layer
│   │   ├── sockets/        # Socket.io event handlers
│   │   ├── utils/          # ApiError, ApiResponse, deltaEngine
│   │   └── app.js          # Express app setup
│   └── server.js           # entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Editor, Room, Presence, Host)
│   │   ├── context/        # React Context (Socket, Room state)
│   │   ├── hooks/          # Custom hooks (useDelta, usePresence)
│   │   ├── pages/          # Page components
│   │   ├── services/       # Axios API client
│   │   └── App.jsx         # Router & providers
│   └── index.html
└── README.md
```
