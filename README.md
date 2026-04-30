# 🚀 WorkPilot — Collaborative Project Workspace

A full-stack collaborative **Collaborative Project Management** web application where users can create/join projects, assign tasks, and track progress. Built as a simplified version of tools like Trello or Asana.

## 📸 Features

- **User Authentication** — Signup and login with JWT-based secure auth
- **Project Management** — Create projects and manage teams with Admin and Member roles
- **Task Management** — Create, assign, and track tasks with a Kanban board
- **Dashboard** — View stats by status, priority, user, and overdue tasks
- **Notifications** — Get updates for assignment, removal, completion, and task progress
- **Role-Based Access** — Admins manage everything, while members update their assigned tasks

## 🛠️ Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Frontend   | React 18 + Vite        |
| Styling    | Vanilla CSS            |
| Backend    | Node.js + Express      |
| Database   | MongoDB + Mongoose     |
| Auth       | JWT + bcrypt           |
| Deployment | Railway                |

## 📁 Project Structure

```text
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Layout and reusable components
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, Login, Register
│   │   ├── context/        # AuthContext and auth state
│   │   └── services/       # Axios API service layer
│   └── index.html
├── server/                 # Express Backend
│   ├── controllers/        # Business logic
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Auth, project, task, notification routes
│   └── server.js           # Entry point
├── package.json            # Root scripts
└── README.md
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18+
- npm
- MongoDB Atlas account or local MongoDB
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd workpilot
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/workpilot?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 4. Run in Development Mode

Open two terminals:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### 5. Open the App

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## 📦 Available Scripts

From the project root:

- `npm run install:all` — Install both client and server dependencies
- `npm run dev:server` — Start backend with nodemon
- `npm run dev:client` — Start frontend with Vite
- `npm run build` — Install dependencies and build the frontend
- `npm start` — Start the backend from the root

## 🚂 Railway Deployment

This project is designed to run as a **single Railway service** from the project root.

### 1. Push the Code to GitHub

Push the latest version of the project to your GitHub repository.

### 2. Create a Railway Project

1. Open Railway
2. Create a new project
3. Choose `Deploy from GitHub repo`
4. Select this repository

### 3. Add Railway Environment Variables

In Railway, add:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
NODE_ENV=production
```

Railway usually provides `PORT` automatically, so you do not need to add it manually.

### 4. Build and Start Commands

If Railway does not detect them automatically, use:

- Build command: `npm run build`
- Start command: `npm start`

### 5. Allow MongoDB Atlas Access

In MongoDB Atlas:

1. Open `Network Access`
2. Add IP address `0.0.0.0/0`

This allows Railway to connect to your MongoDB cluster.

### 6. Generate a Public Domain

After deployment:

1. Open your Railway service
2. Go to `Networking`
3. Generate a public domain

## 📋 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Search users |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |
| GET | `/api/tasks/dashboard/stats` | Dashboard statistics |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read` | Mark notifications as read |
| DELETE | `/api/notifications/clear` | Clear all notifications |

## 👥 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create/Delete projects | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Assign tasks | ✅ | ❌ |
| Edit all task fields | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| Delete tasks | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

## 🔧 Troubleshooting

- `MongoDB connection error` — Check `MONGODB_URI` in `server/.env` or Railway Variables
- `Missing required environment variable(s)` — Add the missing keys to `server/.env` or Railway Variables
- `Port 5000 is already in use` — Stop the old Node process or change `PORT` in `server/.env`
- Frontend cannot reach API locally — Make sure the backend is running and the proxy target in `client/vite.config.js` matches the backend port

## 🔗 Live Application

- **Live URL**: [Deployed on Railway](https://ethara-ai-assignment-production.up.railway.app/)
