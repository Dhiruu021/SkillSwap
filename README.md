# Skill Swap Platform

Full-stack skill exchange platform where users can teach what they know and learn what they want, with smart matching, real-time chat, session booking, ratings, and notifications.

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS, Axios, Vite
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB with Mongoose
- **Auth**: JWT
- **File Uploads**: Cloudinary

## Folder Structure (high level)

- `backend/`
  - `src/server.js` – Express app + Socket.io
  - `src/config/db.js` – Mongo connection
  - `src/models/*` – Users, Skills (embedded in user), Matches, Chats, Messages, Sessions, Reviews, Notifications
  - `src/controllers/*` – Auth, users, skills, matching, chat, sessions, reviews, notifications
  - `src/routes/*` – REST API routes
  - `src/middleware/*` – Auth + error handling
  - `src/socket/socket.js` – Socket.io events (chat, typing, online status)
  - `src/utils/*` – JWT, Cloudinary, notifications
- `frontend/`
  - Vite + React app
  - `src/App.jsx` – routing
  - `src/pages/*` – Landing, Login, Register, Dashboard, Profile, Skills, Matches, Chat, Sessions, Notifications
  - `src/layouts/DashboardLayout.jsx`
  - `src/state/AuthContext.jsx`
  - `src/hooks/useSocket.js`
  - `src/utils/api.js`

## Environment Variables

Create `.env` files from the provided examples.

### Backend `.env`

See `backend/.env.example`:

- `PORT` – API + Socket.io port (default `5000`)
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – strong secret for signing JWTs
- `JWT_EXPIRES_IN` – token lifetime, e.g. `7d`
- `CLIENT_URL` – frontend URL (`http://localhost:5173`)
- `CLOUDINARY_CLOUD_NAME` – your Cloudinary cloud
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend `.env`

See `frontend/.env.example`:

- `VITE_API_URL` – base API URL (e.g. `http://localhost:5000/api`)
- `VITE_SOCKET_URL` – Socket.io URL (e.g. `http://localhost:5000`)

## Installation

From the project root:

```bash
cd backend
npm install
cp .env.example .env   # then edit values

cd ../frontend
npm install
cp .env.example .env   # then edit values if needed
```

Ensure MongoDB is running locally or update `MONGO_URI` to your cluster.

## Running the Project Locally

### 1. Start the backend

```bash
cd backend
npm run dev
```

This starts Express + Socket.io on `http://localhost:5000`.

### 2. Start the frontend

```bash
cd frontend
npm run dev
```

Open the printed Vite URL (usually `http://localhost:5173`).

## API Overview

Base URL: `/api`

- **Auth**
  - `POST /auth/register` – register user (name, email, password, bio, skills)
  - `POST /auth/login` – login, returns JWT + user
- **Users**
  - `GET /users/me` – current user profile
  - `PUT /users/me` – update profile
  - `GET /users/search?skill=Guitar` – search by skill
  - `GET /users/:id` – public profile + reviews
- **Skills**
  - `GET /skills/me` – get teach/learn skills
  - `PUT /skills/me` – update skills
- **Matching**
  - `GET /matches/suggested` – smart suggested matches
  - `GET /matches` – your matches
  - `POST /matches` – create or get match between two users
- **Chat**
  - `GET /chats` – list chats
  - `POST /chats/from-match` – ensure chat for a match
  - `GET /chats/:chatId/messages` – chat history
  - `POST /chats/:chatId/messages` – send message (REST)
- **Sessions**
  - `GET /sessions` – learner/teacher sessions for current user
  - `POST /sessions` – create session request
  - `PATCH /sessions/:id/status` – accept/reject/update status
- **Reviews**
  - `POST /reviews` – submit rating/review for a session
- **Notifications**
  - `GET /notifications` – list notifications
  - `PATCH /notifications/:id/read` – mark as read

## Socket.io Events

- **Client → Server**
  - `authenticate` – `{ userId }` to mark user online
  - `joinChat` – `{ chatId }`
  - `typing` – `{ chatId, userId, isTyping }`
  - `sendMessage` – `{ chatId, senderId, content, fileBase64?, fileType? }`
- **Server → Client**
  - `onlineUsers` – array of userIds currently online
  - `typing` – typing state in a chat
  - `newMessage` – new message object

## Production Notes

- Use a managed MongoDB cluster and set `MONGO_URI` accordingly.
- Set strong `JWT_SECRET` and unique Cloudinary credentials.
- Serve the built frontend (Vite `npm run build`) behind a reverse proxy (e.g. Nginx) with HTTPS and point `CLIENT_URL`/`VITE_*` envs to production URLs.

